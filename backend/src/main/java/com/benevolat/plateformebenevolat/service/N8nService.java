package com.benevolat.plateformebenevolat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Intégration n8n (automatisations rédigées par l'IA : rappel 24 h, renfort urgent, résumé hebdomadaire).
 *
 * - Sortant : déclenchement des webhooks n8n ({N8N_BASE_URL}/{chemin}), après commit et en arrière-plan.
 * - Entrant : vérification du secret partagé envoyé par n8n dans l'en-tête X-Webhook-Secret (NF01).
 *
 * Si N8N_BASE_URL n'est pas défini, n8n est considéré comme désactivé et le backend
 * envoie lui-même les rappels (RappelService).
 */
@Service
@Slf4j
public class N8nService {

    public static final String HEADER_SECRET = "X-Webhook-Secret";

    @Value("${n8n.base-url:}")
    private String baseUrl;

    @Value("${n8n.secret:}")
    private String secret;

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ExecutorService envois = Executors.newVirtualThreadPerTaskExecutor();

    /** n8n est utilisé si son URL et le secret partagé sont configurés. */
    public boolean actif() {
        return !baseUrl.isBlank() && !secret.isBlank();
    }

    /** Vérifie le secret d'un appel entrant (temps constant). */
    public void verifierSecret(String recu) {
        if (secret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Intégration n8n non configurée.");
        }
        if (recu == null || !MessageDigest.isEqual(
                recu.getBytes(StandardCharsets.UTF_8), secret.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Secret n8n invalide.");
        }
    }

    /** Appelle le webhook n8n {base}/{chemin} après le commit, sans bloquer ni faire échouer l'appelant. */
    public void declencher(String chemin, Map<String, ?> payload) {
        if (!actif()) return;
        String url = baseUrl.replaceAll("/+$", "") + "/" + chemin;
        String json = toJson(payload);
        Runnable envoi = () -> envois.execute(() -> {
            try {
                HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                        .timeout(Duration.ofSeconds(10))
                        .header("Content-Type", "application/json")
                        .header(HEADER_SECRET, secret)
                        .POST(HttpRequest.BodyPublishers.ofString(json))
                        .build();
                HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                if (res.statusCode() / 100 != 2) {
                    log.warn("Webhook n8n {} a répondu {}", chemin, res.statusCode());
                }
            } catch (Exception e) {
                log.warn("Webhook n8n {} injoignable : {}", chemin, e.getMessage());
            }
        });
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    envoi.run();
                }
            });
        } else {
            envoi.run();
        }
    }

    /* ─── Sérialisation JSON minimale (String, nombres, booléens, Map, Collection) ─── */

    static String toJson(Object v) {
        if (v == null) return "null";
        if (v instanceof Number || v instanceof Boolean) return v.toString();
        if (v instanceof Map<?, ?> m) {
            StringBuilder sb = new StringBuilder("{");
            m.forEach((k, val) -> {
                if (sb.length() > 1) sb.append(',');
                sb.append(toJson(String.valueOf(k))).append(':').append(toJson(val));
            });
            return sb.append('}').toString();
        }
        if (v instanceof Collection<?> c) {
            StringBuilder sb = new StringBuilder("[");
            for (Object o : c) {
                if (sb.length() > 1) sb.append(',');
                sb.append(toJson(o));
            }
            return sb.append(']').toString();
        }
        StringBuilder sb = new StringBuilder("\"");
        for (char ch : v.toString().toCharArray()) {
            switch (ch) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (ch < 0x20) sb.append(String.format("\\u%04x", (int) ch));
                    else sb.append(ch);
                }
            }
        }
        return sb.append('"').toString();
    }
}

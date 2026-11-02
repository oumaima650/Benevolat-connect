package com.benevolat.plateformebenevolat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Scores de matching calculés par Google Gemini (offre gratuite AI Studio, même modèle que les workflows n8n).
 * Si la clé n'est pas configurée ou si l'appel échoue, l'appelant utilise la formule pondérée (F48).
 */
@Service
@Slf4j
public class GeminiService {

    private static final String SYSTEME = """
            Tu es le moteur de recommandation de CountMeIn, une plateforme marocaine qui met en relation \
            bénévoles et associations. Pour chaque mission fournie, donne un score entier de 0 à 100 indiquant \
            à quel point elle convient à ce bénévole. Critères, par ordre d'importance : la distance comparée \
            au rayon de déplacement (une mission hors du rayon est peu pertinente, une mission à distance \
            convient à tous), l'adéquation entre ses compétences et celles requises, le lien entre sa \
            biographie et la description de la mission, le besoin de l'association (renfort urgent, places \
            restantes) et l'historique avec l'association. N'utilise pas le domaine de la mission. \
            Pour chaque mission, écris une explication d'une phrase (moins de 140 caractères) en français, \
            qui tutoie le bénévole et ne cite que des informations fournies. N'invente rien.""";

    private static final String SCHEMA = """
            {"type":"object","properties":{"scores":{"type":"array","items":{"type":"object","properties":{\
            "idMission":{"type":"integer"},"score":{"type":"integer"},"explication":{"type":"string"}},\
            "required":["idMission","score","explication"]}}},"required":["scores"]}""";

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-flash-latest}")
    private String modele;

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final JsonMapper json = JsonMapper.builder().build();

    public record ScoreIA(long idMission, int score, String explication) {}

    public boolean actif() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * @param benevole données du bénévole (sans nom ni e-mail)
     * @param missions missions candidates, chacune avec un champ "idMission"
     * @return les scores, ou vide si l'IA est indisponible ou la réponse invalide
     */
    public Optional<List<ScoreIA>> scorer(Map<String, Object> benevole, List<Map<String, Object>> missions) {
        if (!actif() || missions.isEmpty()) return Optional.empty();
        try {
            Map<String, Object> corps = Map.of(
                    "systemInstruction", Map.of("parts", List.of(Map.of("text",
                            SYSTEME + " Réponds uniquement avec un objet JSON valide respectant ce schéma : " + SCHEMA))),
                    "contents", List.of(Map.of("role", "user", "parts", List.of(Map.of("text",
                            "Données :\n" + json.writeValueAsString(Map.of("benevole", benevole, "missions", missions)))))),
                    // Sortie JSON imposée ; température basse pour des scores stables
                    "generationConfig", Map.of("responseMimeType", "application/json", "temperature", 0.2));

            HttpRequest req = HttpRequest.newBuilder(URI.create(
                            "https://generativelanguage.googleapis.com/v1beta/models/" + modele + ":generateContent"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(corps)))
                    .build();
            HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() / 100 != 2) {
                log.warn("Gemini a répondu {} : scores calculés par la formule.", res.statusCode());
                return Optional.empty();
            }
            return lireReponse(res.body(), missions);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        } catch (Exception e) {
            log.warn("Gemini indisponible ({}) : scores calculés par la formule.", e.getMessage());
            return Optional.empty();
        }
    }

    /** Ne garde que les scores des missions demandées, bornés à 0-100. */
    private Optional<List<ScoreIA>> lireReponse(String body, List<Map<String, Object>> missions) {
        JsonNode candidat = json.readTree(body).path("candidates").path(0);
        if (!"STOP".equals(candidat.path("finishReason").asString())) return Optional.empty();

        StringBuilder texte = new StringBuilder();
        candidat.path("content").path("parts").forEach(p -> texte.append(p.path("text").asString()));
        JsonNode scores = json.readTree(texte.toString().replaceAll("^```(?:json)?\\s*|\\s*```$", "")).path("scores");

        Set<Long> demandees = new HashSet<>();
        missions.forEach(m -> demandees.add(((Number) m.get("idMission")).longValue()));
        List<ScoreIA> result = new ArrayList<>();
        for (JsonNode s : scores) {
            long id = s.path("idMission").asLong();
            if (!demandees.remove(id)) continue;
            int score = Math.max(0, Math.min(100, s.path("score").asInt()));
            String explication = s.path("explication").asString();
            result.add(new ScoreIA(id, score, explication.length() > 300 ? explication.substring(0, 300) : explication));
        }
        return result.isEmpty() ? Optional.empty() : Optional.of(result);
    }
}

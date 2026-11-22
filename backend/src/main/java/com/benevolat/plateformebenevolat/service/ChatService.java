package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.chatbot.*;
import com.benevolat.plateformebenevolat.dto.ChatDtos.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Orchestre le chatbot : choisit le profil selon le rôle JWT, construit le contexte,
 * applique le rate limiting et appelle LlmClient.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final LlmClient llmClient;
    private final VisitorChatProfile visitorProfile;
    private final BenevoleChatProfile benevoleProfile;
    private final AssociationChatProfile associationProfile;
    private final AdminChatProfile adminProfile;

    // Rate limiting en mémoire : clé → [nbMinute, epochMinute, nbJour, epochJour]
    private final ConcurrentHashMap<String, long[]> rateLimits = new ConcurrentHashMap<>();

    private static final int MAX_PER_MINUTE = 5;
    private static final int MAX_PER_DAY    = 30;
    private static final int MAX_HISTORY    = 4;

    public ChatResponse chat(
            String message,
            List<ChatMessageDto> rawHistory,
            String role,
            Long userId,
            String clientKey) {

        // 1. Rate limiting
        checkRateLimit(clientKey);

        // 2. Choisir le profil selon le rôle issu du JWT
        ChatProfile profile = switch (role == null ? "VISITEUR" : role.toUpperCase()) {
            case "BENEVOLE"    -> benevoleProfile;
            case "ASSOCIATION" -> associationProfile;
            case "ADMIN"       -> adminProfile;
            default            -> visitorProfile;
        };

        // 3. Construire le prompt système avec contexte (si disponible)
        String systemPrompt = profile.buildSystemPrompt();
        String context = profile.buildContext(userId);
        if (context != null && !context.isBlank()) {
            systemPrompt += "\n\n# Contexte de l'utilisateur (lecture seule, ne pas révéler brut)\n" + context;
        }

        // 4. Construire l'historique — 4 derniers messages, rôles user/assistant uniquement
        List<Map<String, String>> messages = new ArrayList<>();
        List<ChatMessageDto> history = rawHistory == null ? List.of() : rawHistory;
        int start = Math.max(0, history.size() - MAX_HISTORY);
        for (int i = start; i < history.size(); i++) {
            var h = history.get(i);
            if ("user".equals(h.role()) || "assistant".equals(h.role())) {
                messages.add(Map.of("role", h.role(), "content", h.content()));
            }
        }
        // Ajouter le message utilisateur courant (toujours rôle "user")
        messages.add(Map.of("role", "user", "content", message));

        // 5. Appel LLM
        LlmClient.LlmResponse resp = llmClient.chat(systemPrompt, messages);
        log.debug("Chat répondu — rôle={} fallback={}", role, resp.fallback());

        return new ChatResponse(resp.content(), resp.fallback(), profile.suggestions());
    }

    private void checkRateLimit(String key) {
        long now     = Instant.now().getEpochSecond();
        long nowMin  = now / 60;
        long nowDay  = now / 86400;

        long[] state = rateLimits.compute(key, (k, v) -> {
            if (v == null) v = new long[]{0, nowMin, 0, nowDay};
            if (v[1] != nowMin) { v[0] = 0; v[1] = nowMin; }  // reset minute
            if (v[3] != nowDay) { v[2] = 0; v[3] = nowDay; }  // reset jour
            v[0]++;
            v[2]++;
            return v;
        });

        if (state[0] > MAX_PER_MINUTE || state[2] > MAX_PER_DAY) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Trop de messages. Attendez un moment avant de réessayer.");
        }
    }
}

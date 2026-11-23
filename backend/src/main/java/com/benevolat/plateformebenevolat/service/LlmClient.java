package com.benevolat.plateformebenevolat.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Client générique pour les APIs LLM au format OpenAI (Groq, OpenAI, etc.).
 * Retry automatique sur le modèle de secours. Aucune stack trace exposée.
 */
@Component
@Slf4j
public class LlmClient {

    @Value("${llm.api-url:https://api.groq.com/openai/v1}")
    private String apiUrl;

    @Value("${llm.model:llama3-8b-8192}")
    private String model;

    @Value("${llm.model-fallback:llama3-groq-70b-8192-tool-use-preview}")
    private String modelFallback;

    @Value("${llm.api-key:}")
    private String apiKey;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final JsonMapper json = JsonMapper.builder().build();

    public record LlmResponse(String content, boolean fallback) {}

    static class RetryableException extends RuntimeException {
        RetryableException(String msg) { super(msg); }
    }

    /**
     * Appelle l'API avec le modèle principal, puis le modèle de secours si nécessaire.
     */
    public LlmResponse chat(String systemPrompt, List<Map<String, String>> messages) {
        return chat(systemPrompt, messages, 300, 0.2);
    }

    /**
     * Variante paramétrable (utilisée pour la rédaction d'emails : réponse plus longue, plus créative).
     */
    public LlmResponse chat(String systemPrompt, List<Map<String, String>> messages,
                            int maxTokens, double temperature) {
        // 1er essai — modèle principal
        try {
            String result = callApi(model, systemPrompt, messages, maxTokens, temperature);
            if (result != null && !result.isBlank()) {
                return new LlmResponse(result, false);
            }
        } catch (RetryableException e) {
            log.warn("LLM {} a échoué ({}), essai avec {}", model, e.getMessage(), modelFallback);
        } catch (Exception e) {
            log.warn("LLM {} erreur inattendue, essai avec {} : {}", model, modelFallback, e.getMessage());
        }

        // 2e essai — modèle de secours
        try {
            String result = callApi(modelFallback, systemPrompt, messages, maxTokens, temperature);
            if (result != null && !result.isBlank()) {
                return new LlmResponse(result, false);
            }
        } catch (Exception e) {
            log.warn("LLM fallback {} aussi échoué : {}", modelFallback, e.getMessage());
        }

        return new LlmResponse("L'assistant est momentanément indisponible. Consultez la FAQ.", true);
    }

    private String callApi(String selectedModel, String systemPrompt, List<Map<String, String>> messages,
                           int maxTokens, double temperature)
            throws Exception {

        List<Map<String, String>> allMessages = new ArrayList<>();
        allMessages.add(Map.of("role", "system", "content", systemPrompt));
        allMessages.addAll(messages);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", selectedModel);
        body.put("messages", allMessages);
        body.put("temperature", temperature);
        body.put("max_tokens", maxTokens);
        // Désactiver le mode "thinking" des modèles gpt-oss Groq (économise les tokens)
        if (selectedModel.startsWith("openai/gpt-oss")) {
            body.put("reasoning_effort", "low");
        }

        HttpRequest req = HttpRequest.newBuilder(URI.create(apiUrl + "/chat/completions"))
                .timeout(Duration.ofSeconds(maxTokens > 400 ? 25 : 8))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
                .build();

        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        int status = res.statusCode();

        if (status == 429 || status == 404 || status >= 500) {
            throw new RetryableException("HTTP " + status);
        }
        if (status / 100 != 2) {
            throw new RuntimeException("HTTP " + status);
        }

        JsonNode node = json.readTree(res.body());
        return node.path("choices").path(0).path("message").path("content").asString(null);
    }
}

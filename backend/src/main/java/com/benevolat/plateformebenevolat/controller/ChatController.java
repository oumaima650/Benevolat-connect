package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.ChatDtos.*;
import com.benevolat.plateformebenevolat.service.ChatService;
import com.benevolat.plateformebenevolat.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoint public du chatbot. Le rôle est déduit UNIQUEMENT du JWT s'il est présent,
 * jamais du body de la requête.
 */
@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;
    private final JwtService jwtService;

    @PostMapping("/message")
    public ResponseEntity<ChatResponse> message(
            @Valid @RequestBody ChatRequest request,
            HttpServletRequest httpRequest) {

        // Extraire rôle et userId depuis le JWT (jamais depuis le body)
        String role   = null;
        Long   userId = null;
        String auth   = httpRequest.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.substring(7);
            try {
                if (jwtService.isTokenValid(token)) {
                    role   = jwtService.extractRole(token);
                    userId = jwtService.extractUserId(token);
                }
            } catch (Exception ignored) {}
        }

        // Clé de rate limiting : userId si connecté, sinon IP
        String clientKey = userId != null
                ? "u:" + userId
                : "ip:" + resolveIp(httpRequest);

        ChatResponse resp = chatService.chat(
                request.message(),
                request.history(),
                role,
                userId,
                clientKey);

        return ResponseEntity.ok(resp);
    }

    private String resolveIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}

package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.*;
import com.benevolat.plateformebenevolat.service.AuthService;
import com.benevolat.plateformebenevolat.service.PasswordResetService;
import com.benevolat.plateformebenevolat.service.RecaptchaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller REST gérant l'authentification, l'inscription, la validation reCAPTCHA
 * et la réinitialisation des mots de passe.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final RecaptchaService recaptchaService;

    /**
     * Endpoint pour inscrire un utilisateur (Bénévole ou Association).
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Demande d'inscription reçue pour : {}", request.getEmail());
        AuthResponse response = authService.register(request);

        if (response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Endpoint pour connecter un utilisateur.
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Demande de connexion reçue pour : {}", request.getEmail());
        AuthResponse response = authService.login(request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * Endpoint pour demander la réinitialisation d'un mot de passe (Mot de passe oublié).
     * POST /api/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Demande de mot de passe oublié pour : {}", request.getEmail());
        boolean success = passwordResetService.processForgotPassword(request);

        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", "Si l'adresse email existe dans notre système, un lien de réinitialisation vous a été envoyé."
        ));
    }

    /**
     * Endpoint pour valider et appliquer le nouveau mot de passe.
     * POST /api/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Demande de changement de mot de passe via token.");
        boolean success = passwordResetService.resetPassword(request);

        if (success) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Votre mot de passe a été réinitialisé avec succès !"
            ));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "Le jeton de réinitialisation est invalide ou a expiré."
            ));
        }
    }

    /**
     * Endpoint indépendant de validation d'un jeton reCAPTCHA.
     * POST /api/auth/verify-recaptcha
     */
    @PostMapping("/verify-recaptcha")
    public ResponseEntity<Map<String, Object>> verifyRecaptcha(@RequestBody Map<String, String> body) {
        String token = body.get("recaptchaToken");
        boolean isValid = recaptchaService.verifyRecaptcha(token);

        return ResponseEntity.ok(Map.of(
                "success", isValid,
                "message", isValid ? "Jeton reCAPTCHA valide." : "Jeton reCAPTCHA invalide."
        ));
    }
}

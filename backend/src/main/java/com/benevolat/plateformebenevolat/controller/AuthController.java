package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.*;
import com.benevolat.plateformebenevolat.service.AuthService;
import com.benevolat.plateformebenevolat.service.OtpService;
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
 * Controller REST gérant l'authentification, l'inscription (avec OTP + JWT),
 * la réinitialisation des mots de passe et la validation reCAPTCHA.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"})
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final RecaptchaService recaptchaService;
    private final OtpService otpService;

    /** POST /api/auth/register — Inscription Bénévole ou Association (retourne JWT) */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Demande d'inscription reçue pour : {}", request.getEmail());
        AuthResponse response = authService.register(request);
        return response.isSuccess()
                ? ResponseEntity.status(HttpStatus.CREATED).body(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /** POST /api/auth/login — Connexion (retourne JWT) */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Demande de connexion : {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    /** POST /api/auth/send-otp — Envoie un OTP à 6 chiffres par email */
    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "").toLowerCase().trim();
        if (email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email requis."));
        }
        otpService.generateAndSendOtp(email);
        return ResponseEntity.ok(Map.of("success", true, "message", "Code OTP envoyé à " + email));
    }

    /** POST /api/auth/verify-otp — Vérifie l'OTP soumis par l'utilisateur */
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "").toLowerCase().trim();
        String code = body.getOrDefault("code", "").trim();
        boolean valid = otpService.verifyOtp(email, code);
        return valid
                ? ResponseEntity.ok(Map.of("success", true, "message", "Code OTP valide."))
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Code OTP invalide ou expiré."));
    }

    /** POST /api/auth/forgot-password — Mot de passe oublié (envoi lien email) */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Mot de passe oublié pour : {}", request.getEmail());
        passwordResetService.processForgotPassword(request);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Si l'adresse email existe dans notre système, un lien de réinitialisation vous a été envoyé."
        ));
    }

    /** POST /api/auth/reset-password — Réinitialise le mot de passe via token */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean success = passwordResetService.resetPassword(request);
        return success
                ? ResponseEntity.ok(Map.of("success", true, "message", "Votre mot de passe a été réinitialisé avec succès !"))
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("success", false, "message", "Le jeton de réinitialisation est invalide ou a expiré."));
    }

    /** POST /api/auth/verify-recaptcha — Validation indépendante du token reCAPTCHA */
    @PostMapping("/verify-recaptcha")
    public ResponseEntity<Map<String, Object>> verifyRecaptcha(@RequestBody Map<String, String> body) {
        boolean isValid = recaptchaService.verifyRecaptcha(body.get("recaptchaToken"));
        return ResponseEntity.ok(Map.of("success", isValid, "message", isValid ? "Jeton reCAPTCHA valide." : "Jeton reCAPTCHA invalide."));
    }
}

package com.benevolat.plateformebenevolat.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Vérifie et affiche la configuration email au démarrage.
 */
@Component
@Slf4j
public class MailStartupLogger {

    @Value("${spring.mail.host:NON DÉFINI}")
    private String mailHost;

    @Value("${spring.mail.port:0}")
    private int mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @PostConstruct
    public void logMailConfig() {
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("📧 Configuration Email :");
        log.info("   Host     : {}", mailHost);
        log.info("   Port     : {}", mailPort);
        log.info("   Username : {}", mailUsername.isBlank() ? "❌ VIDE" : mailUsername);
        log.info("   Password : {}", mailPassword.isBlank() ? "❌ VIDE" : "✅ défini (" + mailPassword.length() + " chars)");
        if (mailUsername.isBlank() || mailPassword.isBlank()) {
            log.warn("⚠️  Email NON configuré — mode DEV (codes OTP dans les logs)");
        } else {
            log.info("✅ Email configuré — les emails seront envoyés via {}", mailHost);
        }
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
}

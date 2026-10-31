package com.benevolat.plateformebenevolat.config;

import com.benevolat.plateformebenevolat.entity.Administrateur;
import com.benevolat.plateformebenevolat.entity.StatutUtilisateur;
import com.benevolat.plateformebenevolat.repository.AdministrateurRepository;
import com.benevolat.plateformebenevolat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crée le compte administrateur au premier démarrage s'il n'en existe aucun
 * (identifiants : ADMIN_EMAIL / ADMIN_PASSWORD du .env).
 */
@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class AdminInitializer implements CommandLineRunner {

    private final AdministrateurRepository administrateurRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (administrateurRepository.count() > 0) return;
        if (userRepository.existsByEmail(adminEmail)) {
            log.warn("Impossible de créer l'administrateur : l'e-mail {} est déjà utilisé par un autre compte.", adminEmail);
            return;
        }
        Administrateur admin = new Administrateur(adminEmail, passwordEncoder.encode(adminPassword), null);
        admin.setStatut(StatutUtilisateur.ACTIF);
        administrateurRepository.save(admin);
        log.info("Compte administrateur créé : {} (changez le mot de passe via ADMIN_PASSWORD)", adminEmail);
    }
}

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
        // Si un admin existe déjà avec le bon email → rien à faire
        if (administrateurRepository.findByEmail(adminEmail).isPresent()) {
            log.info("Compte administrateur déjà présent : {}", adminEmail);
            return;
        }

        // Si un admin existe avec un autre email (ex. valeur par défaut) → le mettre à jour
        if (administrateurRepository.count() > 0) {
            Administrateur existing = administrateurRepository.findAll().get(0);
            String oldEmail = existing.getEmail();
            existing.setEmail(adminEmail);
            existing.setMotDePasseHash(passwordEncoder.encode(adminPassword));
            existing.setStatut(StatutUtilisateur.ACTIF);
            administrateurRepository.save(existing);
            log.info("Compte administrateur mis à jour : {} → {}", oldEmail, adminEmail);
            return;
        }

        // Sinon : créer un nouveau compte admin
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

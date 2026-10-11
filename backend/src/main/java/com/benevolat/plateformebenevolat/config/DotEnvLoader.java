package com.benevolat.plateformebenevolat.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;

/**
 * Charge le fichier .env situé à la racine du projet backend
 * avant que Spring initialise ses beans.
 * Enregistré via META-INF/spring.factories.
 */
@Slf4j
public class DotEnvLoader implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Cherche .env dans le répertoire courant ou dans le répertoire parent
        File envFile = findEnvFile();
        if (envFile == null || !envFile.exists()) {
            log.debug(".env file not found — skipping");
            return;
        }

        Map<String, Object> props = new HashMap<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                // Ignorer les lignes vides et les commentaires
                if (line.isEmpty() || line.startsWith("#")) continue;
                int idx = line.indexOf('=');
                if (idx <= 0) continue;
                String key = line.substring(0, idx).trim();
                String value = line.substring(idx + 1).trim();
                // Ne pas écraser les variables système déjà définies
                if (System.getenv(key) == null) {
                    props.put(key, value);
                }
            }
            // Priorité haute : se charge avant application.properties
            environment.getPropertySources().addFirst(
                new MapPropertySource("dotenv", props)
            );
            log.info(".env chargé depuis : {} ({} variables)", envFile.getAbsolutePath(), props.size());
        } catch (Exception e) {
            log.warn("Impossible de charger .env : {}", e.getMessage());
        }
    }

    private File findEnvFile() {
        // 1. Répertoire courant (quand lancé depuis le dossier backend)
        File f = new File(".env");
        if (f.exists()) return f;
        // 2. Répertoire du projet (IntelliJ lance parfois depuis la racine)
        f = new File("backend/.env");
        if (f.exists()) return f;
        return null;
    }
}

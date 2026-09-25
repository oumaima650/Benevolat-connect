package com.benevolat.plateformebenevolat.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Contrôleur de santé de l'API.
 * Permet au frontend (et à n'importe quel outil de monitoring) de vérifier
 * que le backend est bien démarré et répond correctement.
 *
 * @RestController combine @Controller + @ResponseBody :
 * les méthodes renvoient directement du JSON (pas de vue Thymeleaf).
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    /**
     * GET /api/health
     * Retourne un objet JSON simple indiquant que l'API est opérationnelle.
     * Utilisé par app.js pour afficher le statut dans #api-status.
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "OK",
                "message", "API Bénévolat opérationnelle"
        );
    }
}

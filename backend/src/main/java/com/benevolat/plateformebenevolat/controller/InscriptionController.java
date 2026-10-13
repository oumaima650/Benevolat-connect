package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.InscriptionResponseDto;
import com.benevolat.plateformebenevolat.entity.Inscription;
import com.benevolat.plateformebenevolat.service.InscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Endpoints d'inscription / annulation d'un bénévole à une mission.
 * Sous /api/benevoles/** → nécessite une authentification JWT.
 */
@RestController
@RequestMapping("/api/benevoles/missions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InscriptionController {

    private final InscriptionService inscriptionService;

    /** POST /api/benevoles/missions/{missionId}/inscription — s'inscrire */
    @PostMapping("/{missionId}/inscription")
    public ResponseEntity<?> inscrire(Authentication authentication, @PathVariable Long missionId) {
        try {
            InscriptionResponseDto res = inscriptionService.inscrire(authentication.getName(), missionId);
            return ResponseEntity.ok(res);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()));
        }
    }

    /** DELETE /api/benevoles/missions/{missionId}/inscription — annuler son inscription */
    @DeleteMapping("/{missionId}/inscription")
    public ResponseEntity<?> annuler(Authentication authentication, @PathVariable Long missionId) {
        try {
            InscriptionResponseDto res = inscriptionService.annuler(authentication.getName(), missionId);
            return ResponseEntity.ok(res);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()));
        }
    }

    /** GET /api/benevoles/missions/{missionId}/inscription — statut de l'inscription du bénévole */
    @GetMapping("/{missionId}/inscription")
    public ResponseEntity<?> getInscription(Authentication authentication, @PathVariable Long missionId) {
        try {
            Inscription inscription = inscriptionService.getInscriptionActive(authentication.getName(), missionId);
            if (inscription == null) {
                return ResponseEntity.ok(Map.of("inscrit", false));
            }
            return ResponseEntity.ok(Map.of(
                    "inscrit", true,
                    "statut", inscription.getStatut().name(),
                    "rang", inscription.getRang()
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("inscrit", false));
        }
    }
}

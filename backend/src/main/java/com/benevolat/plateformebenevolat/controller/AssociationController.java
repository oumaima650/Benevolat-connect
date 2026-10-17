package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.*;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import com.benevolat.plateformebenevolat.service.AssociationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/associations")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"})
public class AssociationController {

    private final AssociationRepository associationRepository;
    private final AssociationService associationService;

    /* ── Public : liste des associations ── */
    @GetMapping
    @Transactional(readOnly = true)
    public List<AssociationSummaryDto> getAssociations() {
        return associationRepository.findAll().stream().map(a ->
            new AssociationSummaryDto(
                a.getIdUtilisateur(),
                a.getNom(),
                a.getDescription(),
                a.getDomaine(),
                a.getVille(),
                a.getEmail(),
                a.getContact(),
                a.getPhotoProfil(),
                a.getLatitude(),
                a.getLongitude()
            )
        ).collect(Collectors.toList());
    }

    /* ── Dashboard : profil de l'association connectée ── */

    @GetMapping("/me")
    public ResponseEntity<AssociationProfileDto> getMyProfile(Authentication auth) {
        return ResponseEntity.ok(associationService.getProfile(auth.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<AssociationProfileDto> updateMyProfile(
            Authentication auth,
            @RequestBody UpdateAssociationRequest request) {
        return ResponseEntity.ok(associationService.updateProfile(auth.getName(), request));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        String currentPassword = body.getOrDefault("currentPassword", "");
        String newPassword = body.getOrDefault("newPassword", "");
        if (currentPassword.isBlank() || newPassword.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", "Ancien et nouveau mot de passe requis."));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", "Le mot de passe doit contenir au moins 6 caractères."));
        }
        associationService.changePassword(auth.getName(), currentPassword, newPassword);
        return ResponseEntity.ok(Map.of("success", true, "message", "Mot de passe mis à jour avec succès."));
    }

    @PatchMapping("/me/statut")
    public ResponseEntity<Map<String, Object>> toggleStatut(Authentication auth) {
        String newStatut = associationService.toggleStatut(auth.getName());
        return ResponseEntity.ok(Map.of("success", true, "statut", newStatut,
            "message", "ACTIF".equals(newStatut) ? "Compte réactivé." : "Compte désactivé."));
    }


    @GetMapping("/me/missions")
    public ResponseEntity<List<MissionDto>> getMyMissions(Authentication auth) {
        return ResponseEntity.ok(associationService.getMissions(auth.getName()));
    }

    @PostMapping("/me/missions")
    public ResponseEntity<MissionDto> createMission(
            Authentication auth,
            @Valid @RequestBody MissionRequest request) {
        MissionDto created = associationService.createMission(auth.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/me/missions/{id}")
    public ResponseEntity<MissionDto> updateMission(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody MissionRequest request) {
        return ResponseEntity.ok(associationService.updateMission(auth.getName(), id, request));
    }

    @PatchMapping("/me/missions/{id}/statut")
    public ResponseEntity<MissionDto> changeStatut(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statut = body.getOrDefault("statut", "");
        return ResponseEntity.ok(associationService.changeStatut(auth.getName(), id, statut));
    }

    @GetMapping("/me/missions/{id}/inscrits")
    public ResponseEntity<List<InscritDto>> getInscrits(
            Authentication auth,
            @PathVariable Long id) {
        return ResponseEntity.ok(associationService.getInscrits(auth.getName(), id));
    }

    @PostMapping("/me/missions/{id}/renfort")
    public ResponseEntity<MissionDto> demanderRenfort(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        int nbBenevoles = ((Number) body.getOrDefault("nbBenevoles", 0)).intValue();
        return ResponseEntity.ok(associationService.demanderRenfort(auth.getName(), id, nbBenevoles));
    }

    @PostMapping("/me/missions/{id}/images")
    public ResponseEntity<ImageEvenementDto> ajouterImage(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String url = body.getOrDefault("url", "");
        String titre = body.getOrDefault("titre", "");
        String description = body.getOrDefault("description", "");
        ImageEvenementDto dto = associationService.ajouterImageMission(auth.getName(), id, url, titre, description);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/me/missions/{id}/images")
    public ResponseEntity<List<ImageEvenementDto>> getImages(
            Authentication auth,
            @PathVariable Long id) {
        return ResponseEntity.ok(associationService.getImagesMission(auth.getName(), id));
    }
}

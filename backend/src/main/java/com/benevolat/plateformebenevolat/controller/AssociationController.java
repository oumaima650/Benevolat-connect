package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.*;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import com.benevolat.plateformebenevolat.service.AssociationDashboardService;
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
    private final AssociationDashboardService dashboardService;

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
        return ResponseEntity.ok(dashboardService.getProfile(auth.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<AssociationProfileDto> updateMyProfile(
            Authentication auth,
            @RequestBody UpdateAssociationRequest request) {
        return ResponseEntity.ok(dashboardService.updateProfile(auth.getName(), request));
    }

    /* ── Dashboard : missions de l'association connectée ── */

    @GetMapping("/me/missions")
    public ResponseEntity<List<MissionDto>> getMyMissions(Authentication auth) {
        return ResponseEntity.ok(dashboardService.getMyMissions(auth.getName()));
    }

    @PostMapping("/me/missions")
    public ResponseEntity<MissionDto> createMission(
            Authentication auth,
            @Valid @RequestBody MissionRequest request) {
        MissionDto created = dashboardService.createMission(auth.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/me/missions/{id}")
    public ResponseEntity<MissionDto> updateMission(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody MissionRequest request) {
        return ResponseEntity.ok(dashboardService.updateMission(auth.getName(), id, request));
    }

    @PatchMapping("/me/missions/{id}/statut")
    public ResponseEntity<MissionDto> changeStatut(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statut = body.getOrDefault("statut", "");
        return ResponseEntity.ok(dashboardService.changeStatut(auth.getName(), id, statut));
    }
}

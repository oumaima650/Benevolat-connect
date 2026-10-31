package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.AdminDtos.*;
import com.benevolat.plateformebenevolat.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** API de l'espace administrateur — réservée au rôle ADMIN (SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    /** F34 : statistiques globales. */
    @GetMapping("/stats")
    public Stats stats() {
        return adminService.getStats();
    }

    /* ─── F39 : associations ─── */

    @GetMapping("/associations")
    public List<AssociationAdmin> associations(@RequestParam(required = false) String statut) {
        return adminService.getAssociations(statut);
    }

    @PatchMapping("/associations/{id}/valider")
    public AssociationAdmin valider(Authentication auth, @PathVariable Long id) {
        return adminService.validerAssociation(auth.getName(), id);
    }

    /** Body : { "motif": "..." } */
    @PatchMapping("/associations/{id}/refuser")
    public AssociationAdmin refuser(Authentication auth, @PathVariable Long id,
                                    @RequestBody Map<String, String> body) {
        return adminService.refuserAssociation(auth.getName(), id, body.get("motif"));
    }

    /* ─── F40 : comptes ─── */

    @GetMapping("/utilisateurs")
    public List<UtilisateurAdmin> utilisateurs(@RequestParam(required = false) String role,
                                               @RequestParam(required = false) String q) {
        return adminService.getUtilisateurs(role, q);
    }

    /** Body (optionnel) : { "motif": "..." } */
    @PatchMapping("/utilisateurs/{id}/suspendre")
    public UtilisateurAdmin suspendre(Authentication auth, @PathVariable Long id,
                                      @RequestBody(required = false) Map<String, String> body) {
        return adminService.changerStatutCompte(auth.getName(), id, true, body != null ? body.get("motif") : null);
    }

    @PatchMapping("/utilisateurs/{id}/reactiver")
    public UtilisateurAdmin reactiver(Authentication auth, @PathVariable Long id) {
        return adminService.changerStatutCompte(auth.getName(), id, false, null);
    }

    /* ─── F41 : modération des missions ─── */

    /** filtre : toutes (défaut) | signalees | masquees */
    @GetMapping("/missions")
    public List<MissionAdmin> missions(@RequestParam(required = false) String filtre) {
        return adminService.getMissions(filtre);
    }

    /** Body (optionnel) : { "motif": "..." } */
    @PatchMapping("/missions/{id}/masquer")
    public MissionAdmin masquer(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        return adminService.masquerMission(id, body != null ? body.get("motif") : null);
    }

    @PatchMapping("/missions/{id}/retablir")
    public MissionAdmin retablir(@PathVariable Long id) {
        return adminService.retablirMission(id);
    }
}

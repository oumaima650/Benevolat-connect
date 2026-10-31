package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.N8nDtos.*;
import com.benevolat.plateformebenevolat.service.N8nDataService;
import com.benevolat.plateformebenevolat.service.N8nService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API appelée par les workflows n8n. Pas de JWT : chaque appel doit porter
 * l'en-tête X-Webhook-Secret égal à N8N_WEBHOOK_SECRET (NF01).
 */
@RestController
@RequestMapping("/api/n8n")
@RequiredArgsConstructor
public class N8nController {

    private final N8nService n8nService;
    private final N8nDataService n8nDataService;

    /** Workflow « Rappel 24 h » : inscriptions à rappeler. */
    @GetMapping("/rappels")
    public List<Rappel> rappels(@RequestHeader(value = N8nService.HEADER_SECRET, required = false) String secret) {
        n8nService.verifierSecret(secret);
        return n8nDataService.rappelsAEnvoyer();
    }

    /** Workflow « Rappel 24 h » : marque le rappel comme envoyé (un seul rappel par inscription). */
    @PostMapping("/rappels/{inscriptionId}/envoye")
    public ResponseEntity<Void> rappelEnvoye(@RequestHeader(value = N8nService.HEADER_SECRET, required = false) String secret,
                                             @PathVariable Long inscriptionId) {
        n8nService.verifierSecret(secret);
        n8nDataService.marquerRappelEnvoye(inscriptionId);
        return ResponseEntity.noContent().build();
    }

    /** Workflow « Renfort urgent » : mission + bénévoles proches à solliciter. */
    @GetMapping("/renforts/{missionId}/benevoles")
    public Renfort renfort(@RequestHeader(value = N8nService.HEADER_SECRET, required = false) String secret,
                           @PathVariable Long missionId) {
        n8nService.verifierSecret(secret);
        return n8nDataService.benevolesPourRenfort(missionId);
    }

    /** Workflow « Résumé hebdomadaire » : missions recommandées par bénévole. */
    @GetMapping("/digest")
    public List<Digest> digest(@RequestHeader(value = N8nService.HEADER_SECRET, required = false) String secret) {
        n8nService.verifierSecret(secret);
        return n8nDataService.resumeHebdomadaire();
    }
}

package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.entity.Certificat;
import com.benevolat.plateformebenevolat.repository.CertificatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;

/**
 * Endpoint public de vérification de certificat.
 * GET /api/certificates/verify/{code}
 * Aucune authentification requise — accessible depuis la landing page.
 */
@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CertificatController {

    private final CertificatRepository certificatRepository;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @GetMapping("/verify/{code}")
    public ResponseEntity<Map<String, Object>> verify(@PathVariable String code) {
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                "valide", false,
                "message", "Code de certificat manquant."
            ));
        }

        Optional<Certificat> opt = certificatRepository.findByCodeVerificationIgnoreCase(code.trim());

        if (opt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "valide", false,
                "message", "Aucun certificat ne correspond à ce code."
            ));
        }

        Certificat cert = opt.get();
        var inscription  = cert.getInscription();
        var benevole     = inscription.getBenevole();
        var mission      = inscription.getMission();
        var association  = mission.getAssociation();

        return ResponseEntity.ok(Map.of(
            "valide",           true,
            "codeVerification", cert.getCodeVerification(),
            "dateEmission",     cert.getDateDelivrance().format(FMT),
            "urlPdf",           cert.getUrlPdf() != null ? cert.getUrlPdf() : "",
            "benevoleNom",      benevole.getNom()    != null ? benevole.getNom()    : "",
            "benevolePrenom",   benevole.getPrenom() != null ? benevole.getPrenom() : "",
            "missionTitre",     mission.getTitre(),
            "associationNom",   association.getNom() != null ? association.getNom() : ""
        ));
    }
}

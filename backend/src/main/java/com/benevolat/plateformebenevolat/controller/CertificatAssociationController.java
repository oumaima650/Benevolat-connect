package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.CertificatResultDto;
import com.benevolat.plateformebenevolat.service.CertificatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/associations/me")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:4173"})
public class CertificatAssociationController {

    private final CertificatService certificatService;

    /** POST /api/associations/me/missions/{missionId}/certificats
     *  Body: { inscriptionIds: [1, 2, 3] }
     *  Délivre les certificats pour les inscriptions sélectionnées. */
    @PostMapping("/missions/{missionId}/certificats")
    public ResponseEntity<List<CertificatResultDto>> delivrerCertificats(
            Authentication auth,
            @PathVariable Long missionId,
            @RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.getOrDefault("inscriptionIds", List.of());
        if (ids.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<CertificatResultDto> result = certificatService.delivrerCertificats(
                auth.getName(), missionId, ids);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /** GET /api/associations/me/missions/{missionId}/certificats
     *  Liste les certificats déjà délivrés pour cette mission. */
    @GetMapping("/missions/{missionId}/certificats")
    public ResponseEntity<List<CertificatResultDto>> getCertificats(
            Authentication auth,
            @PathVariable Long missionId) {
        return ResponseEntity.ok(certificatService.getCertificats(auth.getName(), missionId));
    }

    /** GET /api/associations/me/certificats/{certificatId}/pdf
     *  Redirige 302 vers l'URL Cloudinary du PDF. */
    @GetMapping("/certificats/{certificatId}/pdf")
    public ResponseEntity<Void> getPdf(
            Authentication auth,
            @PathVariable Long certificatId) {
        String url = certificatService.getPdfUrl(auth.getName(), certificatId);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(url))
                .build();
    }
}

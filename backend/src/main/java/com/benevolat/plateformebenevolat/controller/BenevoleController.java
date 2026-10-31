package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.BenevoleInscriptionDto;
import com.benevolat.plateformebenevolat.dto.BenevoleProfileDto;
import com.benevolat.plateformebenevolat.dto.CertificatResultDto;
import com.benevolat.plateformebenevolat.entity.Certificat;
import com.benevolat.plateformebenevolat.entity.Inscription;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
import com.benevolat.plateformebenevolat.repository.CertificatRepository;
import com.benevolat.plateformebenevolat.service.BenevoleProfileService;
import com.benevolat.plateformebenevolat.service.InscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/benevoles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BenevoleController {

    private final BenevoleProfileService benevoleProfileService;
    private final InscriptionService inscriptionService;
    private final BenevoleRepository benevoleRepository;
    private final CertificatRepository certificatRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(benevoleProfileService.getProfile(authentication.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            Authentication authentication,
            @RequestBody BenevoleProfileDto dto) {
        return ResponseEntity.ok(benevoleProfileService.updateProfile(authentication.getName(), dto));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Map<String, Object>> changePassword(
            Authentication authentication,
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
        benevoleProfileService.changePassword(authentication.getName(), currentPassword, newPassword);
        return ResponseEntity.ok(Map.of("success", true, "message", "Mot de passe mis à jour avec succès."));
    }

    @PatchMapping("/me/desactiver")
    public ResponseEntity<Map<String, Object>> desactiver(Authentication authentication) {
        benevoleProfileService.desactiver(authentication.getName());
        return ResponseEntity.ok(Map.of("success", true, "message", "Compte désactivé."));
    }

    @GetMapping("/mes-inscriptions")
    public ResponseEntity<List<BenevoleInscriptionDto>> mesInscriptions(Authentication authentication) {
        return ResponseEntity.ok(inscriptionService.listInscriptionsDuBenevole(authentication.getName()));
    }

    /** GET /api/benevoles/mes-certificats — liste les certificats du bénévole connecté */
    @GetMapping("/mes-certificats")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CertificatResultDto>> mesCertificats(Authentication authentication) {
        var benevole = benevoleRepository.findByEmail(authentication.getName()).orElse(null);
        if (benevole == null) return ResponseEntity.notFound().build();

        List<CertificatResultDto> certs = certificatRepository
            .findByInscription_Benevole_IdUtilisateur(benevole.getIdUtilisateur())
            .stream()
            .map(c -> {
                var b = c.getInscription().getBenevole();
                var m = c.getInscription().getMission();
                return CertificatResultDto.builder()
                    .certificatId(c.getIdCertificat())
                    .inscriptionId(c.getInscription().getIdInscription())
                    .benevoleId(b.getIdUtilisateur())
                    .benevoleNom(b.getNom())
                    .benevolePrenom(b.getPrenom())
                    .codeVerification(c.getCodeVerification())
                    .urlPdf(c.getUrlPdf())
                    .dateDelivrance(c.getDateDelivrance())
                    .missionTitre(m.getTitre())
                    .associationNom(m.getAssociation() != null ? m.getAssociation().getNom() : null)
                    .build();
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(certs);
    }
}

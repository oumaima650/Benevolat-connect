package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.*;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.*;
import com.benevolat.plateformebenevolat.service.BenevoleProfileService;
import com.benevolat.plateformebenevolat.service.InscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
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
    private final BadgeRepository badgeRepository;
    private final ObtentionRepository obtentionRepository;
    private final NiveauRepository niveauRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(benevoleProfileService.getProfile(authentication.getName()));
    }

    @GetMapping("/me/dashboard")
    public ResponseEntity<?> getMyDashboard(Authentication authentication) {
        return ResponseEntity.ok(benevoleProfileService.getDashboardData(authentication.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            Authentication authentication,
            @RequestBody BenevoleProfileDto dto) {
        return ResponseEntity.ok(benevoleProfileService.updateProfile(authentication.getName(), dto));
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

    /** GET /api/benevoles/badges-niveau — badges et niveau du bénévole */
    @GetMapping("/badges-niveau")
    @Transactional(readOnly = true)
    public ResponseEntity<BadgesNiveauResponse> getBadgesNiveau(Authentication authentication) {
        var benevole = benevoleRepository.findByEmail(authentication.getName()).orElse(null);
        if (benevole == null) return ResponseEntity.notFound().build();

        // Calculer le nombre de missions réalisées (certificats)
        long missionsRealisees = certificatRepository.countByInscription_Benevole_IdUtilisateur(benevole.getIdUtilisateur());

        // Récupérer le niveau actuel
        final Niveau niveauActuel;
        Niveau tempNiveau = benevole.getNiveau();
        if (tempNiveau == null) {
            tempNiveau = niveauRepository.findAll().stream()
                .min(Comparator.comparing(Niveau::getSeuilMissions))
                .orElse(null);
        }
        niveauActuel = tempNiveau;

        final long seuilActuel = niveauActuel != null ? niveauActuel.getSeuilMissions() : 0;

        // Trouver le niveau suivant
        Niveau niveauSuivant = niveauRepository.findAll().stream()
            .filter(n -> n.getSeuilMissions() != null && n.getSeuilMissions() > seuilActuel)
            .min(Comparator.comparing(Niveau::getSeuilMissions))
            .orElse(null);

        // Construire les infos de niveau
        NiveauInfoDto niveauInfo = NiveauInfoDto.builder()
            .nom(niveauActuel != null ? niveauActuel.getNom() : "Débutant")
            .missionsActuelles((int) missionsRealisees)
            .seuilSuivant(niveauSuivant != null ? niveauSuivant.getSeuilMissions() : null)
            .niveauSuivant(niveauSuivant != null ? niveauSuivant.getNom() : null)
            .build();

        // Récupérer tous les badges avec leur statut d'obtention
        List<Badge> allBadges = badgeRepository.findAll();
        List<Obtention> obtentions = obtentionRepository.findByBenevole_IdUtilisateur(benevole.getIdUtilisateur());

        List<BadgeNiveauDto> badgeDtos = allBadges.stream()
            .map(badge -> {
                Optional<Obtention> obtention = obtentions.stream()
                    .filter(o -> o.getBadge().getIdBadge().equals(badge.getIdBadge()))
                    .findFirst();

                return BadgeNiveauDto.builder()
                    .id(badge.getIdBadge())
                    .code(badge.getCode())
                    .nom(badge.getNom())
                    .description("Badge " + badge.getNom())
                    .niveau(badge.getNiveau() != null ? badge.getNiveau().getNom() : "")
                    .obtenu(obtention.isPresent())
                    .dateObtention(obtention.isPresent() ? obtention.get().getDateAttribution().toString() : null)
                    .build();
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(BadgesNiveauResponse.builder()
            .niveau(niveauInfo)
            .badges(badgeDtos)
            .build());
    }

    /** PUT /api/benevoles/me/password — changer le mot de passe */
    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @RequestBody Map<String, String> request) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Mot de passe actuel et nouveau mot de passe requis"));
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Le nouveau mot de passe doit contenir au moins 6 caractères"));
        }

        var benevole = benevoleRepository.findByEmail(authentication.getName()).orElse(null);
        if (benevole == null) {
            return ResponseEntity.notFound().build();
        }

        // Vérifier l'ancien mot de passe
        if (!passwordEncoder.matches(currentPassword, benevole.getMotDePasseHash())) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Mot de passe actuel incorrect"));
        }

        // Mettre à jour le mot de passe
        benevole.setMotDePasseHash(passwordEncoder.encode(newPassword));
        benevoleRepository.save(benevole);

        return ResponseEntity.ok(Map.of("success", true, "message", "Mot de passe modifié avec succès"));
    }
}

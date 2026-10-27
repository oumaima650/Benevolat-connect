package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.ExplorerMissionDto;
import com.benevolat.plateformebenevolat.dto.InscriptionResponseDto;
import com.benevolat.plateformebenevolat.dto.MissionCarteDto;
import com.benevolat.plateformebenevolat.service.InscriptionService;
import com.benevolat.plateformebenevolat.service.MissionExplorerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/missions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MissionExplorerController {

    private final MissionExplorerService missionExplorerService;
    private final InscriptionService inscriptionService;

    @GetMapping("/explorer")
    public ResponseEntity<Page<ExplorerMissionDto>> explorer(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) String domaine,
            @RequestParam(required = false) String ville,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String competences,
            @RequestParam(required = false) Boolean placesDisponibles,
            @RequestParam(required = false) Boolean inclureInscrites
    ) {
        return ResponseEntity.ok(missionExplorerService.explorer(
                authentication.getName(), page, domaine, ville, date, competences, placesDisponibles, inclureInscrites));
    }

    @GetMapping("/mes-inscriptions")
    public ResponseEntity<Page<ExplorerMissionDto>> mesInscriptions(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) String statutMission
    ) {
        return ResponseEntity.ok(missionExplorerService.mesInscriptions(
                authentication.getName(), page, statutMission));
    }

    @GetMapping("/mes-inscriptions/terminees")
    public ResponseEntity<List<ExplorerMissionDto>> mesInscriptionsTerminees(Authentication authentication) {
        return ResponseEntity.ok(missionExplorerService.mesInscriptionsTerminees(authentication.getName()));
    }

    @GetMapping("/{id}/certificat")
    public ResponseEntity<?> getCertificat(Authentication authentication, @PathVariable Long id) {
        try {
            return ResponseEntity.ok(missionExplorerService.getCertificat(authentication.getName(), id));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        }
    }

    @GetMapping("/recommandations")
    public ResponseEntity<List<ExplorerMissionDto>> recommandations(Authentication authentication) {
        return ResponseEntity.ok(missionExplorerService.recommandations(authentication.getName()));
    }

    @GetMapping("/carte")
    public ResponseEntity<List<MissionCarteDto>> carte(
            Authentication authentication,
            @RequestParam(required = false) String domaine,
            @RequestParam(required = false) String date
    ) {
        return ResponseEntity.ok(missionExplorerService.carte(authentication.getName(), domaine, date));
    }

    @PostMapping("/{id}/inscription")
    public ResponseEntity<?> inscrire(Authentication authentication, @PathVariable Long id) {
        try {
            InscriptionResponseDto res = inscriptionService.inscrire(authentication.getName(), id);
            return ResponseEntity.ok(res);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()));
        }
    }

    @DeleteMapping("/{id}/inscription")
    public ResponseEntity<?> annuler(Authentication authentication, @PathVariable Long id) {
        try {
            InscriptionResponseDto res = inscriptionService.annuler(authentication.getName(), id);
            return ResponseEntity.ok(res);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()));
        }
    }

    @PostMapping("/{id}/inscription/confirmer-renfort")
    public ResponseEntity<?> confirmerRenfort(Authentication authentication, @PathVariable Long id) {
        try {
            InscriptionResponseDto res = inscriptionService.confirmerRenfort(authentication.getName(), id);
            return ResponseEntity.ok(res);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()));
        }
    }
}

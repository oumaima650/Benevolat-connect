package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.BenevoleInscriptionDto;
import com.benevolat.plateformebenevolat.dto.BenevoleProfileDto;
import com.benevolat.plateformebenevolat.service.BenevoleProfileService;
import com.benevolat.plateformebenevolat.service.InscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/benevoles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BenevoleController {

    private final BenevoleProfileService benevoleProfileService;
    private final InscriptionService inscriptionService;

    /** GET /api/benevoles/me — récupère le profil du bénévole connecté */
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(benevoleProfileService.getProfile(authentication.getName()));
    }

    /** PUT /api/benevoles/me — met à jour le profil */
    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            Authentication authentication,
            @RequestBody BenevoleProfileDto dto) {
        return ResponseEntity.ok(benevoleProfileService.updateProfile(authentication.getName(), dto));
    }

    /** GET /api/benevoles/mes-inscriptions — liste les inscriptions du bénévole connecté */
    @GetMapping("/mes-inscriptions")
    public ResponseEntity<List<BenevoleInscriptionDto>> mesInscriptions(Authentication authentication) {
        return ResponseEntity.ok(inscriptionService.listInscriptionsDuBenevole(authentication.getName()));
    }
}

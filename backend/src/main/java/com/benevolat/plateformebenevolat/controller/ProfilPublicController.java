package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.ProfilPublicDto;
import com.benevolat.plateformebenevolat.service.BenevoleProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Profils publics des bénévoles (niveau, bannière, badges décrochés) ; utilisateur connecté requis. */
@RestController
@RequestMapping("/api/profils")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProfilPublicController {

    private final BenevoleProfileService benevoleProfileService;

    @GetMapping("/benevoles/{id}")
    public ResponseEntity<ProfilPublicDto> profilBenevole(@PathVariable Long id) {
        return ResponseEntity.ok(benevoleProfileService.profilPublic(id));
    }
}

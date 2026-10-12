package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.BenevoleProfileDto;
import com.benevolat.plateformebenevolat.service.BenevoleProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/benevoles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BenevoleController {

    private final BenevoleProfileService benevoleProfileService;

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
}

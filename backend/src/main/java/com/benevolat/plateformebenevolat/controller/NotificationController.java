package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.NotificationDto;
import com.benevolat.plateformebenevolat.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Centre de notifications (F30) et préférences (F31), pour tous les rôles connectés. */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationDto> lister(Authentication auth) {
        return notificationService.lister(auth.getName());
    }

    @GetMapping("/non-lues/count")
    public Map<String, Long> compterNonLues(Authentication auth) {
        return Map.of("count", notificationService.compterNonLues(auth.getName()));
    }

    @PatchMapping("/{id}/lue")
    public ResponseEntity<Void> marquerLue(Authentication auth, @PathVariable Long id) {
        notificationService.marquerLue(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/lire-tout")
    public ResponseEntity<Void> marquerToutesLues(Authentication auth) {
        notificationService.marquerToutesLues(auth.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(Authentication auth, @PathVariable Long id) {
        notificationService.supprimer(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/preferences")
    public Map<String, Object> getPreferences(Authentication auth) {
        return notificationService.getPreferences(auth.getName());
    }

    /** Body : { "emailActif": true } */
    @PutMapping("/preferences")
    public Map<String, Object> majPreferences(Authentication auth, @RequestBody Map<String, Boolean> body) {
        return notificationService.majPreferences(auth.getName(), !Boolean.FALSE.equals(body.get("emailActif")));
    }
}

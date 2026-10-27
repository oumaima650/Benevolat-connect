package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.ExplorerStatsDto;
import com.benevolat.plateformebenevolat.service.MissionExplorerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/benevole")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BenevoleExplorerController {

    private final MissionExplorerService missionExplorerService;

    @GetMapping("/explorer-stats")
    public ResponseEntity<ExplorerStatsDto> explorerStats(Authentication authentication) {
        return ResponseEntity.ok(missionExplorerService.stats(authentication.getName()));
    }
}

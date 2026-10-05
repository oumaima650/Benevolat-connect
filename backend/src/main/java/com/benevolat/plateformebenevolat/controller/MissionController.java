package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.MissionCardDto;
import com.benevolat.plateformebenevolat.dto.MissionDetailDto;
import com.benevolat.plateformebenevolat.dto.MissionSearchCriteria;
import com.benevolat.plateformebenevolat.service.MissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/missions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MissionController {

    private final MissionService missionService;

    @GetMapping("/search")
    public ResponseEntity<List<MissionCardDto>> searchMissions(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String ville,
            @RequestParam(required = false) String domaine) {
        MissionSearchCriteria criteria = new MissionSearchCriteria(q, ville, domaine);
        return ResponseEntity.ok(missionService.searchMissions(criteria));
    }

    @GetMapping("/featured")
    public ResponseEntity<List<MissionCardDto>> getFeaturedMissions() {
        return ResponseEntity.ok(missionService.getFeaturedMissions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MissionDetailDto> getMissionById(@PathVariable Long id) {
        return missionService.getMissionDetail(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getCities() {
        return ResponseEntity.ok(missionService.getVilles());
    }

    @GetMapping("/domaines")
    public ResponseEntity<List<String>> getDomaines() {
        return ResponseEntity.ok(missionService.getDomaines());
    }
}

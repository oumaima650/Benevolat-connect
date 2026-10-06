package com.benevolat.plateformebenevolat.controller;

import com.benevolat.plateformebenevolat.dto.StatistiquesDto;
import com.benevolat.plateformebenevolat.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping
    public ResponseEntity<StatistiquesDto> getStats() {
        return ResponseEntity.ok(statsService.getStatistiques());
    }
}

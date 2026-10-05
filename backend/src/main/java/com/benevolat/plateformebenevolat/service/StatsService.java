package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.StatistiquesDto;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import com.benevolat.plateformebenevolat.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final MissionRepository missionRepository;
    private final AssociationRepository associationRepository;

    public StatistiquesDto getStatistiques() {
        long totalMissions = missionRepository.count();
        long totalAssociations = associationRepository.count();
        // Dynamically compute total required volunteer places from public missions in DB
        long totalPlaces = missionRepository.sumTotalNbPlaces();
        long totalHeures = totalPlaces * 8; // Estimated total volunteer hours (8h per place)

        return new StatistiquesDto(totalMissions, totalPlaces, totalAssociations, totalHeures);
    }
}

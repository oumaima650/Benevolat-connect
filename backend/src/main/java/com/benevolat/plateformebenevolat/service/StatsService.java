package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.StatistiquesDto;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
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
    private final BenevoleRepository benevoleRepository;

    public StatistiquesDto getStatistiques() {
        long totalMissions = missionRepository.count();
        long totalAssociations = associationRepository.count();
        long totalBenevoles = benevoleRepository.count();
        long totalPlaces = missionRepository.sumTotalNbPlaces();
        long totalHeures = totalPlaces * 8;

        return new StatistiquesDto(totalMissions, totalBenevoles, totalAssociations, totalHeures);
    }
}

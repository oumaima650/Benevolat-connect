package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.MissionCardDto;
import com.benevolat.plateformebenevolat.dto.MissionDetailDto;
import com.benevolat.plateformebenevolat.dto.MissionSearchCriteria;
import com.benevolat.plateformebenevolat.entity.Mission;
import com.benevolat.plateformebenevolat.entity.StatutInscription;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import com.benevolat.plateformebenevolat.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MissionService {

    private final MissionRepository missionRepository;
    private final InscriptionRepository inscriptionRepository;

    public List<MissionCardDto> searchMissions(MissionSearchCriteria criteria) {
        String q = (criteria != null && criteria.getQ() != null) ? criteria.getQ().trim() : null;
        String ville = (criteria != null && criteria.getVille() != null) ? criteria.getVille().trim() : null;
        String domaine = (criteria != null && criteria.getDomaine() != null) ? criteria.getDomaine().trim() : null;

        List<Mission> missions = missionRepository.searchPublicMissions(q, ville, domaine);
        return missions.stream().map(this::toCardDto).collect(Collectors.toList());
    }

    public List<MissionCardDto> getFeaturedMissions() {
        List<StatutMission> excluded = Arrays.asList(StatutMission.BROUILLON, StatutMission.ANNULEE);
        List<Mission> missions = missionRepository.findTop4ByStatutNotInOrderByIdDesc(excluded);
        return missions.stream().map(this::toCardDto).collect(Collectors.toList());
    }

    public Optional<MissionDetailDto> getMissionDetail(Long id) {
        return missionRepository.findById(id).map(this::toDetailDto);
    }

    public List<String> getVilles() {
        return missionRepository.findDistinctVilles();
    }

    public List<String> getDomaines() {
        return missionRepository.findDistinctDomaines();
    }

    public MissionCardDto toCardDto(Mission mission) {
        int bienInscrits = inscriptionRepository.countByMissionIdAndStatut(mission.getId(), StatutInscription.CONFIRMEE);
        int listeAttenteCount = inscriptionRepository.countByMissionIdAndStatut(mission.getId(), StatutInscription.EN_LISTE_ATTENTE);
        int max = (mission.getNbBenevoles() != null) ? mission.getNbBenevoles() : 0;
        int placesRestantes = Math.max(0, max - bienInscrits);

        StatutMission effectiveStatut = mission.getStatut();
        if (effectiveStatut == StatutMission.DISPONIBLE && placesRestantes == 0) {
            effectiveStatut = StatutMission.COMPLET;
        }

        return new MissionCardDto(
                mission.getId(),
                mission.getTitre(),
                mission.getDescription(),
                mission.getDomaine(),
                mission.getVille(),
                mission.getDateDebut(),
                mission.getDateFin(),
                mission.getNbBenevoles(),
                placesRestantes,
                listeAttenteCount,
                effectiveStatut,
                mission.getBadge(),
                mission.getImageUrl(),
                mission.getAssociation() != null ? mission.getAssociation().getId() : null,
                mission.getAssociation() != null ? mission.getAssociation().getNom() : "Association Partenaire"
        );
    }

    public MissionDetailDto toDetailDto(Mission mission) {
        MissionCardDto card = toCardDto(mission);
        return new MissionDetailDto(
                card.getId(),
                card.getTitre(),
                card.getDescription(),
                card.getDomaine(),
                card.getVille(),
                card.getDateDebut(),
                card.getDateFin(),
                card.getNbBenevoles(),
                card.getPlacesRestantes(),
                card.getListeAttenteCount(),
                card.getStatut(),
                card.getBadge(),
                card.getImageUrl(),
                card.getAssociationId(),
                card.getAssociationNom(),
                mission.getAssociation() != null ? mission.getAssociation().getDescription() : null,
                mission.getAssociation() != null ? mission.getAssociation().getRnaSiret() : null
        );
    }
}

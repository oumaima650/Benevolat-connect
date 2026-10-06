package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.MissionCardDto;
import com.benevolat.plateformebenevolat.dto.MissionDetailDto;
import com.benevolat.plateformebenevolat.dto.MissionSearchCriteria;
import com.benevolat.plateformebenevolat.entity.Association;
import com.benevolat.plateformebenevolat.entity.Mission;
import com.benevolat.plateformebenevolat.entity.StatutMission;
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

    public List<MissionCardDto> searchMissions(MissionSearchCriteria criteria) {
        String q = (criteria != null && criteria.getQ() != null) ? criteria.getQ().trim() : null;
        String ville = (criteria != null && criteria.getVille() != null) ? criteria.getVille().trim() : null;
        String domaine = (criteria != null && criteria.getDomaine() != null) ? criteria.getDomaine().trim() : null;

        List<Mission> missions = missionRepository.searchPublicMissions(q, ville, domaine);
        return missions.stream().map(this::toCardDto).collect(Collectors.toList());
    }

    public List<MissionCardDto> getFeaturedMissions() {
        List<StatutMission> excluded = Arrays.asList(StatutMission.BROUILLON, StatutMission.ANNULEE);
        List<Mission> missions = missionRepository.findTop4ByStatutNotInOrderByIdMissionDesc(excluded);
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
        int bienInscrits = 0; // Handled by Personne A / Inscription table if needed
        int placesRestantes = Math.max(0, (mission.getNbPlaces() != null ? mission.getNbPlaces() : 0) - bienInscrits);

        StatutMission effectiveStatut = mission.getStatut();
        if (effectiveStatut == StatutMission.PUBLIEE && placesRestantes == 0) {
            effectiveStatut = StatutMission.COMPLETE;
        }

        String img = mission.getImageEvenement() != null ? mission.getImageEvenement().getUrl() : null;

        return new MissionCardDto(
                mission.getIdMission(),
                mission.getTitre(),
                mission.getDescription(),
                mission.getDomaine() != null ? mission.getDomaine().getNom() : null,
                mission.getAssociation() != null ? mission.getAssociation().getVille() : null,
                mission.getAdresse(),
                mission.getLatitude(),
                mission.getLongitude(),
                mission.getDateDebut(),
                mission.getDateFin(),
                mission.getNbPlaces(),
                placesRestantes,
                mission.getNbPlacesListeAttente(),
                effectiveStatut,
                img,
                mission.getAssociation() != null ? mission.getAssociation().getIdUtilisateur() : null,
                mission.getAssociation() != null ? mission.getAssociation().getNom() : "Association Partenaire"
        );
    }

    public MissionDetailDto toDetailDto(Mission mission) {
        MissionCardDto card = toCardDto(mission);
        Association asso = mission.getAssociation();

        // Previous editions: missions with same titre, different id
        List<MissionDetailDto.EditionPrecedenteDto> editions = missionRepository
                .findEditionsPrecedentes(mission.getTitre(), mission.getIdMission())
                .stream()
                .map(m -> new MissionDetailDto.EditionPrecedenteDto(
                        m.getIdMission(),
                        m.getImageEvenement() != null ? m.getImageEvenement().getUrl() : null,
                        m.getDateDebut()
                ))
                .collect(Collectors.toList());

        return new MissionDetailDto(
                card.getId(),
                card.getTitre(),
                card.getDescription(),
                card.getDomaine(),
                card.getVille(),
                card.getAdresse(),
                card.getLatitude(),
                card.getLongitude(),
                card.getDateDebut(),
                card.getDateFin(),
                card.getNbPlaces(),
                card.getPlacesRestantes(),
                card.getListeAttenteCount(),
                card.getStatut(),
                card.getImageUrl(),
                asso != null ? asso.getIdUtilisateur() : null,
                asso != null ? asso.getNom() : null,
                asso != null ? asso.getDescription() : null,
                asso != null ? asso.getDomaine() : null,
                asso != null ? asso.getVille() : null,
                asso != null ? asso.getEmail() : null,
                asso != null ? asso.getContact() : null,
                asso != null ? asso.getPhotoProfil() : null,
                editions
        );
    }
}

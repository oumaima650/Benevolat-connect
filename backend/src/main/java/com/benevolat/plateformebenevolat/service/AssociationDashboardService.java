package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.*;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service pour le dashboard association : profil et gestion des missions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssociationDashboardService {

    private final AssociationRepository associationRepository;
    private final MissionRepository missionRepository;
    private final DomaineRepository domaineRepository;
    private final CompetenceRepository competenceRepository;

    /* ─────────────────── PROFIL ─────────────────── */

    @Transactional(readOnly = true)
    public AssociationProfileDto getProfile(String email) {
        Association asso = findByEmail(email);
        return toProfileDto(asso);
    }

    @Transactional
    public AssociationProfileDto updateProfile(String email, UpdateAssociationRequest req) {
        Association asso = findByEmail(email);

        if (req.getNomAssociation() != null && !req.getNomAssociation().isBlank())
            asso.setNomAssociation(req.getNomAssociation().trim());
        if (req.getDescription() != null)
            asso.setDescription(req.getDescription().trim());
        if (req.getVille() != null && !req.getVille().isBlank())
            asso.setVille(req.getVille().trim());
        if (req.getContact() != null)
            asso.setContact(req.getContact().trim());
        if (req.getLogoUrl() != null)
            asso.setLogoUrl(req.getLogoUrl().trim());

        if (req.getDomaineIds() != null) {
            List<Domaine> domaines = domaineRepository.findAllById(req.getDomaineIds());
            asso.getDomaines().clear();
            asso.getDomaines().addAll(domaines);
        }

        Association saved = associationRepository.save(asso);
        log.info("Profil mis à jour pour : {}", email);
        return toProfileDto(saved);
    }

    /* ─────────────────── MISSIONS ─────────────────── */

    @Transactional(readOnly = true)
    public List<MissionDto> getMyMissions(String email) {
        Association asso = findByEmail(email);
        return missionRepository.findByAssociationIdUtilisateurOrderByDateDebutDesc(asso.getIdUtilisateur())
                .stream().map(this::toMissionDto).collect(Collectors.toList());
    }

    @Transactional
    public MissionDto createMission(String email, MissionRequest req) {
        Association asso = findByEmail(email);

        Domaine domaine = domaineRepository.findById(req.getDomaineId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Domaine introuvable"));

        Mission mission = new Mission();
        mission.setAssociation(asso);
        applyMissionRequest(mission, req, domaine);

        // Statut initial
        StatutMission statut = StatutMission.BROUILLON;
        if ("PUBLIEE".equalsIgnoreCase(req.getStatut())) statut = StatutMission.PUBLIEE;
        mission.setStatut(statut);

        Mission saved = missionRepository.save(mission);
        log.info("Mission créée [{}] par {}", saved.getIdMission(), email);
        return toMissionDto(saved);
    }

    @Transactional
    public MissionDto updateMission(String email, Long missionId, MissionRequest req) {
        Mission mission = findOwnedMission(email, missionId);

        if (mission.getStatut() == StatutMission.ANNULEE || mission.getStatut() == StatutMission.CLOTUREE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible de modifier une mission annulée ou clôturée.");
        }

        Domaine domaine = domaineRepository.findById(req.getDomaineId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Domaine introuvable"));

        applyMissionRequest(mission, req, domaine);
        Mission saved = missionRepository.save(mission);
        log.info("Mission modifiée [{}] par {}", missionId, email);
        return toMissionDto(saved);
    }

    @Transactional
    public MissionDto changeStatut(String email, Long missionId, String statutStr) {
        Mission mission = findOwnedMission(email, missionId);

        StatutMission nouveauStatut;
        try {
            nouveauStatut = StatutMission.valueOf(statutStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut invalide : " + statutStr);
        }

        // Transitions autorisées
        StatutMission actuel = mission.getStatut();
        boolean autorise = switch (nouveauStatut) {
            case PUBLIEE  -> actuel == StatutMission.BROUILLON;
            case ANNULEE  -> actuel == StatutMission.PUBLIEE || actuel == StatutMission.COMPLETE || actuel == StatutMission.RENFORT_URGENT;
            case CLOTUREE -> actuel == StatutMission.TERMINEE || actuel == StatutMission.EN_COURS;
            case BROUILLON -> actuel == StatutMission.PUBLIEE;
            default -> false;
        };

        if (!autorise) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Transition " + actuel + " → " + nouveauStatut + " non autorisée.");
        }

        mission.setStatut(nouveauStatut);
        return toMissionDto(missionRepository.save(mission));
    }

    /* ─────────────────── HELPERS ─────────────────── */

    private Association findByEmail(String email) {
        return associationRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Association introuvable"));
    }

    private Mission findOwnedMission(String email, Long missionId) {
        Association asso = findByEmail(email);
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable"));
        if (!mission.getAssociation().getIdUtilisateur().equals(asso.getIdUtilisateur())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cette mission ne vous appartient pas.");
        }
        return mission;
    }

    private void applyMissionRequest(Mission mission, MissionRequest req, Domaine domaine) {
        mission.setTitre(req.getTitre().trim());
        mission.setDescription(req.getDescription() != null ? req.getDescription().trim() : null);
        mission.setAdresse(req.getAdresse() != null ? req.getAdresse().trim() : null);
        mission.setLatitude(req.getLatitude());
        mission.setLongitude(req.getLongitude());
        mission.setNbPlaces(req.getNbPlaces());
        mission.setDomaine(domaine);

        // Parse dates
        mission.setDateDebut(parseDateTime(req.getDateDebut()));
        if (req.getDateFin() != null && !req.getDateFin().isBlank()) {
            mission.setDateFin(parseDateTime(req.getDateFin()));
        } else {
            mission.setDateFin(mission.getDateDebut());
        }

        // Compétences
        if (req.getCompetenceIds() != null) {
            List<Competence> competences = competenceRepository.findAllById(req.getCompetenceIds());
            mission.getCompetences().clear();
            mission.getCompetences().addAll(competences);
        }
    }

    private LocalDateTime parseDateTime(String str) {
        if (str == null || str.isBlank()) return LocalDateTime.now();
        try {
            // "2026-10-15T09:00" or "2026-10-15T09:00:00"
            if (str.length() == 16) str = str + ":00";
            return LocalDateTime.parse(str, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format de date invalide : " + str);
        }
    }

    private AssociationProfileDto toProfileDto(Association a) {
        List<Long> domaineIds = a.getDomaines().stream().map(Domaine::getId).collect(Collectors.toList());
        List<String> domaineNoms = a.getDomaines().stream().map(Domaine::getNom).collect(Collectors.toList());

        return AssociationProfileDto.builder()
                .id(a.getIdUtilisateur())
                .email(a.getEmail())
                .nomAssociation(a.getNomAssociation())
                .description(a.getDescription())
                .ville(a.getVille())
                .contact(a.getContact())
                .logoUrl(a.getLogoUrl())
                .statutValidation(a.getStatutValidation() != null ? a.getStatutValidation().name() : "EN_ATTENTE")
                .latitude(a.getLatitude())
                .longitude(a.getLongitude())
                .domaineIds(domaineIds)
                .domaineNoms(domaineNoms)
                .build();
    }

    private MissionDto toMissionDto(Mission m) {
        int confirmes = 0; // sera enrichi via InscriptionRepository si besoin
        int attente = m.getNbPlacesListeAttente() != null ? m.getNbPlacesListeAttente() : 0;
        int restantes = Math.max(0, (m.getNbPlaces() != null ? m.getNbPlaces() : 0) - confirmes);

        List<Long> compIds = m.getCompetences().stream().map(Competence::getId).collect(Collectors.toList());
        List<String> compNoms = m.getCompetences().stream().map(Competence::getNom).collect(Collectors.toList());

        Association asso = m.getAssociation();

        return MissionDto.builder()
                .id(m.getIdMission())
                .titre(m.getTitre())
                .description(m.getDescription())
                .adresse(m.getAdresse())
                .ville(asso != null ? asso.getVille() : null)
                .latitude(m.getLatitude())
                .longitude(m.getLongitude())
                .dateDebut(m.getDateDebut())
                .dateFin(m.getDateFin())
                .nbPlaces(m.getNbPlaces())
                .nbInscritsConfirmes(confirmes)
                .nbListeAttente(attente)
                .nbPlacesRestantes(restantes)
                .statut(m.getStatut() != null ? m.getStatut().name() : "BROUILLON")
                .domaineId(m.getDomaine() != null ? m.getDomaine().getId() : null)
                .domaineNom(m.getDomaine() != null ? m.getDomaine().getNom() : null)
                .competenceIds(compIds)
                .competenceNoms(compNoms)
                .associationId(asso != null ? asso.getIdUtilisateur() : null)
                .associationNom(asso != null ? asso.getNomAssociation() : null)
                .associationLogoUrl(asso != null ? asso.getLogoUrl() : null)
                .build();
    }
}

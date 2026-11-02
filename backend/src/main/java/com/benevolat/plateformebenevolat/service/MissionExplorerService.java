package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.ExplorerMissionDto;
import com.benevolat.plateformebenevolat.dto.ExplorerStatsDto;
import com.benevolat.plateformebenevolat.dto.GamificationDto;
import com.benevolat.plateformebenevolat.dto.MissionCarteDto;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MissionExplorerService {

    static final List<StatutMission> EXPLORER_STATUTS = List.of(
            StatutMission.PUBLIEE, StatutMission.SATUREE, StatutMission.RENFORT_URGENT
    );

    private final MissionRepository missionRepository;
    private final InscriptionRepository inscriptionRepository;
    private final BenevoleRepository benevoleRepository;
    private final ScoreMatchingRepository scoreMatchingRepository;
    private final CertificatRepository certificatRepository;
    private final ObtentionRepository obtentionRepository;
    private final GamificationService gamificationService;
    private final MissionPlacesService missionPlacesService;

    public Page<ExplorerMissionDto> explorer(
            String email,
            int page,
            String domaine,
            String ville,
            String date,
            String competences,
            Boolean placesDisponibles,
            Boolean inclureInscrites
    ) {
        Benevole benevole = requireBenevole(email);
        FilterParams filters = parseFilters(domaine, ville, date, competences, placesDisponibles);

        Page<Long> idsPage = missionRepository.findExplorerIds(
                EXPLORER_STATUTS,
                LocalDateTime.now(),
                filters.domaineId,
                filters.domaineNom,
                filters.ville,
                filters.dateDebut,
                filters.placesDisponibles,
                filters.competenceIds.size(),
                filters.competenceIds.isEmpty() ? List.of(-1L) : filters.competenceIds,
                benevole.getIdUtilisateur(),
                Boolean.TRUE.equals(inclureInscrites),
                PageRequest.of(Math.max(page, 0), 10)
        );

        List<ExplorerMissionDto> content = toExplorerDtos(idsPage.getContent(), benevole);
        return new PageImpl<>(content, idsPage.getPageable(), idsPage.getTotalElements());
    }

    public Page<ExplorerMissionDto> mesInscriptions(String email, int page, String statutMission) {
        Benevole benevole = requireBenevole(email);
        Long benevoleId = benevole.getIdUtilisateur();

        List<Inscription> inscriptions = inscriptionRepository.findByBenevole_IdUtilisateurOrderByDateInscriptionDesc(benevoleId);

        List<Inscription> filtered = inscriptions;
        if (statutMission != null && !statutMission.isBlank()) {
            try {
                StatutMission statut = StatutMission.valueOf(statutMission);
                filtered = inscriptions.stream()
                        .filter(i -> i.getMission().getStatut() == statut)
                        .toList();
            } catch (IllegalArgumentException e) {
                filtered = inscriptions;
            }
        }

        int pageSize = 10;
        int start = page * pageSize;
        int end = Math.min(start + pageSize, filtered.size());

        List<Inscription> pageInscriptions = filtered.subList(start, end);
        List<Long> missionIds = pageInscriptions.stream()
                .map(i -> i.getMission().getIdMission())
                .toList();

        List<ExplorerMissionDto> content = toExplorerDtos(missionIds, benevole);
        return new PageImpl<>(content, PageRequest.of(page, pageSize), filtered.size());
    }

    public List<ExplorerMissionDto> mesInscriptionsTerminees(String email) {
        Benevole benevole = requireBenevole(email);
        Long benevoleId = benevole.getIdUtilisateur();

        List<Inscription> inscriptions = inscriptionRepository.findByBenevole_IdUtilisateurOrderByDateInscriptionDesc(benevoleId);

        List<Inscription> terminees = inscriptions.stream()
                .filter(i -> i.getMission().getStatut() == StatutMission.TERMINEE)
                .toList();

        List<Long> missionIds = terminees.stream()
                .map(i -> i.getMission().getIdMission())
                .toList();

        return toExplorerDtos(missionIds, benevole);
    }

    public Map<String, Object> getCertificat(String email, Long missionId) {
        Benevole benevole = requireBenevole(email);
        Long benevoleId = benevole.getIdUtilisateur();

        Inscription inscription = inscriptionRepository
                .findByBenevole_IdUtilisateurAndMission_IdMission(benevoleId, missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inscription introuvable."));

        if (inscription.getStatut() != StatutInscription.CONFIRMEE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'inscription n'est pas confirmée.");
        }

        if (inscription.getMission().getStatut() != StatutMission.TERMINEE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La mission n'est pas terminée.");
        }

        Certificat certificat = certificatRepository
                .findByInscription_IdInscription(inscription.getIdInscription())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Certificat non disponible."));

        return Map.of(
                "codeVerification", certificat.getCodeVerification(),
                "dateDelivrance", certificat.getDateDelivrance(),
                "missionTitre", inscription.getMission().getTitre(),
                "missionDateDebut", inscription.getMission().getDateDebut(),
                "missionDateFin", inscription.getMission().getDateFin(),
                "associationNom", inscription.getMission().getAssociation().getNom()
        );
    }

    public ExplorerMissionDto getDetail(String email, Long missionId) {
        Benevole benevole = requireBenevole(email);
        List<Mission> found = missionRepository.findWithAssociationDomaineCompetences(List.of(missionId));
        if (found.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable.");
        }
        Mission mission = found.get(0);
        Map<Long, Inscription> insMap = indexInscriptions(benevole.getIdUtilisateur(), List.of(missionId));
        return toDto(mission, insMap.get(missionId), benevole.getIdUtilisateur(), null);
    }

    public List<ExplorerMissionDto> recommandations(String email) {
        Benevole benevole = requireBenevole(email);
        List<ScoreMatching> scores = scoreMatchingRepository.findRecommandationsValides(
                benevole.getIdUtilisateur(), LocalDateTime.now());
        if (scores.isEmpty()) {
            return List.of();
        }
        List<Long> missionIds = scores.stream().map(s -> s.getMission().getIdMission()).toList();
        Map<Long, Mission> hydrated = missionRepository.findWithAssociationDomaineCompetences(missionIds)
                .stream()
                .collect(Collectors.toMap(Mission::getIdMission, m -> m, (a, b) -> a));
        Map<Long, Inscription> insMap = indexInscriptions(benevole.getIdUtilisateur(), missionIds);

        List<ExplorerMissionDto> result = new ArrayList<>();
        for (ScoreMatching sm : scores) {
            Mission mission = hydrated.getOrDefault(sm.getMission().getIdMission(), sm.getMission());
            ExplorerMissionDto dto = toDto(mission, insMap.get(mission.getIdMission()),
                    benevole.getIdUtilisateur(), sm);
            result.add(dto);
        }
        return result;
    }

    public List<MissionCarteDto> carte(String email, String domaine, String date) {
        Benevole benevole = requireBenevole(email);
        FilterParams filters = parseFilters(domaine, null, date, null, false);
        List<Mission> missions = missionRepository.findCarteMissions(
                        EXPLORER_STATUTS,
                        LocalDateTime.now(),
                        filters.domaineId,
                        filters.domaineNom,
                        filters.dateDebut
                );

        Map<Long, Inscription> insMap = indexInscriptions(benevole.getIdUtilisateur(),
                missions.stream().map(Mission::getIdMission).toList());

        return missions.stream()
                .map(m -> MissionCarteDto.builder()
                        .id(m.getIdMission())
                        .titre(m.getTitre())
                        .latitude(m.getLatitude())
                        .longitude(m.getLongitude())
                        .dateDebut(m.getDateDebut())
                        .placesRestantes(missionPlacesService.placesRestantes(m))
                        .statut(m.getStatut())
                        .domaine(m.getDomaine() != null ? m.getDomaine().getNom() : null)
                        .ville(m.getAssociation() != null ? m.getAssociation().getVille() : null)
                        .inscriptionStatut(insMap.get(m.getIdMission()) != null ?
                                insMap.get(m.getIdMission()).getStatut() : null)
                        .build())
                .toList();
    }

    public ExplorerStatsDto stats(String email) {
        Benevole benevole = requireBenevole(email);
        Long id = benevole.getIdUtilisateur();
        LocalDateTime now = LocalDateTime.now();

        long missionsRealisees = certificatRepository.countByInscription_Benevole_IdUtilisateur(id);
        long inscriptionsAVenir = inscriptionRepository.countInscriptionsAVenir(id, now);
        long enListeAttente = inscriptionRepository.countEnListeAttenteExplorer(id);
        boolean renfort = inscriptionRepository.existsRenfortEnListeAttente(id);

        List<ScoreMatching> recos = scoreMatchingRepository.findRecommandationsValides(id, now);
        Integer meilleur = recos.stream().map(ScoreMatching::getScore).filter(Objects::nonNull)
                .max(Integer::compareTo).orElse(null);

        GamificationDto niveau = gamificationService.profil(id);

        Obtention lastBadge = obtentionRepository.findDernierBadge(id).orElse(null);

        List<Inscription> prochaines = inscriptionRepository.findProchainesConfirmees(id, now);
        ExplorerStatsDto.ProchaineMission prochaine = null;
        if (!prochaines.isEmpty()) {
            Mission m = prochaines.get(0).getMission();
            prochaine = ExplorerStatsDto.ProchaineMission.builder()
                    .idMission(m.getIdMission())
                    .titre(m.getTitre())
                    .dateDebut(m.getDateDebut())
                    .ville(m.getAssociation() != null ? m.getAssociation().getVille() : null)
                    .build();
        }

        return ExplorerStatsDto.builder()
                .missionsRealisees(missionsRealisees)
                .inscriptionsAVenir(inscriptionsAVenir)
                .enListeAttente(enListeAttente)
                .renfortDisponiblePourMoi(renfort)
                .recommandations(ExplorerStatsDto.Recommandations.builder()
                        .nombre(recos.size())
                        .meilleurScore(meilleur)
                        .build())
                .niveau(ExplorerStatsDto.NiveauInfo.builder()
                        .niveau(niveau.niveau())
                        .nom(niveau.nomNiveau())
                        .theme(niveau.theme())
                        .missionsActuelles(missionsRealisees)
                        .seuilSuivant(niveau.prochainPalier() != null ? niveau.prochainPalier().valeurCritere() : null)
                        .niveauSuivant(niveau.prochainPalier() != null ? niveau.prochainPalier().nom() : null)
                        .build())
                .dernierBadge(lastBadge == null ? null : ExplorerStatsDto.DernierBadge.builder()
                        .code(lastBadge.getBadge().getCode())
                        .nom(lastBadge.getBadge().getNom())
                        .build())
                .prochaineMission(prochaine)
                .build();
    }

    private List<ExplorerMissionDto> toExplorerDtos(Collection<Long> ids, Benevole benevole) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Mission> byId = missionRepository.findWithAssociationDomaineCompetences(new ArrayList<>(ids))
                .stream()
                .collect(Collectors.toMap(Mission::getIdMission, m -> m, (a, b) -> a));
        Map<Long, Inscription> insMap = indexInscriptions(benevole.getIdUtilisateur(), ids);

        List<ExplorerMissionDto> ordered = new ArrayList<>();
        for (Long id : ids) {
            Mission m = byId.get(id);
            if (m != null) {
                ordered.add(toDto(m, insMap.get(id), benevole.getIdUtilisateur(), null));
            }
        }
        return ordered;
    }

    private ExplorerMissionDto toDto(Mission m, Inscription inscription, Long benevoleId, ScoreMatching score) {
        int confirmes = missionPlacesService.countConfirmes(m.getIdMission());
        int restantes = missionPlacesService.placesRestantes(m);
        int total = confirmes + restantes;
        int attente = missionPlacesService.countAttente(m.getIdMission());
        boolean aDistance = m.getLatitude() == null || m.getLongitude() == null;
        boolean chevauche = false;
        if (inscription == null || inscription.getStatut() == StatutInscription.ANNULEE) {
            chevauche = inscriptionRepository.existsChevauchement(
                    benevoleId, m.getIdMission(), m.getDateDebut(), m.getDateFin());
        } else if (inscription.getStatut() == StatutInscription.EN_LISTE_ATTENTE) {
            chevauche = inscriptionRepository.existsChevauchement(
                    benevoleId, m.getIdMission(), m.getDateDebut(), m.getDateFin());
        }

        List<String> competences = m.getCompetences() == null ? List.of()
                : m.getCompetences().stream().map(Competence::getNom).distinct().toList();

        Association asso = m.getAssociation();
        return ExplorerMissionDto.builder()
                .id(m.getIdMission())
                .titre(m.getTitre())
                .description(m.getDescription())
                .domaine(m.getDomaine() != null ? m.getDomaine().getNom() : null)
                .domaineId(m.getDomaine() != null ? m.getDomaine().getId() : null)
                .associationNom(asso != null ? asso.getNom() : null)
                .associationVille(asso != null ? asso.getVille() : null)
                .associationId(asso != null ? asso.getIdUtilisateur() : null)
                .adresse(m.getAdresse())
                .latitude(m.getLatitude())
                .longitude(m.getLongitude())
                .aDistance(aDistance)
                .dateDebut(m.getDateDebut())
                .dateFin(m.getDateFin())
                .competences(competences)
                .nbPlaces(total)
                .placesRestantes(restantes)
                .listeAttenteCount(attente)
                .nbRenfortDemande(m.getNbRenfortDemande())
                .statut(m.getStatut())
                .imageUrl(null)
                .inscriptionStatut(inscription != null ? inscription.getStatut() : null)
                .rang(inscription != null ? inscription.getRang() : null)
                .chevauche(chevauche)
                .score(score != null ? score.getScore() : null)
                .explication(score != null ? score.getExplication() : null)
                .methode(score != null ? score.getMethode() : null)
                .build();
    }

    private Map<Long, Inscription> indexInscriptions(Long benevoleId, Collection<Long> missionIds) {
        if (missionIds.isEmpty()) {
            return Map.of();
        }
        return inscriptionRepository
                .findByBenevole_IdUtilisateurAndMission_IdMissionIn(benevoleId, missionIds)
                .stream()
                .collect(Collectors.toMap(i -> i.getMission().getIdMission(), i -> i, (a, b) -> a));
    }

    private boolean isVisibleInExplorer(Mission m) {
        if (m.getStatut() == null || !EXPLORER_STATUTS.contains(m.getStatut())) {
            return false;
        }
        if (Boolean.TRUE.equals(m.getEstSignalee())) {
            return false;
        }
        Association a = m.getAssociation();
        if (a == null || a.getStatut() != StatutUtilisateur.ACTIF) {
            return false;
        }
        if (m.getStatut() != StatutMission.RENFORT_URGENT
                && (m.getDateDebut() == null || !m.getDateDebut().isAfter(LocalDateTime.now()))) {
            return false;
        }
        return true;
    }

    private Benevole requireBenevole(String email) {
        return benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès réservé aux bénévoles."));
    }

    private FilterParams parseFilters(String domaine, String ville, String date, String competences,
                                      Boolean placesDisponibles) {
        Long domaineId = null;
        String domaineNom = null;
        if (domaine != null && !domaine.isBlank()) {
            String trimmed = domaine.trim();
            try {
                domaineId = Long.parseLong(trimmed);
            } catch (NumberFormatException ex) {
                domaineNom = trimmed;
            }
        }
        String villeNorm = (ville == null || ville.isBlank()) ? null : ville.trim();
        LocalDateTime dateDebut = null;
        if (date != null && !date.isBlank()) {
            LocalDate parsed = LocalDate.parse(date);
            dateDebut = parsed.atStartOfDay();
        }
        List<Long> competenceIds = new ArrayList<>();
        if (competences != null && !competences.isBlank()) {
            for (String part : competences.split(",")) {
                String t = part.trim();
                if (!t.isEmpty()) {
                    competenceIds.add(Long.parseLong(t));
                }
            }
        }
        return new FilterParams(domaineId, domaineNom, villeNorm, dateDebut,
                Boolean.TRUE.equals(placesDisponibles), competenceIds);
    }

    private record FilterParams(Long domaineId, String domaineNom, String ville, LocalDateTime dateDebut,
                                boolean placesDisponibles, List<Long> competenceIds) {
    }
}

package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.AssociationProfileDto;
import com.benevolat.plateformebenevolat.dto.ImageEvenementDto;
import com.benevolat.plateformebenevolat.dto.InscritDto;
import com.benevolat.plateformebenevolat.dto.MissionDto;
import com.benevolat.plateformebenevolat.dto.MissionRequest;
import com.benevolat.plateformebenevolat.dto.UpdateAssociationRequest;
import com.benevolat.plateformebenevolat.entity.Association;
import com.benevolat.plateformebenevolat.entity.Domaine;
import com.benevolat.plateformebenevolat.entity.ImageEvenement;
import com.benevolat.plateformebenevolat.entity.Inscription;
import com.benevolat.plateformebenevolat.entity.Mission;
import com.benevolat.plateformebenevolat.entity.StatutInscription;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import com.benevolat.plateformebenevolat.entity.StatutUtilisateur;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import com.benevolat.plateformebenevolat.repository.CompetenceRepository;
import com.benevolat.plateformebenevolat.repository.DomaineRepository;
import com.benevolat.plateformebenevolat.repository.ImageEvenementRepository;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import com.benevolat.plateformebenevolat.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AssociationService {

    private final AssociationRepository associationRepository;
    private final DomaineRepository domaineRepository;
    private final MissionRepository missionRepository;
    private final CompetenceRepository competenceRepository;
    private final InscriptionRepository inscriptionRepository;
    private final ImageEvenementRepository imageEvenementRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();


    // ─── Profile ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AssociationProfileDto getProfile(String email) {
        Association asso = loadByEmail(email);
        return toProfileDto(asso);
    }

    public AssociationProfileDto updateProfile(String email, UpdateAssociationRequest req) {
        Association asso = loadByEmail(email);

        if (req.getNomAssociation() != null) {
            asso.setNom(req.getNomAssociation());
        }
        if (req.getDescription() != null) {
            asso.setDescription(req.getDescription());
        }
        if (req.getVille() != null) {
            asso.setVille(req.getVille());
        }
        if (req.getContact() != null) {
            asso.setContact(req.getContact());
        }
        if (req.getLogoUrl() != null && !req.getLogoUrl().isBlank()) {
            asso.setPhotoProfil(req.getLogoUrl());
        }
        if (req.getLatitude() != null)  asso.setLatitude(req.getLatitude());
        if (req.getLongitude() != null) asso.setLongitude(req.getLongitude());
        if (req.getDomaineIds() != null) {
            asso.setDomaines(domaineRepository.findAllById(req.getDomaineIds()));
        }

        associationRepository.save(asso);
        return toProfileDto(asso);
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        Association asso = loadByEmail(email);
        if (!passwordEncoder.matches(currentPassword, asso.getMotDePasseHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mot de passe actuel incorrect.");
        }
        asso.setMotDePasseHash(passwordEncoder.encode(newPassword));
        associationRepository.save(asso);
    }

    public String toggleStatut(String email) {
        Association asso = loadByEmail(email);
        StatutUtilisateur current = asso.getStatut();
        StatutUtilisateur next = (current == StatutUtilisateur.ACTIF)
            ? StatutUtilisateur.DESACTIVE
            : StatutUtilisateur.ACTIF;
        asso.setStatut(next);
        associationRepository.save(asso);
        return next.name();
    }

    // ─── Missions ─────────────────────────────────────────────────────────────


    @Transactional(readOnly = true)
    public List<MissionDto> getMissions(String email) {
        Association asso = loadByEmail(email);
        return missionRepository
                .findByAssociationIdUtilisateurOrderByDateDebutDesc(asso.getIdUtilisateur())
                .stream()
                .map(this::toMissionDto)
                .collect(Collectors.toList());
    }

    public MissionDto createMission(String email, MissionRequest req) {
        Association asso = loadByEmail(email);

        Domaine domaine = domaineRepository.findById(req.getDomaineId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Domaine introuvable : " + req.getDomaineId()));

        LocalDateTime dateDebut = parseDateTime(req.getDateDebut(), "dateDebut");
        LocalDateTime dateFin   = parseDateTime(req.getDateFin(),   "dateFin");

        StatutMission statut = ("PUBLIEE".equalsIgnoreCase(req.getStatut()))
                ? StatutMission.PUBLIEE
                : StatutMission.BROUILLON;

        Mission mission = new Mission();
        mission.setTitre(req.getTitre());
        mission.setDescription(req.getDescription());
        mission.setAdresse(req.getAdresse());
        mission.setLatitude(req.getLatitude());
        mission.setLongitude(req.getLongitude());
        mission.setDateDebut(dateDebut);
        mission.setDateFin(dateFin);
        mission.setNbPlaces(req.getNbPlaces() != null ? req.getNbPlaces() : 0);
        mission.setStatut(statut);
        mission.setAssociation(asso);
        mission.setDomaine(domaine);

        if (req.getCompetenceIds() != null && !req.getCompetenceIds().isEmpty()) {
            mission.setCompetences(competenceRepository.findAllById(req.getCompetenceIds()));
        }

        Mission saved = missionRepository.save(mission);
        return toMissionDto(saved);
    }

    public MissionDto updateMission(String email, Long missionId, MissionRequest req) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable : " + missionId));

        if (!mission.getAssociation().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé à cette mission.");
        }

        if (mission.getStatut() == StatutMission.ANNULEE || mission.getStatut() == StatutMission.CLOTUREE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mission non modifiable.");
        }

        if (req.getTitre() != null)       mission.setTitre(req.getTitre());
        if (req.getDescription() != null) mission.setDescription(req.getDescription());
        if (req.getAdresse() != null)     mission.setAdresse(req.getAdresse());
        if (req.getLatitude() != null)    mission.setLatitude(req.getLatitude());
        if (req.getLongitude() != null)   mission.setLongitude(req.getLongitude());
        if (req.getNbPlaces() != null)    mission.setNbPlaces(req.getNbPlaces());

        if (req.getDateDebut() != null) {
            mission.setDateDebut(parseDateTime(req.getDateDebut(), "dateDebut"));
        }
        if (req.getDateFin() != null) {
            mission.setDateFin(parseDateTime(req.getDateFin(), "dateFin"));
        }
        if (req.getDomaineId() != null) {
            Domaine domaine = domaineRepository.findById(req.getDomaineId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Domaine introuvable : " + req.getDomaineId()));
            mission.setDomaine(domaine);
        }
        if (req.getCompetenceIds() != null) {
            mission.setCompetences(competenceRepository.findAllById(req.getCompetenceIds()));
        }

        Mission saved = missionRepository.save(mission);
        return toMissionDto(saved);
    }

    public MissionDto changeStatut(String email, Long missionId, String newStatut) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable : " + missionId));

        if (!mission.getAssociation().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé à cette mission.");
        }

        if (mission.getStatut() == StatutMission.ANNULEE || mission.getStatut() == StatutMission.CLOTUREE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mission non modifiable.");
        }

        StatutMission parsed;
        try {
            parsed = StatutMission.valueOf(newStatut);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut invalide : " + newStatut);
        }

        mission.setStatut(parsed);
        Mission saved = missionRepository.save(mission);
        return toMissionDto(saved);
    }

    // ─── Inscrits / Renfort / Images ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<InscritDto> getInscrits(String email, Long missionId) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable : " + missionId));
        if (!mission.getAssociation().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé à cette mission.");
        }

        List<Inscription> confirmes = inscriptionRepository
                .findByMission_IdMissionAndStatutOrderByRangAsc(missionId, StatutInscription.CONFIRMEE);
        List<Inscription> attente = inscriptionRepository
                .findByMission_IdMissionAndStatutOrderByRangAsc(missionId, StatutInscription.EN_LISTE_ATTENTE);

        List<Inscription> all = new ArrayList<>();
        all.addAll(confirmes);
        all.addAll(attente);

        return all.stream().map(this::toInscritDto).collect(Collectors.toList());
    }

    public MissionDto demanderRenfort(String email, Long missionId, int nbBenevoles) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable : " + missionId));
        if (!mission.getAssociation().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé à cette mission.");
        }
        if (mission.getStatut() != StatutMission.EN_COURS && mission.getStatut() != StatutMission.PUBLIEE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le renfort ne peut être demandé que pour une mission EN_COURS ou PUBLIEE.");
        }
        mission.setNbRenfortDemande(nbBenevoles);
        mission.setStatut(StatutMission.RENFORT_URGENT);
        Mission saved = missionRepository.save(mission);
        return toMissionDto(saved);
    }

    public ImageEvenementDto ajouterImageMission(String email, Long missionId,
                                                  String url, String titre, String description) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable : " + missionId));
        if (!mission.getAssociation().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé à cette mission.");
        }
        if (mission.getStatut() != StatutMission.CLOTUREE && mission.getStatut() != StatutMission.TERMINEE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mission non clôturée/terminée.");
        }
        ImageEvenement image = new ImageEvenement(url, titre, description, mission);
        ImageEvenement saved = imageEvenementRepository.save(image);
        return toImageEvenementDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ImageEvenementDto> getImagesMission(String email, Long missionId) {
        Mission mission = missionRepository.findById(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable : " + missionId));
        if (!mission.getAssociation().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé à cette mission.");
        }
        return imageEvenementRepository
                .findByMission_IdMissionOrderByDatePublicationDesc(missionId)
                .stream()
                .map(this::toImageEvenementDto)
                .collect(Collectors.toList());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Association loadByEmail(String email) {
        return associationRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Association introuvable pour : " + email));
    }

    private AssociationProfileDto toProfileDto(Association asso) {
        List<Long> domaineIds = asso.getDomaines().stream()
                .map(d -> d.getIdDomaine())
                .collect(Collectors.toList());
        List<String> domaineNoms = asso.getDomaines().stream()
                .map(Domaine::getNom)
                .collect(Collectors.toList());

        return AssociationProfileDto.builder()
                .id(asso.getIdUtilisateur())
                .email(asso.getEmail())
                .nomAssociation(asso.getNom())
                .description(asso.getDescription())
                .ville(asso.getVille())
                .contact(asso.getContact())
                .logoUrl(asso.getPhotoProfil())
                .statutValidation(asso.getStatutValidation() != null ? asso.getStatutValidation().name() : "EN_ATTENTE")
                .statutCompte(asso.getStatut() != null ? asso.getStatut().name() : "ACTIF")
                .latitude(asso.getLatitude())
                .longitude(asso.getLongitude())
                .domaineIds(domaineIds)
                .domaineNoms(domaineNoms)
                .build();
    }

    private MissionDto toMissionDto(Mission m) {
        List<String> competenceNoms = m.getCompetences().stream()
                .map(c -> c.getNom())
                .collect(Collectors.toList());

        Association asso = m.getAssociation();

        // nbInscritsConfirmes: 0 until Inscription entity is wired (consistent with MissionService)
        // nbListeAttente: stored column on Mission
        return MissionDto.builder()
                .id(m.getIdMission())
                .titre(m.getTitre())
                .description(m.getDescription())
                .adresse(m.getAdresse())
                .latitude(m.getLatitude())
                .longitude(m.getLongitude())
                .dateDebut(m.getDateDebut())
                .dateFin(m.getDateFin())
                .nbPlaces(m.getNbPlaces())
                .nbInscritsConfirmes(0)
                .nbListeAttente(m.getNbPlacesListeAttente())
                .statut(m.getStatut() != null ? m.getStatut().name() : "BROUILLON")
                .domaineId(m.getDomaine() != null ? m.getDomaine().getIdDomaine() : null)
                .domaineNom(m.getDomaine() != null ? m.getDomaine().getNom() : null)
                .competenceNoms(competenceNoms)
                .associationId(asso != null ? asso.getIdUtilisateur() : null)
                .associationNom(asso != null ? asso.getNom() : null)
                .associationLogoUrl(asso != null ? asso.getPhotoProfil() : null)
                .build();
    }

    private InscritDto toInscritDto(Inscription inscription) {
        var benevole = inscription.getBenevole();
        List<String> competenceNoms = benevole.getCompetences().stream()
                .map(c -> c.getNom())
                .collect(Collectors.toList());
        return InscritDto.builder()
                .inscriptionId(inscription.getIdInscription())
                .benevoleId(benevole.getIdUtilisateur())
                .nom(benevole.getNom())
                .prenom(benevole.getPrenom())
                .email(benevole.getEmail())
                .ville(benevole.getVille())
                .telephone(benevole.getTelephone())
                .photoUrl(benevole.getPhotoUrl())
                .competences(competenceNoms)
                .statut(inscription.getStatut().name())
                .rang(inscription.getRang())
                .dateInscription(inscription.getDateInscription())
                .certificatDelivre(false) // enrichi par CertificatService si besoin
                .build();
    }

    private ImageEvenementDto toImageEvenementDto(ImageEvenement image) {
        return ImageEvenementDto.builder()
                .id(image.getIdImage())
                .url(image.getUrl())
                .titre(image.getTitre())
                .description(image.getDescription())
                .datePublication(image.getDatePublication())
                .build();
    }

    private LocalDateTime parseDateTime(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " est requis.");
        }
        try {
            return LocalDateTime.parse(value);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format de date invalide pour " + fieldName + " : " + value);
        }
    }
}

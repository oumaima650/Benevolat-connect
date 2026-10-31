package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.AssociationProfileDto;
import com.benevolat.plateformebenevolat.dto.ImageEvenementDto;
import com.benevolat.plateformebenevolat.dto.InscritDto;
import com.benevolat.plateformebenevolat.dto.MissionDto;
import com.benevolat.plateformebenevolat.dto.MissionRequest;
import com.benevolat.plateformebenevolat.dto.UpdateAssociationRequest;
import com.benevolat.plateformebenevolat.entity.Association;
import com.benevolat.plateformebenevolat.entity.CategorieNotif;
import com.benevolat.plateformebenevolat.entity.Domaine;
import com.benevolat.plateformebenevolat.entity.ImageEvenement;
import com.benevolat.plateformebenevolat.entity.Inscription;
import com.benevolat.plateformebenevolat.entity.Mission;
import com.benevolat.plateformebenevolat.entity.StatutInscription;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import com.benevolat.plateformebenevolat.entity.StatutUtilisateur;
import com.benevolat.plateformebenevolat.entity.StatutValidation;
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
    private final MissionPlacesService missionPlacesService;
    private final NotificationService notificationService;
    private final N8nService n8nService;
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

        // Après un refus, la mise à jour du profil renvoie le dossier en validation
        if (asso.getStatutValidation() == StatutValidation.REFUSE) {
            asso.setStatutValidation(StatutValidation.EN_ATTENTE);
            asso.setMotifRefus(null);
            notificationService.notifier(asso, CategorieNotif.VALIDATION,
                    "Votre dossier a été renvoyé en validation",
                    "Merci d'avoir mis à jour le profil de « " + asso.getNom() + " ». L'équipe CountMeIn va réexaminer"
                            + " votre dossier : vous serez prévenu(e) par e-mail de sa décision.",
                    "/association");
            notificationService.notifierAdmins(CategorieNotif.VALIDATION,
                    "Association à revalider",
                    "L'association « " + asso.getNom() + " », refusée précédemment, a mis à jour son profil"
                            + " et attend une nouvelle validation.",
                    "/admin/associations");
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
        notificationService.notifierMotDePasseModifie(asso);
    }

    public String toggleStatut(String email) {
        Association asso = loadByEmail(email);
        StatutUtilisateur current = asso.getStatut();
        StatutUtilisateur next = (current == StatutUtilisateur.ACTIF)
            ? StatutUtilisateur.DESACTIVE
            : StatutUtilisateur.ACTIF;
        asso.setStatut(next);
        associationRepository.save(asso);
        if (next == StatutUtilisateur.DESACTIVE) {
            notificationService.notifier(asso, CategorieNotif.COMPTE,
                    "Votre compte a été désactivé",
                    "Le compte de « " + asso.getNom() + " » a bien été désactivé à votre demande."
                            + "\nVos missions et votre historique sont conservés. Pour réactiver votre compte,"
                            + " contactez l'équipe CountMeIn.",
                    null);
        }
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
        if (statut == StatutMission.PUBLIEE) verifierAssociationValidee(asso);

        Mission mission = new Mission();
        mission.setTitre(req.getTitre());
        mission.setDescription(req.getDescription());
        mission.setAdresse(req.getAdresse());
        mission.setLatitude(req.getLatitude());
        mission.setLongitude(req.getLongitude());
        mission.setDateDebut(dateDebut);
        mission.setDateFin(dateFin);
        int places = req.getNbPlaces() != null ? req.getNbPlaces() : 0;
        mission.setNbPlaces(places);
        mission.setNbPlacesListeAttente(places); // liste d'attente = même capacité que les places
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

        // Modifiable uniquement tant que la mission n'a pas commencé
        StatutMission statutActuel = mission.getStatut();
        if (statutActuel != StatutMission.BROUILLON && statutActuel != StatutMission.PUBLIEE
                && statutActuel != StatutMission.SATUREE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Mission non modifiable (statut : " + statutActuel + "). Utilisez le renfort pour une mission en cours.");
        }

        // F08 : mémoriser date et lieu pour prévenir les inscrits en cas de changement
        LocalDateTime ancienDebut = mission.getDateDebut();
        LocalDateTime ancienneFin = mission.getDateFin();
        String ancienneAdresse = mission.getAdresse();

        if (req.getTitre() != null)       mission.setTitre(req.getTitre());
        if (req.getDescription() != null) mission.setDescription(req.getDescription());
        if (req.getAdresse() != null)     mission.setAdresse(req.getAdresse());
        if (req.getLatitude() != null)    mission.setLatitude(req.getLatitude());
        if (req.getLongitude() != null)   mission.setLongitude(req.getLongitude());
        if (req.getNbPlaces() != null) {
            // req.nbPlaces = capacité TOTALE souhaitée ; en BDD on stocke les places restantes
            int confirmes = missionPlacesService.countConfirmes(missionId);
            if (req.getNbPlaces() < confirmes) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Impossible : " + confirmes + " bénévole(s) déjà confirmé(s), le nombre de places ne peut pas être inférieur.");
            }
            mission.setNbPlaces(req.getNbPlaces() - confirmes);
        }

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

        // Places libérées → promotion de la liste d'attente, SATUREE ↔ PUBLIEE
        missionPlacesService.recalculer(mission);

        boolean dateChangee = !java.util.Objects.equals(ancienDebut, mission.getDateDebut())
                || !java.util.Objects.equals(ancienneFin, mission.getDateFin());
        boolean lieuChange = !java.util.Objects.equals(ancienneAdresse, mission.getAdresse());
        if (dateChangee || lieuChange) {
            notifierInscrits(mission, CategorieNotif.MISSION_MODIFIEE,
                    "Mission modifiée : " + mission.getTitre(),
                    "L'association a modifié " + (dateChangee && lieuChange ? "la date et le lieu"
                            : dateChangee ? "la date" : "le lieu")
                            + " de la mission « " + mission.getTitre() + " ». Vérifiez les nouvelles informations.");
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

        if (parsed == StatutMission.PUBLIEE) {
            verifierAssociationValidee(mission.getAssociation());
        }
        if (parsed == StatutMission.ANNULEE) {
            // Une mission ne peut être annulée qu'avant son début (cahier des charges, cycle de vie)
            StatutMission s = mission.getStatut();
            if (s != StatutMission.BROUILLON && s != StatutMission.PUBLIEE && s != StatutMission.SATUREE) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Seule une mission non commencée (brouillon, publiée ou saturée) peut être annulée.");
            }
            // RM10 : tous les confirmés et la liste d'attente sont prévenus
            notifierInscrits(mission, CategorieNotif.MISSION_ANNULEE,
                    "Mission annulée : " + mission.getTitre(),
                    "Nous sommes désolés : l'association " + mission.getAssociation().getNom()
                            + " a annulé la mission « " + mission.getTitre() + " ».");
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
        StatutMission s = mission.getStatut();
        if (s != StatutMission.PUBLIEE && s != StatutMission.SATUREE
                && s != StatutMission.EN_COURS && s != StatutMission.RENFORT_URGENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le renfort ne peut être demandé que pour une mission publiée, saturée ou en cours.");
        }
        if (nbBenevoles < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le renfort doit concerner au moins 1 bénévole.");
        }
        // Le renfort ouvre de nouvelles places : la liste d'attente est promue en premier,
        // le reste est ouvert aux inscriptions (même si la mission a déjà commencé).
        int dejaDemande = mission.getNbRenfortDemande() != null ? mission.getNbRenfortDemande() : 0;
        mission.setNbRenfortDemande(dejaDemande + nbBenevoles);
        mission.setNbPlaces(missionPlacesService.placesRestantes(mission) + nbBenevoles);
        mission.setStatut(StatutMission.RENFORT_URGENT);
        missionPlacesService.recalculer(mission);

        // Places encore libres après la liste d'attente : n8n sollicite les bénévoles proches (IA)
        if (mission.getStatut() == StatutMission.RENFORT_URGENT) {
            n8nService.declencher("renfort", java.util.Map.of(
                    "missionId", mission.getIdMission(),
                    "titre", mission.getTitre(),
                    "placesRestantes", missionPlacesService.placesRestantes(mission)));
        }
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

    /** RM06 : une association non validée par l'administrateur ne peut pas publier. */
    private void verifierAssociationValidee(Association asso) {
        if (asso.getStatutValidation() != StatutValidation.VALIDE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Votre association doit être validée par un administrateur avant de publier une mission.");
        }
    }

    /** Notifie les inscrits confirmés et la liste d'attente d'une mission (avec l'encadré récapitulatif). */
    private void notifierInscrits(Mission mission, CategorieNotif categorie, String titre, String message) {
        var details = NotificationService.detailsMission(mission);
        for (StatutInscription s : List.of(StatutInscription.CONFIRMEE, StatutInscription.EN_LISTE_ATTENTE)) {
            inscriptionRepository.findByMission_IdMissionAndStatutOrderByRangAsc(mission.getIdMission(), s)
                    .forEach(i -> notificationService.notifier(i.getBenevole(), categorie, titre, message,
                            "/missions/" + mission.getIdMission(), details));
        }
    }

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
                .motifRefus(asso.getMotifRefus())
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

        // nbPlaces en BDD = places restantes ; le DTO expose la capacité totale dans nbPlaces
        int nbConfirmes = missionPlacesService.countConfirmes(m.getIdMission());
        int restantes = missionPlacesService.placesRestantes(m);

        return MissionDto.builder()
                .id(m.getIdMission())
                .titre(m.getTitre())
                .description(m.getDescription())
                .adresse(m.getAdresse())
                .latitude(m.getLatitude())
                .longitude(m.getLongitude())
                .dateDebut(m.getDateDebut())
                .dateFin(m.getDateFin())
                .nbPlaces(nbConfirmes + restantes)
                .nbPlacesTotal(nbConfirmes + restantes)
                .nbPlacesRestantes(restantes)
                .nbInscritsConfirmes(nbConfirmes)
                .nbListeAttente(missionPlacesService.countAttente(m.getIdMission()))
                .nbRenfortDemande(m.getNbRenfortDemande())
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

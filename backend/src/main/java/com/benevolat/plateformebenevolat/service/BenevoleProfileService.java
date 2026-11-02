package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.*;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BenevoleProfileService {

    private final BenevoleRepository benevoleRepository;
    private final CompetenceRepository competenceRepository;
    private final DomaineRepository domaineRepository;
    private final InscriptionRepository inscriptionRepository;
    private final InscriptionService inscriptionService;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationRepository notificationRepository;
    private final ObtentionRepository obtentionRepository;
    private final CertificatRepository certificatRepository;
    private final MissionService missionService;
    private final GamificationService gamificationService;
    private final RecommandationService recommandationService;

    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(String email) {
        Benevole b = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Bénévole introuvable : " + email));

        List<String> competenceNoms = b.getCompetences().stream()
                .map(Competence::getNom)
                .toList();

        List<Long> domaineIds = b.getDomaines().stream()
                .map(Domaine::getId)
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("id", b.getIdUtilisateur());
        result.put("email", b.getEmail());
        result.put("prenom", b.getPrenom());
        result.put("nom", b.getNom());
        result.put("telephone", b.getTelephone());
        result.put("dateNaissance", b.getDateNaissance());
        result.put("ville", b.getVille());
        result.put("biographie", b.getBiographie());
        result.put("rayonDeplacementKm", b.getRayonDeplacementKm());
        result.put("competences", competenceNoms);
        result.put("domaineIds", domaineIds);
        result.put("photoUrl", b.getPhotoUrl());
        result.put("latitude", b.getLatitude());
        result.put("longitude", b.getLongitude());
        return result;
    }

    /** Profil public : identité réduite, niveau, bannière et badges décrochés. */
    @Transactional(readOnly = true)
    public ProfilPublicDto profilPublic(Long id) {
        Benevole b = benevoleRepository.findById(id)
                .filter(x -> x.getStatut() == StatutUtilisateur.ACTIF)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profil introuvable"));
        GamificationDto g = gamificationService.profil(id);
        return new ProfilPublicDto(
                b.getIdUtilisateur(),
                b.getPrenom(),
                b.getNom() != null && !b.getNom().isBlank() ? b.getNom().substring(0, 1).toUpperCase() + "." : null,
                b.getVille(),
                b.getPhotoUrl(),
                b.getBiographie(),
                b.getCompetences().stream().map(Competence::getNom).toList(),
                b.getCreatedAt(),
                g.niveau(),
                g.nomNiveau(),
                g.theme(),
                g.badges().stream().filter(GamificationDto.BadgeDto::obtenu).toList());
    }

    @Transactional(readOnly = true)
    public BenevoleDashboardDto getDashboardData(String email) {
        Benevole b = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bénévole introuvable"));

        List<Inscription> allInscriptions = inscriptionRepository.findDashboardInscriptions(b.getIdUtilisateur());
        
        // 1. Inscriptions des missions terminées (répartition par domaine)
        List<Inscription> realizedInscriptions = allInscriptions.stream()
                .filter(i -> i.getStatut() == StatutInscription.CONFIRMEE)
                .filter(i -> i.getMission().getStatut() == StatutMission.TERMINEE || i.getMission().getStatut() == StatutMission.CLOTUREE)
                .toList();

        // 2. Niveau, progression et badges (niveau = missions avec certificat délivré)
        GamificationDto gamification = gamificationService.profil(b.getIdUtilisateur());
        long missionsRealisees = gamification.niveau();

        // 3. Badges et attente
        int badgesObtenus = (int) obtentionRepository.countByBenevole_IdUtilisateur(b.getIdUtilisateur());
        long enListeAttenteCount = allInscriptions.stream()
                .filter(i -> i.getStatut() == StatutInscription.EN_LISTE_ATTENTE)
                .count();

        // 4. Prochaines missions (CONFIRMEE + non terminées)
        List<MissionCardDto> prochainesMissions = allInscriptions.stream()
                .filter(i -> i.getStatut() == StatutInscription.CONFIRMEE)
                .filter(i -> i.getMission().getStatut() != StatutMission.TERMINEE && i.getMission().getStatut() != StatutMission.CLOTUREE)
                .map(i -> missionService.toCardDto(i.getMission()))
                .limit(3)
                .collect(Collectors.toList());

        // 5. Liste d'attente
        List<BenevoleInscriptionDto> listeAttente = allInscriptions.stream()
                .filter(i -> i.getStatut() == StatutInscription.EN_LISTE_ATTENTE)
                .map(i -> new BenevoleInscriptionDto(
                        i.getIdInscription(),
                        i.getMission().getIdMission(),
                        i.getMission().getTitre(),
                        i.getMission().getAssociation() != null ? i.getMission().getAssociation().getNom() : null,
                        i.getMission().getDomaine() != null ? i.getMission().getDomaine().getNom() : null,
                        i.getMission().getAssociation() != null ? i.getMission().getAssociation().getVille() : null,
                        i.getMission().getDateDebut(),
                        i.getMission().getDateFin(),
                        i.getStatut(),
                        i.getRang(),
                        i.getDateInscription()
                ))
                .limit(3)
                .collect(Collectors.toList());

        // 6. Notifications
        List<NotificationDto> dernieresNotifications = notificationRepository.findTop3ByUtilisateur_IdUtilisateurOrderByCreatedAtDesc(b.getIdUtilisateur())
                .stream()
                .map(n -> new NotificationDto(n.getIdNotification(),
                        n.getCategorie() != null ? n.getCategorie().name() : "SYSTEME",
                        n.getTitre(), n.getMessage(), n.getLien(),
                        Boolean.TRUE.equals(n.getLue()), n.getCreatedAt()))
                .collect(Collectors.toList());

        // 7. Activité mensuelle (6 derniers mois)
        List<MonthlyActivityDto> activiteMensuelle = getMonthlyActivity(b.getIdUtilisateur(), allInscriptions);

        // 8. Missions par domaine
        List<DomaineStatDto> missionsParDomaine = getMissionsParDomaine(realizedInscriptions);

        return BenevoleDashboardDto.builder()
                .prenom(b.getPrenom())
                .missionsRealisees(missionsRealisees)
                .badgesObtenus(badgesObtenus)
                .enListeAttenteCount(enListeAttenteCount)
                .gamification(gamification)
                .prochainesMissions(prochainesMissions)
                .listeAttente(listeAttente)
                .dernieresNotifications(dernieresNotifications)
                .activiteMensuelle(activiteMensuelle)
                .missionsParDomaine(missionsParDomaine)
                .build();
    }

    private List<MonthlyActivityDto> getMonthlyActivity(Long benevoleId, List<Inscription> inscriptions) {
        List<MonthlyActivityDto> result = new ArrayList<>();
        List<Certificat> certificats = certificatRepository.findByInscription_Benevole_IdUtilisateur(benevoleId);
        
        Calendar cal = Calendar.getInstance();
        for (int i = 5; i >= 0; i--) {
            cal.setTime(new Date());
            cal.add(Calendar.MONTH, -i);
            int month = cal.get(Calendar.MONTH) + 1;
            int year = cal.get(Calendar.YEAR);
            String monthLabel = cal.getDisplayName(Calendar.MONTH, Calendar.SHORT, Locale.FRENCH);
            
            long countInsc = inscriptions.stream()
                    .filter(ins -> inMonth(ins.getDateInscription(), month, year))
                    .count();

            long countCert = certificats.stream()
                    .filter(c -> inMonth(c.getDateDelivrance(), month, year))
                    .count();
            
            result.add(new MonthlyActivityDto(monthLabel, (int) countInsc, (int) countCert));
        }
        return result;
    }

    private boolean inMonth(LocalDateTime date, int month, int year) {
        return date != null && date.getMonthValue() == month && date.getYear() == year;
    }

    private List<DomaineStatDto> getMissionsParDomaine(List<Inscription> inscriptions) {
        Map<String, Integer> counts = new HashMap<>();
        String[] colors = {"#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"};
        
        for (Inscription i : inscriptions) {
            String domaine = i.getMission().getDomaine() != null ? i.getMission().getDomaine().getNom() : "Autre";
            counts.put(domaine, counts.getOrDefault(domaine, 0) + 1);
        }
        
        List<DomaineStatDto> result = new ArrayList<>();
        int idx = 0;
        for (Map.Entry<String, Integer> entry : counts.entrySet()) {
            result.add(new DomaineStatDto(entry.getKey(), entry.getValue(), colors[idx % colors.length]));
            idx++;
        }
        return result;
    }

    public Map<String, Object> updateProfile(String email, BenevoleProfileDto dto) {
        Benevole b = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Bénévole introuvable : " + email));
        // Compétences, position ou rayon peuvent changer : recommandations à recalculer
        recommandationService.invalider(b.getIdUtilisateur());

        if (dto.getPrenom() != null) {
            b.setPrenom(dto.getPrenom());
        }
        if (dto.getNom() != null) {
            b.setNom(dto.getNom());
        }
        if (dto.getTelephone() != null) {
            b.setTelephone(dto.getTelephone());
        }
        if (dto.getDateNaissance() != null) {
            b.setDateNaissance(dto.getDateNaissance());
        }
        if (dto.getVille() != null) {
            b.setVille(dto.getVille());
        }
        if (dto.getBiographie() != null) {
            b.setBiographie(dto.getBiographie());
        }
        if (dto.getRayonDeplacementKm() != null) {
            b.setRayonDeplacementKm(dto.getRayonDeplacementKm());
        }
        if (dto.getLatitude() != null) {
            b.setLatitude(dto.getLatitude());
        }
        if (dto.getLongitude() != null) {
            b.setLongitude(dto.getLongitude());
        }
        if (dto.getPhotoUrl() != null) {
            b.setPhotoUrl(dto.getPhotoUrl());
        }
        if (dto.getCompetences() != null) {
            List<Competence> competences = new ArrayList<>();
            for (String nom : dto.getCompetences()) {
                // Chercher la compétence existante ou en créer une nouvelle
                Competence competence = competenceRepository.findByNomIgnoreCase(nom)
                        .orElseGet(() -> competenceRepository.save(new Competence(nom, null, null)));
                competences.add(competence);
            }
            b.setCompetences(competences);
        }

        if (dto.getDomaineIds() != null) {
            if (dto.getDomaineIds().isEmpty()) {
                b.setDomaines(new ArrayList<>());
            } else {
                List<Domaine> domaines = domaineRepository.findAllById(dto.getDomaineIds());
                b.setDomaines(domaines);
            }
        }

        benevoleRepository.save(b);
        return getProfile(email);
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        Benevole b = charger(email);
        if (!passwordEncoder.matches(currentPassword, b.getMotDePasseHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mot de passe actuel incorrect.");
        }
        b.setMotDePasseHash(passwordEncoder.encode(newPassword));
        benevoleRepository.save(b);
        notificationService.notifierMotDePasseModifie(b);
    }

    /**
     * Désactivation volontaire : annule les inscriptions aux missions pas encore commencées
     * (sauf venue confirmée en renfort urgent ; promotion de la liste d'attente et association prévenue), puis envoie une confirmation.
     */
    public void desactiver(String email) {
        Benevole b = charger(email);
        LocalDateTime now = LocalDateTime.now();
        List<String> annulees = new ArrayList<>();
        inscriptionRepository.findByBenevole_IdUtilisateurOrderByDateInscriptionDesc(b.getIdUtilisateur()).stream()
                .filter(i -> i.getStatut() != StatutInscription.ANNULEE)
                .filter(i -> i.getMission().getDateDebut() == null || i.getMission().getDateDebut().isAfter(now))
                // Une venue confirmée en renfort urgent ne peut pas être annulée (règle d'InscriptionService)
                .filter(i -> !(i.getStatut() == StatutInscription.CONFIRMEE
                        && i.getMission().getStatut() == StatutMission.RENFORT_URGENT))
                .forEach(i -> {
                    inscriptionService.annuler(email, i.getMission().getIdMission());
                    annulees.add(i.getMission().getTitre());
                });
        b.setStatut(StatutUtilisateur.DESACTIVE);
        benevoleRepository.save(b);
        notificationService.notifier(b, CategorieNotif.COMPTE,
                "Votre compte a été désactivé",
                "Votre compte CountMeIn a bien été désactivé à votre demande."
                        + (annulees.isEmpty() ? "" : "\n" + annulees.size() + " inscription(s) annulée(s) : "
                                + String.join(", ", annulees) + ".")
                        + "\nVotre historique et vos certificats sont conservés. Pour réactiver votre compte,"
                        + " contactez l'équipe CountMeIn.",
                null);
    }

    private Benevole charger(String email) {
        return benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bénévole introuvable."));
    }
}

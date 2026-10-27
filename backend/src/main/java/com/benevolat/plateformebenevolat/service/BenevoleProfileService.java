package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.*;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    private final NotificationRepository notificationRepository;
    private final ObtentionRepository obtentionRepository;
    private final CertificatRepository certificatRepository;
    private final MissionService missionService;

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

    @Transactional(readOnly = true)
    public BenevoleDashboardDto getDashboardData(String email) {
        Benevole b = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bénévole introuvable"));

        List<Inscription> allInscriptions = inscriptionRepository.findDashboardInscriptions(b.getIdUtilisateur());
        
        // 1. Missions réalisées (CONFIRMEE + Mission TERMINEE/CLOTUREE)
        List<Inscription> realizedInscriptions = allInscriptions.stream()
                .filter(i -> i.getStatut() == StatutInscription.CONFIRMEE)
                .filter(i -> i.getMission().getStatut() == StatutMission.TERMINEE || i.getMission().getStatut() == StatutMission.CLOTUREE)
                .toList();
        long missionsRealisees = realizedInscriptions.size();

        // 2. Niveau et progression
        String niveauActuel = getNiveauLabel(missionsRealisees);
        NiveauProgression nextNiveau = getNextNiveauInfo(missionsRealisees);
        int progressPct = nextNiveau.totalPourSuivant <= 0
                ? 100
                : Math.min(100, (int) Math.round(((double) missionsRealisees / nextNiveau.totalPourSuivant) * 100));

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
        List<NotificationDto> dernieresNotifications = notificationRepository.findByUtilisateur_IdUtilisateurOrderByCreatedAtDesc(b.getIdUtilisateur())
                .stream()
                .map(n -> NotificationDto.builder()
                        .id(n.getIdNotification())
                        .type(n.getType())
                        .titre(n.getTitre())
                        .message(n.getMessage())
                        .lu(Boolean.TRUE.equals(n.getLue()))
                        .createdAt(n.getCreatedAt())
                        .build())
                .limit(3)
                .collect(Collectors.toList());

        // 7. Activité mensuelle (6 derniers mois)
        List<MonthlyActivityDto> activiteMensuelle = getMonthlyActivity(b.getIdUtilisateur(), allInscriptions);

        // 8. Missions par domaine
        List<DomaineStatDto> missionsParDomaine = getMissionsParDomaine(realizedInscriptions);

        return BenevoleDashboardDto.builder()
                .prenom(b.getPrenom())
                .missionsRealisees(missionsRealisees)
                .niveauActuel(niveauActuel)
                .badgesObtenus(badgesObtenus)
                .enListeAttenteCount(enListeAttenteCount)
                .progressPct(progressPct)
                .missionsPourSuivant((int) missionsRealisees)
                .missionsTotalPourSuivant(nextNiveau.totalPourSuivant)
                .prochainNiveauLabel(nextNiveau.label)
                .prochainesMissions(prochainesMissions)
                .listeAttente(listeAttente)
                .dernieresNotifications(dernieresNotifications)
                .activiteMensuelle(activiteMensuelle)
                .missionsParDomaine(missionsParDomaine)
                .build();
    }

    private String getNiveauLabel(long count) {
        if (count >= 30) return "Champion";
        if (count >= 15) return "Expert";
        if (count >= 5) return "Engagé";
        return "Débutant";
    }

    private static class NiveauProgression {
        String label;
        int totalPourSuivant;
        NiveauProgression(String l, int t) { label = l; totalPourSuivant = t; }
    }

    private NiveauProgression getNextNiveauInfo(long count) {
        if (count >= 30) return new NiveauProgression("Champion", 30);
        if (count >= 15) return new NiveauProgression("Champion", 30);
        if (count >= 5) return new NiveauProgression("Expert", 15);
        return new NiveauProgression("Engagé", 5);
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
}

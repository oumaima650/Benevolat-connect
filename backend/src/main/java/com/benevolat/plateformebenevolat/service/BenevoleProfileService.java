package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.BenevoleProfileDto;
import com.benevolat.plateformebenevolat.entity.Benevole;
import com.benevolat.plateformebenevolat.entity.Competence;
import com.benevolat.plateformebenevolat.entity.Domaine;
import com.benevolat.plateformebenevolat.entity.StatutInscription;
import com.benevolat.plateformebenevolat.entity.StatutUtilisateur;
import com.benevolat.plateformebenevolat.entity.CategorieNotif;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
import com.benevolat.plateformebenevolat.repository.CompetenceRepository;
import com.benevolat.plateformebenevolat.repository.DomaineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
     * (promotion de la liste d'attente et association prévenue), puis envoie une confirmation.
     */
    public void desactiver(String email) {
        Benevole b = charger(email);
        LocalDateTime now = LocalDateTime.now();
        List<String> annulees = new ArrayList<>();
        inscriptionRepository.findByBenevole_IdUtilisateurOrderByDateInscriptionDesc(b.getIdUtilisateur()).stream()
                .filter(i -> i.getStatut() != StatutInscription.ANNULEE)
                .filter(i -> i.getMission().getDateDebut() == null || i.getMission().getDateDebut().isAfter(now))
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

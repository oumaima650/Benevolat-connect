package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.BenevoleInscriptionDto;
import com.benevolat.plateformebenevolat.dto.InscriptionResponseDto;
import com.benevolat.plateformebenevolat.entity.Benevole;
import com.benevolat.plateformebenevolat.entity.CategorieNotif;
import com.benevolat.plateformebenevolat.entity.Inscription;
import com.benevolat.plateformebenevolat.entity.Mission;
import com.benevolat.plateformebenevolat.entity.StatutInscription;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import com.benevolat.plateformebenevolat.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service transactionnel unique gérant l'inscription et l'annulation d'un bénévole
 * à une mission (places principales + liste d'attente).
 *
 * Toute la logique métier est centralisée ici. La ligne Mission est verrouillée
 * en écriture (PESSIMISTIC_WRITE) pour éviter toute concurrence sur les compteurs.
 */
@Service
@RequiredArgsConstructor
public class InscriptionService {

    private final MissionRepository missionRepository;
    private final InscriptionRepository inscriptionRepository;
    private final BenevoleRepository benevoleRepository;
    private final MissionPlacesService missionPlacesService;
    private final NotificationService notificationService;

    /**
     * Inscrire le bénévole connecté à une mission.
     *
     * Règles :
     * 1. La mission doit être PUBLIEE / SATUREE (avant la date de début)
     *    ou RENFORT_URGENT (tant que la mission n'est pas terminée).
     * 2. Pas de double inscription active (CONFIRMEE ou EN_LISTE_ATTENTE).
     * 3. Cas A : places restantes > 0 → CONFIRMEE.
     * 4. Cas B : sinon, place en liste d'attente disponible → EN_LISTE_ATTENTE (rang = dernier + 1).
     * 5. Cas C : sinon refus (mission pleine).
     * 6. Le statut de la mission est recalculé (SATUREE, fin de renfort…).
     */
    @Transactional
    public InscriptionResponseDto inscrire(String email, Long missionId) {
        Benevole benevole = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bénévole introuvable."));

        Mission mission = missionRepository.findByIdForUpdate(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable."));

        // Règle 1 — statut et date
        LocalDateTime now = LocalDateTime.now();
        StatutMission statut = mission.getStatut();
        if (statut == StatutMission.RENFORT_URGENT) {
            if (mission.getDateFin() != null && mission.getDateFin().isBefore(now)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "La mission est terminée.");
            }
        } else if (statut == StatutMission.PUBLIEE || statut == StatutMission.SATUREE) {
            if (mission.getDateDebut() != null && mission.getDateDebut().isBefore(now)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "La mission a déjà débuté, les inscriptions sont closes.");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La mission n'est pas ouverte aux inscriptions (statut : " + statut + ").");
        }

        // Règle 2 — déjà inscrit ?
        Inscription inscription = inscriptionRepository
                .findByBenevole_IdUtilisateurAndMission_IdMission(benevole.getIdUtilisateur(), missionId)
                .orElse(null);

        if (inscription != null
                && (inscription.getStatut() == StatutInscription.CONFIRMEE
                || inscription.getStatut() == StatutInscription.EN_LISTE_ATTENTE)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Déjà inscrit");
        }

        int nbPlaces = missionPlacesService.placesRestantes(mission);
        int nbAttente = missionPlacesService.countAttente(missionId);
        int capaciteAttente = missionPlacesService.capaciteTotale(mission);

        StatutInscription nouveauStatut;
        Integer rang = null;

        if (nbPlaces > 0) {
            // Cas A — place principale
            mission.setNbPlaces(nbPlaces - 1);
            nouveauStatut = StatutInscription.CONFIRMEE;
        } else if (nbAttente < capaciteAttente) {
            // Cas B — liste d'attente
            nouveauStatut = StatutInscription.EN_LISTE_ATTENTE;
            rang = nbAttente + 1;
        } else {
            // Cas C — mission pleine
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Mission complète, aucune place disponible ni en liste d'attente.");
        }

        // Création ou réutilisation de l'inscription (contrainte unique)
        if (inscription == null) {
            inscription = new Inscription(benevole, mission, nouveauStatut, rang);
        } else {
            inscription.setStatut(nouveauStatut);
            inscription.setRang(rang);
        }
        inscription.setRappelEnvoye(false);
        inscription.setDateInscription(now);
        inscriptionRepository.save(inscription);

        // Règle 6 — recalcul des compteurs et du statut
        missionPlacesService.recalculer(mission);

        // F28 : confirmation au bénévole + information de l'association
        String lien = "/missions/" + missionId;
        var details = NotificationService.detailsMission(mission);
        if (nouveauStatut == StatutInscription.CONFIRMEE) {
            notificationService.notifier(benevole, CategorieNotif.INSCRIPTION,
                    "Inscription confirmée",
                    "Votre inscription à la mission « " + mission.getTitre() + " » est confirmée. Merci pour votre engagement !",
                    lien, details);
        } else {
            details.put("Rang", "n°" + rang + " sur la liste d'attente");
            notificationService.notifier(benevole, CategorieNotif.LISTE_ATTENTE,
                    "Vous êtes en liste d'attente (rang " + rang + ")",
                    "La mission « " + mission.getTitre() + " » est complète. Vous êtes n°" + rang
                            + " sur la liste d'attente : vous serez prévenu(e) dès qu'une place se libère.",
                    lien, details);
        }
        notificationService.notifier(mission.getAssociation(), CategorieNotif.INSCRIPTION,
                nouveauStatut == StatutInscription.CONFIRMEE ? "Nouvel inscrit" : "Nouvelle inscription en liste d'attente",
                NotificationService.nomAffiche(benevole) + " " + (benevole.getNom() != null ? benevole.getNom() : "")
                        + (nouveauStatut == StatutInscription.CONFIRMEE ? " s'est inscrit(e) à « " : " a rejoint la liste d'attente de « ")
                        + mission.getTitre() + " ».",
                "/association/inscrits", false);

        return new InscriptionResponseDto(nouveauStatut, rang, mission.getNbPlaces(),
                mission.getNbPlacesListeAttente(), mission.getStatut());
    }

    /**
     * Annuler l'inscription du bénévole à une mission.
     *
     * - Si CONFIRMEE : une place se libère, le 1er de la liste d'attente est promu
     *   (sinon la mission repasse PUBLIEE si elle était SATUREE).
     * - Si EN_LISTE_ATTENTE : les rangs suivants sont décalés.
     * - Dans tous les cas : statut = ANNULEE.
     */
    @Transactional
    public InscriptionResponseDto annuler(String email, Long missionId) {
        Benevole benevole = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bénévole introuvable."));

        Mission mission = missionRepository.findByIdForUpdate(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable."));

        Inscription inscription = inscriptionRepository
                .findByBenevole_IdUtilisateurAndMission_IdMission(benevole.getIdUtilisateur(), missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Aucune inscription trouvée pour cette mission."));

        if (inscription.getStatut() == StatutInscription.ANNULEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "L'inscription est déjà annulée.");
        }
        // F18 : annulation possible uniquement avant le début de la mission
        if (mission.getDateDebut() != null && mission.getDateDebut().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La mission a déjà commencé : l'inscription ne peut plus être annulée.");
        }

        if (inscription.getStatut() == StatutInscription.CONFIRMEE) {
            mission.setNbPlaces(missionPlacesService.placesRestantes(mission) + 1);
        }

        inscription.setStatut(StatutInscription.ANNULEE);
        inscription.setRang(null);
        inscriptionRepository.save(inscription);

        // Promotion de la liste d'attente + renumérotation + statut
        missionPlacesService.recalculer(mission);

        notificationService.notifier(mission.getAssociation(), CategorieNotif.ANNULATION,
                "Désistement d'un bénévole",
                NotificationService.nomAffiche(benevole) + " " + (benevole.getNom() != null ? benevole.getNom() : "")
                        + " a annulé son inscription à « " + mission.getTitre() + " ».",
                "/association/inscrits");

        return new InscriptionResponseDto(StatutInscription.ANNULEE, null, mission.getNbPlaces(),
                mission.getNbPlacesListeAttente(), mission.getStatut());
    }

    /**
     * Récupère l'inscription active (CONFIRMEE ou EN_LISTE_ATTENTE) du bénévole pour une mission.
     *
     * @return l'inscription si elle existe, null sinon.
     */
    @Transactional(readOnly = true)
    public Inscription getInscriptionActive(String email, Long missionId) {
        Benevole benevole = benevoleRepository.findByEmail(email).orElse(null);
        if (benevole == null) {
            return null;
        }
        return inscriptionRepository
                .findByBenevole_IdUtilisateurAndMission_IdMission(benevole.getIdUtilisateur(), missionId)
                .filter(i -> i.getStatut() == StatutInscription.CONFIRMEE
                        || i.getStatut() == StatutInscription.EN_LISTE_ATTENTE)
                .orElse(null);
    }

    /**
     * Liste toutes les inscriptions du bénévole (tous statuts confondus),
     * triées par date d'inscription décroissante.
     */
    @Transactional(readOnly = true)
    public List<BenevoleInscriptionDto> listInscriptionsDuBenevole(String email) {
        Benevole benevole = benevoleRepository.findByEmail(email).orElse(null);
        if (benevole == null) {
            return List.of();
        }
        return inscriptionRepository
                .findByBenevole_IdUtilisateurOrderByDateInscriptionDesc(benevole.getIdUtilisateur())
                .stream()
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
                .collect(Collectors.toList());
    }
}

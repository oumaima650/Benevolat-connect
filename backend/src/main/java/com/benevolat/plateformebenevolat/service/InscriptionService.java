package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.BenevoleInscriptionDto;
import com.benevolat.plateformebenevolat.dto.InscriptionResponseDto;
import com.benevolat.plateformebenevolat.entity.Benevole;
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

    /**
     * Inscrire le bénévole connecté à une mission.
     *
     * Règles :
     * 1. La mission doit être PUBLIEE ou SATUREE et sa date de début non passée.
     * 2. Pas de double inscription active (CONFIRMEE ou EN_LISTE_ATTENTE).
     * 3. Cas A : nbPlaces > 0 → inscription CONFIRMEE, nbPlaces--.
     * 4. Cas B : nbPlaces == 0 et nbPlacesListeAttente > 0 → EN_LISTE_ATTENTE, rang = nb_attente+1, nbPlacesListeAttente--.
     * 5. Cas C : les deux à 0 → refus (mission pleine).
     * 6. Si nbPlaces == 0 après inscription, la mission passe à SATUREE.
     */
    @Transactional
    public InscriptionResponseDto inscrire(String email, Long missionId) {
        Benevole benevole = benevoleRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bénévole introuvable."));

        Mission mission = missionRepository.findByIdForUpdate(missionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mission introuvable."));

        // Règle 1 — statut et date
        if (mission.getStatut() != StatutMission.PUBLIEE && mission.getStatut() != StatutMission.SATUREE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La mission n'est pas ouverte aux inscriptions (statut : " + mission.getStatut() + ").");
        }
        if (mission.getDateDebut() != null && mission.getDateDebut().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La mission a déjà débuté, les inscriptions sont closes.");
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

        int nbPlaces = mission.getNbPlaces() != null ? mission.getNbPlaces() : 0;
        int nbListe = mission.getNbPlacesListeAttente() != null ? mission.getNbPlacesListeAttente() : 0;

        StatutInscription nouveauStatut;
        Integer rang = null;

        if (nbPlaces > 0) {
            // Cas A — place principale
            nbPlaces--;
            nouveauStatut = StatutInscription.CONFIRMEE;
        } else if (nbListe > 0) {
            // Cas B — liste d'attente
            nbListe--;
            nouveauStatut = StatutInscription.EN_LISTE_ATTENTE;
            long nbAttenteExistants = inscriptionRepository
                    .findByMission_IdMissionAndStatutOrderByRangAsc(missionId, StatutInscription.EN_LISTE_ATTENTE)
                    .size();
            rang = (int) nbAttenteExistants + 1;
        } else {
            // Cas C — mission pleine
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Mission complète, aucune place disponible ni en liste d'attente.");
        }

        // Sécurité : compteurs jamais négatifs
        nbPlaces = Math.max(0, nbPlaces);
        nbListe = Math.max(0, nbListe);

        mission.setNbPlaces(nbPlaces);
        mission.setNbPlacesListeAttente(nbListe);

        // Règle 6 — si plus de place principale, mission SATUREE
        if (nbPlaces == 0 && mission.getStatut() == StatutMission.PUBLIEE) {
            mission.setStatut(StatutMission.SATUREE);
        }

        // Création ou réutilisation de l'inscription (contrainte unique)
        if (inscription == null) {
            inscription = new Inscription(benevole, mission, nouveauStatut, rang);
        } else {
            inscription.setStatut(nouveauStatut);
            inscription.setRang(rang);
        }
        inscription.setRappelEnvoye(false);
        inscription.setDateInscription(LocalDateTime.now());
        inscriptionRepository.save(inscription);

        return new InscriptionResponseDto(nouveauStatut, rang, nbPlaces, nbListe, mission.getStatut());
    }

    /**
     * Annuler l'inscription du bénévole à une mission.
     *
     * - Si CONFIRMEE : promotion du 1er de la liste d'attente (s'il existe) en CONFIRMEE,
     *   nbPlacesListeAttente++, décrément des rangs suivants. Sinon nbPlaces++ et mission
     *   repasse à PUBLIEE si elle était SATUREE.
     * - Si EN_LISTE_ATTENTE : nbPlacesListeAttente++ et décrément des rangs supérieurs.
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

        StatutInscription oldStatut = inscription.getStatut();
        int nbPlaces = mission.getNbPlaces() != null ? mission.getNbPlaces() : 0;
        int nbListe = mission.getNbPlacesListeAttente() != null ? mission.getNbPlacesListeAttente() : 0;

        if (oldStatut == StatutInscription.CONFIRMEE) {
            List<Inscription> enAttente = inscriptionRepository
                    .findByMission_IdMissionAndStatutOrderByRangAsc(missionId, StatutInscription.EN_LISTE_ATTENTE);

            if (!enAttente.isEmpty()) {
                // Promotion du 1er de la liste d'attente
                Inscription premier = enAttente.get(0);
                premier.setStatut(StatutInscription.CONFIRMEE);
                premier.setRang(null);
                nbListe = Math.max(0, nbListe + 1);

                // Décrément des autres rangs
                for (int i = 1; i < enAttente.size(); i++) {
                    Inscription w = enAttente.get(i);
                    if (w.getRang() != null && w.getRang() > 1) {
                        w.setRang(w.getRang() - 1);
                    }
                }
            } else {
                // Pas de liste d'attente : on libère une place
                nbPlaces++;
                if (mission.getStatut() == StatutMission.SATUREE) {
                    mission.setStatut(StatutMission.PUBLIEE);
                }
            }
        } else {
            // EN_LISTE_ATTENTE
            nbListe++;
            int rangAnnule = inscription.getRang() != null ? inscription.getRang() : 0;

            List<Inscription> enAttente = inscriptionRepository
                    .findByMission_IdMissionAndStatutOrderByRangAsc(missionId, StatutInscription.EN_LISTE_ATTENTE);

            for (Inscription w : enAttente) {
                if (!w.getIdInscription().equals(inscription.getIdInscription())
                        && w.getRang() != null && w.getRang() > rangAnnule) {
                    w.setRang(w.getRang() - 1);
                }
            }
        }

        inscription.setStatut(StatutInscription.ANNULEE);
        inscription.setRang(null);

        mission.setNbPlaces(nbPlaces);
        mission.setNbPlacesListeAttente(nbListe);

        return new InscriptionResponseDto(StatutInscription.ANNULEE, null, nbPlaces, nbListe, mission.getStatut());
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

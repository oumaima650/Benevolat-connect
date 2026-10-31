package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.entity.CategorieNotif;
import com.benevolat.plateformebenevolat.entity.Inscription;
import com.benevolat.plateformebenevolat.entity.Mission;
import com.benevolat.plateformebenevolat.entity.StatutInscription;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import com.benevolat.plateformebenevolat.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Logique centralisée des places d'une mission.
 *
 * Convention BDD :
 * - Mission.nbPlaces              = places principales RESTANTES (pas le total).
 * - Mission.nbPlacesListeAttente  = places restantes en liste d'attente.
 * - Capacité totale               = inscrits confirmés + nbPlaces.
 * - Capacité de la liste d'attente = capacité totale (autant de places d'attente que de places).
 */
@Service
@RequiredArgsConstructor
public class MissionPlacesService {

    private final InscriptionRepository inscriptionRepository;
    private final NotificationService notificationService;

    public int countConfirmes(Long missionId) {
        return (int) inscriptionRepository.countByMission_IdMissionAndStatut(missionId, StatutInscription.CONFIRMEE);
    }

    public int countAttente(Long missionId) {
        return (int) inscriptionRepository.countByMission_IdMissionAndStatut(missionId, StatutInscription.EN_LISTE_ATTENTE);
    }

    public int placesRestantes(Mission m) {
        return m.getNbPlaces() != null ? Math.max(0, m.getNbPlaces()) : 0;
    }

    public int capaciteTotale(Mission m) {
        return countConfirmes(m.getIdMission()) + placesRestantes(m);
    }

    /**
     * Recalcule l'état d'une mission après un changement de places ou d'inscriptions :
     * 1. promeut la liste d'attente (ordre des rangs) tant qu'il reste des places ;
     * 2. renumérote les rangs restants ;
     * 3. met à jour les places restantes en liste d'attente ;
     * 4. ajuste le statut (PUBLIEE ↔ SATUREE, fin du RENFORT_URGENT quand il est comblé).
     *
     * @return les inscriptions promues de la liste d'attente vers CONFIRMEE
     */
    @Transactional
    public List<Inscription> recalculer(Mission m) {
        int restantes = placesRestantes(m);

        List<Inscription> attente = inscriptionRepository
                .findByMission_IdMissionAndStatutOrderByRangAsc(m.getIdMission(), StatutInscription.EN_LISTE_ATTENTE);

        int nbPromus = Math.min(restantes, attente.size());
        List<Inscription> promus = List.copyOf(attente.subList(0, nbPromus));
        for (Inscription i : promus) {
            i.setStatut(StatutInscription.CONFIRMEE);
            i.setRang(null);
        }
        restantes -= nbPromus;

        // F17 : chaque bénévole promu est prévenu
        for (Inscription i : promus) {
            notificationService.notifier(i.getBenevole(), CategorieNotif.PROMOTION,
                    "Une place s'est libérée : vous êtes confirmé(e) !",
                    "Bonne nouvelle : vous passez de la liste d'attente à une place confirmée pour la mission « "
                            + m.getTitre() + " ».",
                    "/missions/" + m.getIdMission(), NotificationService.detailsMission(m));
        }

        List<Inscription> resteAttente = attente.subList(nbPromus, attente.size());
        for (int r = 0; r < resteAttente.size(); r++) {
            resteAttente.get(r).setRang(r + 1);
        }
        inscriptionRepository.saveAll(attente);

        int confirmes = countConfirmes(m.getIdMission());
        int total = confirmes + restantes;
        m.setNbPlaces(restantes);
        m.setNbPlacesListeAttente(Math.max(0, total - resteAttente.size()));

        StatutMission s = m.getStatut();
        if (s == StatutMission.PUBLIEE && restantes == 0) {
            m.setStatut(StatutMission.SATUREE);
        } else if (s == StatutMission.SATUREE && restantes > 0) {
            m.setStatut(StatutMission.PUBLIEE);
        } else if (s == StatutMission.RENFORT_URGENT && restantes == 0) {
            // Renfort comblé : demanderRenfort ajoute les places demandées à nbPlaces,
            // donc plus aucune place libre = besoin couvert ; la mission reprend son cours normal
            m.setNbRenfortDemande(0);
            notificationService.notifier(m.getAssociation(), CategorieNotif.RENFORT,
                    "Renfort comblé",
                    "Le besoin de renfort de la mission « " + m.getTitre() + " » est entièrement comblé.",
                    "/association/renforts");
            boolean demarree = m.getDateDebut() != null && !m.getDateDebut().isAfter(LocalDateTime.now());
            m.setStatut(demarree ? StatutMission.EN_COURS : StatutMission.SATUREE);
        }
        return promus;
    }
}

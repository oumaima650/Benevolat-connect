package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.StatutInscription;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Réponse renvoyée après une inscription ou une annulation.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InscriptionResponseDto {

    /** Statut de l'inscription (CONFIRMEE, EN_LISTE_ATTENTE ou ANNULEE). */
    private StatutInscription statutInscription;

    /** Rang en liste d'attente (null si confirmée ou annulée). */
    private Integer rang;

    /** Places restantes dans la mission après l'opération. */
    private Integer nbPlaces;

    /** Places restantes en liste d'attente après l'opération. */
    private Integer nbPlacesListeAttente;

    /** Statut de la mission mis à jour. */
    private StatutMission statutMission;
}

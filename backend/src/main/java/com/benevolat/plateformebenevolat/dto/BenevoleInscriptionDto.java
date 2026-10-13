package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.StatutInscription;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Inscription d'un bénévole, vue côté bénévole (pour la page "Mes inscriptions").
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BenevoleInscriptionDto {

    private Long idInscription;
    private Long missionId;
    private String missionTitre;
    private String association;
    private String domaine;
    private String ville;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private StatutInscription statut;
    /** Rang en liste d'attente (null si confirmée ou annulée). */
    private Integer rang;
    private LocalDateTime dateInscription;
}

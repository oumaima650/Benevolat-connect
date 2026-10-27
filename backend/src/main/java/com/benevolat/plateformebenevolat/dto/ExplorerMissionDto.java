package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.MethodeScore;
import com.benevolat.plateformebenevolat.entity.StatutInscription;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Carte / détail d'une mission pour l'espace « Explorer ».
 * Le frontend n'applique aucune règle métier : il se contente d'afficher ces champs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExplorerMissionDto {
    private Long id;
    private String titre;
    private String description;
    private String domaine;
    private Long domaineId;
    private String associationNom;
    private String associationVille;
    private Long associationId;
    private String adresse;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private boolean aDistance;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private List<String> competences;
    private Integer nbPlaces;
    private Integer placesRestantes;
    private Integer listeAttenteCount;
    private Integer nbRenfortDemande;
    private StatutMission statut;
    private String imageUrl;

    /** Statut d'inscription du bénévole connecté (null si aucune ligne). */
    private StatutInscription inscriptionStatut;
    private Integer rang;
    /** true si les dates chevauchent une autre mission CONFIRMEE (RM04). */
    private boolean chevauche;

    /** Présents uniquement sur l'onglet Recommandées. */
    private Integer score;
    private String explication;
    private MethodeScore methode;
}

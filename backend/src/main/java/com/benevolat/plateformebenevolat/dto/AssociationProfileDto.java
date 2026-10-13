package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Profil complet d'une association pour le dashboard.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssociationProfileDto {

    private Long id;
    private String email;          // lecture seule
    private String nomAssociation;
    private String description;
    private String ville;
    private String adresse;
    private String contact;
    private String logoUrl;
    private String statutValidation; // EN_ATTENTE / VALIDE / REFUSE
    private String statutCompte;     // ACTIF / DESACTIVE / SUSPENDUE
    private Double latitude;
    private Double longitude;

    // Domaines
    private List<Long> domaineIds;
    private List<String> domaineNoms;
}

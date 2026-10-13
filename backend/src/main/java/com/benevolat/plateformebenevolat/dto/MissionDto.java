package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO complet d'une mission pour le dashboard association.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MissionDto {

    private Long id;
    private String titre;
    private String description;
    private String adresse;
    private String ville;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private Integer nbPlaces;
    private Integer nbInscritsConfirmes;
    private Integer nbListeAttente;
    private Integer nbPlacesRestantes;
    private String statut;

    // Domaine
    private Long domaineId;
    private String domaineNom;

    // Compétences
    private List<Long> competenceIds;
    private List<String> competenceNoms;

    // Association
    private Long associationId;
    private String associationNom;
    private String associationLogoUrl;
}

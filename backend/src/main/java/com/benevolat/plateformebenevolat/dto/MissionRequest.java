package com.benevolat.plateformebenevolat.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * Requête de création ou modification d'une mission.
 */
@Data
public class MissionRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;

    @NotNull(message = "Le domaine est obligatoire")
    private Long domaineId;

    private String adresse;
    private String ville;
    private BigDecimal latitude;
    private BigDecimal longitude;

    @NotBlank(message = "La date de début est obligatoire")
    private String dateDebut; // ISO format : "2026-10-15T09:00"

    private String dateFin;

    @NotNull(message = "Le nombre de places est obligatoire")
    @Min(value = 1, message = "Au moins 1 place requise")
    private Integer nbPlaces;

    private List<Long> competenceIds;

    /** "BROUILLON" (défaut) ou "PUBLIEE" */
    private String statut;
}

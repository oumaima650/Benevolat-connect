package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.StatutMission;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MissionCardDto {
    private Long id;
    private String titre;
    private String description;
    private String domaine;
    private String ville;
    private String adresse;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private Integer nbPlaces;
    private Integer placesRestantes;
    private Integer listeAttenteCount;
    private StatutMission statut;
    private String imageUrl;
    private Long associationId;
    private String associationNom;
}

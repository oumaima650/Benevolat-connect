package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.StatutMission;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

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
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer nbBenevoles;
    private Integer placesRestantes;
    private Integer listeAttenteCount;
    private StatutMission statut;
    private String badge;
    private String imageUrl;
    private Long associationId;
    private String associationNom;
}

package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.StatutMission;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MissionDetailDto {
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

    // Association fields
    private Long associationId;
    private String associationNom;
    private String associationDescription;
    private String associationDomaine;
    private String associationVille;
    private String associationEmail;
    private String associationContact;
    private String associationPhotoProfil;

    // Previous editions: missions with same titre (images from those missions)
    private List<EditionPrecedenteDto> editionsPrecedentes;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EditionPrecedenteDto {
        private Long id;
        private String imageUrl;
        private LocalDateTime dateDebut;
    }
}

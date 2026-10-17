package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO représentant un bénévole inscrit à une mission (pour le dashboard association).
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InscritDto {
    private Long inscriptionId;
    private Long benevoleId;
    private String nom;
    private String prenom;
    private String email;
    private String ville;
    private String telephone;
    private String photoUrl;
    private List<String> competences;
    private String statut;       // CONFIRMEE | EN_LISTE_ATTENTE | ANNULEE
    private Integer rang;
    private LocalDateTime dateInscription;
    private Boolean certificatDelivre;
}

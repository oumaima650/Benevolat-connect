package com.benevolat.plateformebenevolat.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class BenevoleProfileDto {
    private String prenom;
    private String nom;
    private String telephone;
    private LocalDate dateNaissance;
    private String ville;
    private String biographie;
    private Double rayonDeplacementKm;
    private List<String> competences; // noms en texte libre
    private String photoUrl;          // URL Cloudinary
    private List<Long> domaineIds;    // IDs des domaines sélectionnés
    private Double latitude;
    private Double longitude;
}



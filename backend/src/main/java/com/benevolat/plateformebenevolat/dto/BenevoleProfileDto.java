package com.benevolat.plateformebenevolat.dto;

import lombok.Data;
import java.util.List;

@Data
public class BenevoleProfileDto {
    private String prenom;
    private String nom;
    private String telephone;
    private String ville;
    private String biographie;
    private Double rayonDeplacementKm;
    private List<String> competences; // noms en texte libre
    private String photoUrl;          // URL Cloudinary
}

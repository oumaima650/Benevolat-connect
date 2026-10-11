package com.benevolat.plateformebenevolat.dto;

import lombok.Data;
import java.util.List;

/**
 * Requête de mise à jour du profil d'une association (tout sauf l'email).
 */
@Data
public class UpdateAssociationRequest {
    private String nomAssociation;
    private String description;
    private String ville;
    private String adresse;
    private String contact;
    private String logoUrl;
    private List<Long> domaineIds;
}

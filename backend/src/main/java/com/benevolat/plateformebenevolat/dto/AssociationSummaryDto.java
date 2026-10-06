package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssociationSummaryDto {
    private Long id;
    private String nom;
    private String description;
    private String domaine;
    private String ville;
    private String email;
    private String contact;
    private String photoProfil;
}

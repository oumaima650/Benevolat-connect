package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BadgeNiveauDto {
    private Long id;
    private String code;
    private String nom;
    private String description;
    private String niveau;
    private Boolean obtenu;
    private String dateObtention;
}

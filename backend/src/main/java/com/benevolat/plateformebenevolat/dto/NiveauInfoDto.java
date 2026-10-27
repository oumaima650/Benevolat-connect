package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NiveauInfoDto {
    private String nom;
    private Integer missionsActuelles;
    private Integer seuilSuivant;
    private String niveauSuivant;
}

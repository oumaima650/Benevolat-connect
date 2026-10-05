package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CertificatDto {
    private boolean valide;
    private String codeVerification;
    private LocalDate dateEmission;
    private Integer nbHeures;
    private String benevoleNom;
    private String benevolePrenom;
    private String missionTitre;
    private String associationNom;
    private String message;
}

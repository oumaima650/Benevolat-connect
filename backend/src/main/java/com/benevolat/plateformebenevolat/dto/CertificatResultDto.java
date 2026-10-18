package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CertificatResultDto {
    private Long certificatId;
    private Long inscriptionId;
    private Long benevoleId;
    private String benevoleNom;
    private String benevolePrenom;
    private String codeVerification;
    private String urlPdf;
    private LocalDateTime dateDelivrance;
    // Infos mission (pour l'espace bénévole)
    private String missionTitre;
    private String associationNom;
}

package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.StatutInscription;
import com.benevolat.plateformebenevolat.entity.StatutMission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissionCarteDto {
    private Long id;
    private String titre;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime dateDebut;
    private Integer placesRestantes;
    private StatutMission statut;
    private String domaine;
    private String ville;
    private StatutInscription inscriptionStatut;
}

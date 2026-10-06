package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StatistiquesDto {
    private long totalMissions;
    private long totalBenevoles;
    private long totalAssociations;
    private long totalHeuresValidees;
}

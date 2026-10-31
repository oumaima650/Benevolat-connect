package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MonthlyActivityDto {
    private String mois;
    private int inscriptions;
    private int certifs;
}

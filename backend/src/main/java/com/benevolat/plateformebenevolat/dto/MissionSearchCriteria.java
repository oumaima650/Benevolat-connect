package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MissionSearchCriteria {
    private String q;
    private String ville;
    private String domaine;
}

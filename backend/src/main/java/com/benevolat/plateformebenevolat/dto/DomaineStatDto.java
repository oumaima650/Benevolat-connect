package com.benevolat.plateformebenevolat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DomaineStatDto {
    private String name;
    private int value;
    private String fill;
}

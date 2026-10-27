package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.TypeNotif;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationDto {
    private Long id;
    private TypeNotif type;
    private String titre;
    private String message;
    private boolean lu;
    private LocalDateTime createdAt;
}

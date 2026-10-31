package com.benevolat.plateformebenevolat.dto;

import java.time.LocalDateTime;

/** Notification affichée dans le centre de notifications (F30). */
public record NotificationDto(
        Long id,
        String categorie,
        String titre,
        String message,
        String lien,
        boolean lue,
        LocalDateTime date
) {}

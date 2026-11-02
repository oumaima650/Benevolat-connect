package com.benevolat.plateformebenevolat.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Profil public d'un bénévole (visible par les utilisateurs connectés) : pas d'e-mail, de téléphone
 * ni d'adresse, seulement l'initiale du nom.
 */
public record ProfilPublicDto(
        Long id,
        String prenom,
        String nomInitiale,
        String ville,
        String photoUrl,
        String biographie,
        List<String> competences,
        LocalDateTime membreDepuis,
        int niveau,
        String nomNiveau,
        String theme,
        /** Badges décrochés, dans l'ordre d'affichage. */
        List<GamificationDto.BadgeDto> badges
) {}

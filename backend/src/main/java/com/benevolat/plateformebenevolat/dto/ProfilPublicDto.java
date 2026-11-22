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
        List<GamificationDto.BadgeDto> badges,
        List<MissionParticipeeDto> missionsParticipees
) {
    /** Image publiée par le bénévole pour illustrer sa participation, + infos mission. */
    public record MissionParticipeeDto(
            Long id,
            String titre,
            String association,
            String imageUrl,       // URL de l'ImageParticipation publiée par le bénévole
            String description,    // Description de l'image de participation
            String dateDebut
    ) {}
}

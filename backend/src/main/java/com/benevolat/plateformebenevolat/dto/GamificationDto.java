package com.benevolat.plateformebenevolat.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Niveau, progression et badges d'un bénévole.
 * Niveau = nombre de missions avec certificat délivré ; un badge PALIER tous les 5 niveaux.
 */
public record GamificationDto(
        int niveau,
        String nomNiveau,
        String prochainNiveauNom,
        /** Thème de la bannière de profil : celui du plus haut badge PALIER obtenu, sinon "nouveau". */
        String theme,
        BadgeDto palierActuel,
        BadgeDto prochainPalier,
        int niveauxAvantProchainPalier,
        /** Avancement dans la série de 5 niveaux en cours (0-100). */
        int progressionPalier,
        List<EtapeDto> echelle,
        List<BadgeDto> badges,
        /** Badges obtenus dont la célébration n'a pas encore été affichée. */
        List<BadgeDto> nouveauxBadges
) {

    public record BadgeDto(
            String code,
            String nom,
            String description,
            String type,
            String theme,
            int valeurCritere,
            /** Valeur actuelle du critère (plafonnée au seuil) pour afficher la progression. */
            int progression,
            boolean obtenu,
            LocalDateTime dateObtention
    ) {}

    public record EtapeDto(int niveau, String nom, boolean atteint) {}

    /** Version courte pour les listes (associations, administrateur). */
    public record Resume(int niveau, String nomNiveau, String theme, String palier) {}
}

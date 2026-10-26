package com.benevolat.plateformebenevolat.dto;

import java.util.List;

/**
 * Données exposées aux workflows n8n. Seules les informations nécessaires à la rédaction
 * de l'e-mail sont transmises (prénom, ville, centres d'intérêt — pas de nom complet ni téléphone).
 */
public final class N8nDtos {

    private N8nDtos() {}

    /** Mission résumée pour le prompt de l'IA. */
    public record MissionInfo(
            Long id,
            String titre,
            String description,
            String domaine,
            String association,
            String dateDebut,       // déjà formatée en français : « Samedi 2 novembre 2026 à 09h00 »
            String dateFin,
            String adresse,
            String ville,
            List<String> competences,
            int placesRestantes,
            String lien
    ) {}

    /** F29 : une inscription confirmée à rappeler. */
    public record Rappel(
            Long inscriptionId,
            String email,
            String prenom,
            MissionInfo mission
    ) {}

    /** Bénévole proche sollicité pendant un renfort urgent. */
    public record BenevoleProche(
            Long id,
            String email,
            String prenom,
            String ville,
            Double distanceKm,          // null si les coordonnées sont inconnues (même ville)
            boolean domaineCorrespond,
            List<String> competencesUtiles
    ) {}

    /** Renfort urgent : mission + bénévoles à contacter. */
    public record Renfort(
            MissionInfo mission,
            List<BenevoleProche> benevoles
    ) {}

    /** Mission recommandée dans le résumé hebdomadaire, avec le détail du score (formule F47). */
    public record Recommandation(
            MissionInfo mission,
            int score,
            Double distanceKm,
            boolean domaineCorrespond,
            boolean dejaParticipeAssociationOuDomaine,
            int pourcentagePlacesLibres
    ) {}

    /** Résumé hebdomadaire d'un bénévole. */
    public record Digest(
            Long benevoleId,
            String email,
            String prenom,
            String ville,
            List<String> centresInteret,
            List<Recommandation> missions
    ) {}
}

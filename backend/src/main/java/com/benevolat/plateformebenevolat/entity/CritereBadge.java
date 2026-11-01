package com.benevolat.plateformebenevolat.entity;

/**
 * Condition d'obtention d'un badge ; {@code Badge.valeurCritere} donne le seuil à atteindre.
 * Seules les missions avec un certificat délivré sont prises en compte.
 */
public enum CritereBadge {
    NIVEAU,              // niveau atteint (= nombre de certificats)
    RENFORT,             // missions réalisées en réponse à un renfort urgent
    MEME_ASSOCIATION,    // missions réalisées avec une même association
    DOMAINES_DIFFERENTS, // domaines différents couverts
    MEME_DOMAINE,        // missions réalisées dans un même domaine
    MOIS_CONSECUTIFS     // mois consécutifs avec au moins une mission
}

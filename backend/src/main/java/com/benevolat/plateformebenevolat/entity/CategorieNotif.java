package com.benevolat.plateformebenevolat.entity;

/**
 * Événement à l'origine d'une notification (F28, F31).
 * Sert au filtrage des préférences e-mail et à l'icône affichée côté frontend.
 */
public enum CategorieNotif {
    INSCRIPTION,        // inscription confirmée (bénévole) / nouvel inscrit (association)
    LISTE_ATTENTE,      // mise en liste d'attente
    PROMOTION,          // passage de la liste d'attente à une place confirmée (F17)
    ANNULATION,         // désistement d'un bénévole
    MISSION_MODIFIEE,   // changement de date ou de lieu (F08)
    MISSION_ANNULEE,    // annulation d'une mission (F10, RM10)
    RENFORT,            // renfort urgent demandé / comblé (F42-F45)
    RAPPEL,             // rappel 24 h avant la mission (F29)
    CERTIFICAT,         // certificat délivré
    VALIDATION,         // association validée / refusée (F39)
    COMPTE,             // compte suspendu / réactivé (F40)
    MODERATION,         // mission signalée / masquée / rétablie (F41)
    GAMIFICATION,       // niveau atteint / badge débloqué
    SYSTEME
}

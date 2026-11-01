package com.benevolat.plateformebenevolat.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** DTOs de l'espace administrateur (F34, F39, F40, F41). */
public final class AdminDtos {

    private AdminDtos() {}

    /** Libellé + valeur, pour les graphiques. */
    public record Serie(String label, long valeur) {}

    /** Tableau de bord administrateur (F34). */
    public record Stats(
            long benevoles,
            long associations,
            long associationsEnAttente,
            long comptesSuspendus,
            long missions,
            long missionsActives,
            long missionsSignalees,
            long inscriptions,
            long inscriptionsConfirmees,
            long inscriptionsEnAttente,
            long certificats,
            Map<String, Long> missionsParStatut,
            List<Serie> missionsParVille,
            List<Serie> missionsParDomaine,
            List<Serie> benevolesParVille,
            List<Serie> inscriptionsParMois,
            List<Serie> nouveauxUtilisateursParMois
    ) {}

    /** Association vue par l'administrateur (validation F39). */
    public record AssociationAdmin(
            Long id,
            String nom,
            String email,
            String ville,
            String contact,
            String description,
            String logoUrl,
            List<String> domaines,
            String statutValidation,
            String motifRefus,
            String statutCompte,
            long nbMissions,
            LocalDateTime createdAt
    ) {}

    /** Utilisateur vu par l'administrateur (gestion des comptes F40). */
    public record UtilisateurAdmin(
            Long id,
            String email,
            String role,
            String nom,
            String ville,
            String photoUrl,
            String statut,
            String statutValidation,
            LocalDateTime createdAt,
            /** Niveau et bannière (bénévoles uniquement, sinon null). */
            GamificationDto.Resume gamification
    ) {}

    /** Mission vue par l'administrateur (modération F41). */
    public record MissionAdmin(
            Long id,
            String titre,
            String description,
            String associationNom,
            Long associationId,
            String ville,
            String domaine,
            String statut,
            boolean estSignalee,
            String motifSignalement,
            boolean estMasquee,
            LocalDateTime dateDebut,
            LocalDateTime dateFin,
            long nbInscrits,
            LocalDateTime createdAt
    ) {}
}

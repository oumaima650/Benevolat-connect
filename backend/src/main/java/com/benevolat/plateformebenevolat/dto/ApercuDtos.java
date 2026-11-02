package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.StatutMission;

import java.time.LocalDateTime;
import java.util.List;

/** Aperçus en lecture : mission vue par un inscrit, profil public d'une association. */
public final class ApercuDtos {

    private ApercuDtos() {}

    /**
     * Aperçu d'une mission depuis « Mes inscriptions » : photos publiées par l'association
     * et photos de participation du bénévole (ajout réservé aux missions certifiées).
     */
    public record ApercuMission(
            Long inscriptionId,
            String statutInscription,
            Long missionId,
            String titre,
            String description,
            String domaine,
            StatutMission statut,
            LocalDateTime dateDebut,
            LocalDateTime dateFin,
            String adresse,
            String ville,
            List<String> competences,
            Long associationId,
            String associationNom,
            String associationPhoto,
            List<ImageEvenementDto> photosAssociation,
            List<ImageEvenementDto> mesPhotos,
            boolean certifiee
    ) {}

    /** Profil public d'une association validée, avec ses missions et leurs photos d'événement. */
    public record AssociationPublique(
            Long id,
            String nom,
            String description,
            String ville,
            String contact,
            String email,
            String photoProfil,
            List<String> domaines,
            Double latitude,
            Double longitude,
            List<MissionPublique> missions
    ) {}

    public record MissionPublique(
            Long id,
            String titre,
            String description,
            String domaine,
            StatutMission statut,
            LocalDateTime dateDebut,
            LocalDateTime dateFin,
            String adresse,
            int placesRestantes,
            List<ImageEvenementDto> photos
    ) {}
}

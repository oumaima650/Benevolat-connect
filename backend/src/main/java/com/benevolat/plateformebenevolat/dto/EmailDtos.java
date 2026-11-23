package com.benevolat.plateformebenevolat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

/** DTO de la fenêtre d'envoi d'emails (admin et association). */
public class EmailDtos {

    /** Un destinataire sélectionnable (bénévole ou association). */
    public record Destinataire(Long id, String nom, String email) {}

    public record EnvoiRequest(
            @NotEmpty(message = "Sélectionnez au moins un destinataire.") List<Long> destinataireIds,
            @NotBlank(message = "L'objet est obligatoire.") @Size(max = 200) String sujet,
            @NotBlank(message = "Le message est obligatoire.") @Size(max = 5000) String message
    ) {}

    /** Résultat d'un envoi en masse. */
    public record EnvoiResultat(int envoyes, int echecs, List<String> erreurs) {}

    /** Demande de rédaction assistée par IA. */
    public record RedactionRequest(
            @NotBlank(message = "Décrivez l'email que vous souhaitez.") @Size(max = 500) String consigne
    ) {}

    public record RedactionResponse(String sujet, String contenu, boolean fallback) {}
}

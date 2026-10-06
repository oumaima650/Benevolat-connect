package com.benevolat.plateformebenevolat.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de demande de réinitialisation de mot de passe.
 */
@Data
public class ForgotPasswordRequest {

    @NotBlank(message = "L'adresse email est obligatoire")
    @Email(message = "L'adresse email est invalide")
    private String email;
}

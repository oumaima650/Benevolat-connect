package com.benevolat.plateformebenevolat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Requête pour réinitialiser le mot de passe via un token.
 */
@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Le jeton est obligatoire")
    private String token;

    @NotBlank(message = "Le nouveau mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String newPassword;
}

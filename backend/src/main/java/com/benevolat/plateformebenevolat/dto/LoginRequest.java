package com.benevolat.plateformebenevolat.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de connexion.
 */
@Data
public class LoginRequest {

    @NotBlank(message = "L'adresse email est obligatoire")
    @Email(message = "L'adresse email est invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;
}

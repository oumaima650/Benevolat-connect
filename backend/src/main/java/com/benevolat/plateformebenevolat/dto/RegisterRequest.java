package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Requête d'inscription d'un nouvel utilisateur (Bénévole ou Association).
 * Contient l'ensemble des champs requis par le MCD et le Diagramme de classe,
 * y compris la géolocalisation.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "L'adresse email est obligatoire")
    @Email(message = "L'adresse email est invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String password;

    private Role role = Role.BENEVOLE;

    /** Jeton reCAPTCHA transmis par le frontend. */
    private String recaptchaToken;

    // --- Géolocalisation ---
    private Double latitude;
    private Double longitude;

    // --- Champs spécifiques Bénévole ---
    private String nom;
    private String prenom;
    private String dateNaissance; // au format YYYY-MM-DD
    private String adresse;
    private String ville;
    private String biographie;
    private String photoUrl;
    private Double rayonDeplacementKm;
    private List<String> competences;
    private List<String> centresInteret;

    // --- Champs spécifiques Association ---
    private String nomAssociation;
    private String description;
    private String domaine;
    private String telephone; // Mappé sur contact
    private String logoUrl;
}

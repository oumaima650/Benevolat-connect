package com.benevolat.plateformebenevolat.dto;

import com.benevolat.plateformebenevolat.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Réponse renvoyée après authentification ou inscription réussie.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {

    private boolean success;
    private String message;
    private String token;
    private UserDto user;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserDto {
        private Long id;
        private String email;
        private String nom;
        private String prenom;
        private String ville;
        private String telephone;
        private Role role;
        private String statut;
    }
}

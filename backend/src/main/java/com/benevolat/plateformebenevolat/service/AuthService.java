package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.AuthResponse;
import com.benevolat.plateformebenevolat.dto.LoginRequest;
import com.benevolat.plateformebenevolat.dto.RegisterRequest;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
import com.benevolat.plateformebenevolat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Service gérant l'inscription et la connexion selon la hiérarchie Utilisateur (Bénévole / Association).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final BenevoleRepository benevoleRepository;
    private final AssociationRepository associationRepository;
    private final PasswordEncoder passwordEncoder;
    private final RecaptchaService recaptchaService;

    /**
     * Inscription d'un nouvel Utilisateur (Instancie un Benevole ou une Association avec géolocalisation).
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Validation reCAPTCHA
        if (request.getRecaptchaToken() != null && !recaptchaService.verifyRecaptcha(request.getRecaptchaToken())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Échec de la vérification reCAPTCHA.")
                    .build();
        }

        // 2. Vérification unicité de l'email
        String emailClean = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(emailClean)) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Un compte existe déjà avec cette adresse email.")
                    .build();
        }

        Utilisateur savedUser;
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 3. Polymorphisme d'inscription selon le rôle
        if (Role.ASSOCIATION.equals(request.getRole())) {
            Association asso = new Association();
            asso.setEmail(emailClean);
            asso.setMotDePasseHash(encodedPassword);
            asso.setNomAssociation(request.getNomAssociation() != null ? request.getNomAssociation() : request.getNom());
            asso.setDescription(request.getDescription());
            asso.setDomaine(request.getDomaine());
            asso.setVille(request.getVille());
            asso.setContact(request.getTelephone());
            asso.setLogoUrl(request.getLogoUrl());
            asso.setLatitude(request.getLatitude());
            asso.setLongitude(request.getLongitude());
            asso.setStatut(StatutUtilisateur.ACTIF);
            savedUser = associationRepository.save(asso);
        } else {
            Benevole benevole = new Benevole();
            benevole.setEmail(emailClean);
            benevole.setMotDePasseHash(encodedPassword);
            benevole.setNom(request.getNom());
            benevole.setPrenom(request.getPrenom());
            if (request.getDateNaissance() != null && !request.getDateNaissance().isBlank()) {
                try {
                    benevole.setDateNaissance(LocalDate.parse(request.getDateNaissance()));
                } catch (Exception e) {
                    log.warn("Format de date de naissance invalide : {}", request.getDateNaissance());
                }
            }
            benevole.setAdresse(request.getAdresse());
            benevole.setVille(request.getVille());
            benevole.setBiographie(request.getBiographie());
            benevole.setPhotoUrl(request.getPhotoUrl());
            if (request.getRayonDeplacementKm() != null) {
                benevole.setRayonDeplacementKm(request.getRayonDeplacementKm());
            } else {
                benevole.setRayonDeplacementKm(20.0);
            }
            benevole.setLatitude(request.getLatitude());
            benevole.setLongitude(request.getLongitude());
            if (request.getCompetences() != null) {
                benevole.getCompetences().addAll(request.getCompetences());
            }
            if (request.getCentresInteret() != null) {
                benevole.getCentresInteret().addAll(request.getCentresInteret());
            }
            benevole.setStatut(StatutUtilisateur.ACTIF);
            savedUser = benevoleRepository.save(benevole);
        }

        log.info("Nouvel utilisateur inscrit [{}] avec coordonnées GPS ({}, {}) : {}",
                request.getRole(), request.getLatitude(), request.getLongitude(), savedUser.getEmail());

        String token = UUID.randomUUID().toString();
        savedUser.setToken(token);
        userRepository.save(savedUser);

        return AuthResponse.builder()
                .success(true)
                .message("Inscription réussie !")
                .token(token)
                .user(mapToUserDto(savedUser, request.getRole()))
                .build();
    }

    /**
     * Connexion d'un utilisateur existant.
     */
    public AuthResponse login(LoginRequest request) {
        String emailClean = request.getEmail().toLowerCase().trim();
        Utilisateur user = userRepository.findByEmail(emailClean).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getMotDePasseHash())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Adresse email ou mot de passe incorrect.")
                    .build();
        }

        if (StatutUtilisateur.DESACTIVE.equals(user.getStatut()) || StatutUtilisateur.SUSPENDUE.equals(user.getStatut())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Ce compte est " + user.getStatut().name().toLowerCase() + ".")
                    .build();
        }

        String token = UUID.randomUUID().toString();
        user.setToken(token);
        userRepository.save(user);

        Role userRole = Role.BENEVOLE;
        if (user instanceof Association) {
            userRole = Role.ASSOCIATION;
        } else if (user instanceof Administrateur) {
            userRole = Role.ADMIN;
        }

        log.info("Utilisateur connecté : {}", emailClean);

        return AuthResponse.builder()
                .success(true)
                .message("Connexion réussie !")
                .token(token)
                .user(mapToUserDto(user, userRole))
                .build();
    }

    private AuthResponse.UserDto mapToUserDto(Utilisateur user, Role role) {
        String nomDisplay = "";
        String prenomDisplay = "";
        String villeDisplay = "";
        String telDisplay = "";

        if (user instanceof Benevole b) {
            nomDisplay = b.getNom();
            prenomDisplay = b.getPrenom();
            villeDisplay = b.getVille();
        } else if (user instanceof Association a) {
            nomDisplay = a.getNomAssociation();
            villeDisplay = a.getVille();
            telDisplay = a.getContact();
        }

        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(nomDisplay)
                .prenom(prenomDisplay)
                .ville(villeDisplay)
                .telephone(telDisplay)
                .role(role)
                .statut(user.getStatut() != null ? user.getStatut().name() : "ACTIF")
                .build();
    }
}

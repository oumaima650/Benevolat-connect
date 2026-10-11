package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.dto.AuthResponse;
import com.benevolat.plateformebenevolat.dto.LoginRequest;
import com.benevolat.plateformebenevolat.dto.RegisterRequest;
import com.benevolat.plateformebenevolat.entity.*;
import com.benevolat.plateformebenevolat.repository.AssociationRepository;
import com.benevolat.plateformebenevolat.repository.BenevoleRepository;
import com.benevolat.plateformebenevolat.repository.CompetenceRepository;
import com.benevolat.plateformebenevolat.repository.DomaineRepository;
import com.benevolat.plateformebenevolat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Service d'authentification avec support JWT.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final BenevoleRepository benevoleRepository;
    private final AssociationRepository associationRepository;
    private final DomaineRepository domaineRepository;
    private final CompetenceRepository competenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final RecaptchaService recaptchaService;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getRecaptchaToken() != null && !recaptchaService.verifyRecaptcha(request.getRecaptchaToken())) {
            return AuthResponse.builder().success(false).message("Échec de la vérification reCAPTCHA.").build();
        }

        String emailClean = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(emailClean)) {
            return AuthResponse.builder().success(false).message("Un compte existe déjà avec cette adresse email.").build();
        }

        // Résolution des Domaines sélectionnés (partagés entre Bénévole et Association)
        List<Domaine> domainesToLink = new ArrayList<>();
        if (request.getDomaineIds() != null && !request.getDomaineIds().isEmpty()) {
            domainesToLink = domaineRepository.findAllById(request.getDomaineIds());
        }

        Utilisateur savedUser;
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        if (Role.ASSOCIATION.equals(request.getRole())) {
            Association asso = new Association();
            asso.setEmail(emailClean);
            asso.setMotDePasseHash(encodedPassword);
            asso.setNomAssociation(request.getNomAssociation() != null ? request.getNomAssociation() : request.getNom());
            asso.setDescription(request.getDescription());
            asso.setVille(request.getVille());
            asso.setContact(request.getContact() != null ? request.getContact() : request.getTelephone());
            asso.setLogoUrl(request.getLogoUrl());
            asso.setLatitude(request.getLatitude());
            asso.setLongitude(request.getLongitude());
            asso.setStatut(StatutUtilisateur.ACTIF);
            asso.getDomaines().addAll(domainesToLink);
            savedUser = associationRepository.save(asso);
        } else {
            Benevole benevole = new Benevole();
            benevole.setEmail(emailClean);
            benevole.setMotDePasseHash(encodedPassword);
            benevole.setNom(request.getNom());
            benevole.setPrenom(request.getPrenom());
            benevole.setTelephone(request.getTelephone());
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
            benevole.setRayonDeplacementKm(request.getRayonDeplacementKm() != null ? request.getRayonDeplacementKm() : 20.0);
            benevole.setLatitude(request.getLatitude());
            benevole.setLongitude(request.getLongitude());
            if (request.getCompetences() != null && !request.getCompetences().isEmpty()) {
                for (String compStr : request.getCompetences()) {
                    competenceRepository.findByNomIgnoreCase(compStr).ifPresent(benevole.getCompetences()::add);
                }
            }
            benevole.getDomaines().addAll(domainesToLink);
            benevole.setStatut(StatutUtilisateur.ACTIF);
            savedUser = benevoleRepository.save(benevole);
        }

        log.info("Nouvel utilisateur inscrit [{}] : {}", request.getRole(), savedUser.getEmail());

        String jwtToken = jwtService.generateToken(savedUser.getEmail(), savedUser.getId(), request.getRole().name());

        return AuthResponse.builder()
                .success(true)
                .message("Inscription réussie !")
                .token(jwtToken)
                .user(mapToUserDto(savedUser, request.getRole()))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String emailClean = request.getEmail().toLowerCase().trim();
        Utilisateur user = userRepository.findByEmail(emailClean).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getMotDePasseHash())) {
            return AuthResponse.builder().success(false).message("Adresse email ou mot de passe incorrect.").build();
        }

        if (StatutUtilisateur.DESACTIVE.equals(user.getStatut()) || StatutUtilisateur.SUSPENDUE.equals(user.getStatut())) {
            return AuthResponse.builder().success(false).message("Ce compte est " + user.getStatut().name().toLowerCase() + ".").build();
        }

        Role userRole = Role.BENEVOLE;
        if (user instanceof Association) userRole = Role.ASSOCIATION;
        else if (user instanceof Administrateur) userRole = Role.ADMIN;

        String jwtToken = jwtService.generateToken(user.getEmail(), user.getId(), userRole.name());

        log.info("Utilisateur connecté : {}", emailClean);

        return AuthResponse.builder()
                .success(true)
                .message("Connexion réussie !")
                .token(jwtToken)
                .user(mapToUserDto(user, userRole))
                .build();
    }

    private AuthResponse.UserDto mapToUserDto(Utilisateur user, Role role) {
        String nom = "", prenom = "", ville = "", tel = "", photoProfil = "", nomAssociation = "";

        if (user instanceof Benevole b) {
            nom    = b.getNom() != null ? b.getNom() : "";
            prenom = b.getPrenom() != null ? b.getPrenom() : "";
            ville  = b.getVille() != null ? b.getVille() : "";
            tel    = b.getTelephone() != null ? b.getTelephone() : "";
            // Photo de profil bénévole : d'abord photoUrl (table benevoles), puis photoProfil (table Utilisateur)
            photoProfil = (b.getPhotoUrl() != null && !b.getPhotoUrl().isBlank())
                    ? b.getPhotoUrl()
                    : (user.getPhotoProfil() != null ? user.getPhotoProfil() : "");
        } else if (user instanceof Association a) {
            nom           = a.getNomAssociation() != null ? a.getNomAssociation() : "";
            nomAssociation = nom;
            ville          = a.getVille() != null ? a.getVille() : "";
            tel            = a.getContact() != null ? a.getContact() : "";
            // Logo association : logoUrl (table Association), puis photoProfil (table Utilisateur)
            photoProfil = (a.getLogoUrl() != null && !a.getLogoUrl().isBlank())
                    ? a.getLogoUrl()
                    : (user.getPhotoProfil() != null ? user.getPhotoProfil() : "");
        }

        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nom(nom).prenom(prenom).ville(ville).telephone(tel)
                .role(role)
                .statut(user.getStatut() != null ? user.getStatut().name() : "ACTIF")
                .photoProfil(photoProfil)
                .nomAssociation(nomAssociation)
                .build();
    }
}

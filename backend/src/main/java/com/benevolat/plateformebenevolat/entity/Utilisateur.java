package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité Utilisateur (abstraite) mappée sur la table 'Utilisateur'.
 * Les sous-classes Benevole, Association et Administrateur partagent sa clé (JOINED).
 */
@Entity
@Table(name = "Utilisateur")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@NoArgsConstructor
public abstract class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idUtilisateur")
    private Long idUtilisateur;

    public Long getId() {
        return idUtilisateur;
    }

    public void setId(Long id) {
        this.idUtilisateur = id;
    }

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "motDePasse", nullable = false, length = 255)
    private String motDePasse;

    public String getMotDePasseHash() {
        return motDePasse;
    }

    public void setMotDePasseHash(String hash) {
        this.motDePasse = hash;
    }

    @Column(name = "photoProfil", length = 500)
    private String photoProfil;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    private StatutUtilisateur statut = StatutUtilisateur.ACTIF;

    @Column(name = "notifEstActive", nullable = false)
    private Boolean notifEstActive = true;

    @Column(name = "createdAt", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updatedAt", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    protected Utilisateur(String email, String motDePasse, String photoProfil) {
        this.email = email;
        this.motDePasse = motDePasse;
        this.photoProfil = photoProfil;
    }

    /** Rôle déduit du type de l'utilisateur (non persisté). */
    public abstract Role getRole();
}

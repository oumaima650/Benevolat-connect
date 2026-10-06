package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité Utilisateur mappée sur la table 'Utilisateur' de la base de données.
 */
@Entity
@Table(name = "Utilisateur")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Utilisateur {

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

    @Column(name = "Active", nullable = false)
    private String Active = "actif";

    @Enumerated(EnumType.STRING)
    @Transient
    private StatutUtilisateur statut = StatutUtilisateur.ACTIF;

    public StatutUtilisateur getStatut() {
        if ("desactif".equalsIgnoreCase(Active)) return StatutUtilisateur.DESACTIVE;
        if ("suspendu".equalsIgnoreCase(Active)) return StatutUtilisateur.SUSPENDUE;
        return StatutUtilisateur.ACTIF;
    }

    public void setStatut(StatutUtilisateur s) {
        this.statut = s;
        if (s == StatutUtilisateur.DESACTIVE) this.Active = "desactif";
        else if (s == StatutUtilisateur.SUSPENDUE) this.Active = "suspendu";
        else this.Active = "actif";
    }

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

    public Utilisateur(String email, String motDePasse, String photoProfil) {
        this.email = email;
        this.motDePasse = motDePasse;
        this.photoProfil = photoProfil;
    }
}

package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "utilisateurs")
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

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    private String motDePasseHash;

    private String token;

    @Column(length = 500)
    private String photoProfil;

    @Column(nullable = false)
    private String Active = "actif";

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    private StatutUtilisateur statut = StatutUtilisateur.ACTIF;

    @Column(nullable = false)
    private Boolean notifEstActive = true;

    private boolean notifActivite = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
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


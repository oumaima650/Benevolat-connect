package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité Bénévole héritant d'Utilisateur (table 'Benevole').
 */
@Entity
@Table(name = "Benevole")
@PrimaryKeyJoinColumn(name = "idBenevole")
@Getter
@Setter
@NoArgsConstructor
public class Benevole extends Utilisateur {

    @Column(name = "nom", length = 100)
    private String nom;

    @Column(name = "prenom", length = 100)
    private String prenom;

    @Column(name = "telephone", length = 20)
    private String telephone;

    @Column(name = "dateNaissance")
    private LocalDate dateNaissance;

    @Column(name = "ville", length = 100)
    private String ville;

    @Column(name = "biographie", columnDefinition = "TEXT")
    private String biographie;

    @Column(name = "rayonDeplacementKm")
    private Double rayonDeplacementKm;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    /** Niveau courant (association « obtient » Benevole-Niveau). À affecter à l'inscription (Débutant). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idNiveau")
    private Niveau niveau;

    /** Centres d'intérêt (association « s'intéresse »). */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "BenevoleDomaine",
        joinColumns = @JoinColumn(name = "idBenevole"),
        inverseJoinColumns = @JoinColumn(name = "idDomaine")
    )
    private List<Domaine> domaines = new ArrayList<>();

    /** Compétences maîtrisées (association « maîtrise »). */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "BenevoleCompetence",
        joinColumns = @JoinColumn(name = "idBenevole"),
        inverseJoinColumns = @JoinColumn(name = "idCompetence")
    )
    private List<Competence> competences = new ArrayList<>();

    public String getPhotoUrl() {
        return getPhotoProfil();
    }

    public void setPhotoUrl(String photoUrl) {
        setPhotoProfil(photoUrl);
    }

    public String getAdresse() {
        return ville;
    }

    public void setAdresse(String adresse) {
        if (this.ville == null) {
            this.ville = adresse;
        }
    }

    public Benevole(String email, String motDePasse, String photoProfil) {
        super(email, motDePasse, photoProfil);
    }

    @Override
    public Role getRole() {
        return Role.BENEVOLE;
    }
}

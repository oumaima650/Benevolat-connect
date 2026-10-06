package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "associations")
@PrimaryKeyJoinColumn(name = "idAssociation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Association extends Utilisateur {

    @Column(nullable = false, length = 150)
    private String nom;

    private String nomAssociation;

    @Column(columnDefinition = "TEXT", length = 1500)
    private String description;

    @Column(length = 100)
    private String domaine;

    @Column(length = 100)
    private String ville;

    private String contact;

    private String logoUrl;

    @Column(nullable = false)
    private Boolean estvalidee = false;

    private boolean valideeParAdmin = false;

    private Double latitude;

    private Double longitude;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "association_domaines",
        joinColumns = @JoinColumn(name = "association_id"),
        inverseJoinColumns = @JoinColumn(name = "domaine_id")
    )
    private List<Domaine> domaines = new ArrayList<>();

    public Association(String email, String motDePasse, String photoProfil, String nom, String description, String domaine, String ville, String contact) {
        super(email, motDePasse, photoProfil);
        this.nom = nom;
        this.nomAssociation = nom;
        this.description = description;
        this.domaine = domaine;
        this.ville = ville;
        this.contact = contact;
    }

    public String getNom() {
        return nom != null ? nom : nomAssociation;
    }

    public void setNom(String nom) {
        this.nom = nom;
        this.nomAssociation = nom;
    }

    public String getNomAssociation() {
        return nomAssociation != null ? nomAssociation : nom;
    }

    public void setNomAssociation(String nomAssociation) {
        this.nomAssociation = nomAssociation;
        this.nom = nomAssociation;
    }
}


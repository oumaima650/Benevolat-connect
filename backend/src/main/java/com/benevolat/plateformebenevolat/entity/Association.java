package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entité Association mappée sur la table 'Association' de la base de données.
 */
@Entity
@Table(name = "Association")
@PrimaryKeyJoinColumn(name = "idAssociation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Association extends Utilisateur {

    @Column(name = "nom", nullable = false, length = 150)
    private String nom;

    public String getNomAssociation() {
        return nom;
    }

    public void setNomAssociation(String nomAssociation) {
        this.nom = nomAssociation;
    }

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "domaine", length = 100)
    private String domaine;

    @Column(name = "ville", length = 100)
    private String ville;

    @Column(name = "contact", length = 255)
    private String contact;

    @Column(name = "logoUrl")
    private String logoUrl;

    @Column(name = "estvalidee", nullable = false)
    private Boolean estvalidee = false;

    public boolean isValideeParAdmin() {
        return Boolean.TRUE.equals(estvalidee);
    }

    public void setValideeParAdmin(boolean validee) {
        this.estvalidee = validee;
    }

    @Transient
    private Double latitude;

    @Transient
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
        this.description = description;
        this.domaine = domaine;
        this.ville = ville;
        this.contact = contact;
    }
}

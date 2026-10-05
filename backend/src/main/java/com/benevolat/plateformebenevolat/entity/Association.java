package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "Association")
@PrimaryKeyJoinColumn(name = "idAssociation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Association extends Utilisateur {

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String domaine;

    @Column(length = 100)
    private String ville;

    private String contact;

    @Column(nullable = false)
    private Boolean estvalidee = false;

    public Association(String email, String motDePasse, String photoProfil, String nom, String description, String domaine, String ville, String contact) {
        super(email, motDePasse, photoProfil);
        this.nom = nom;
        this.description = description;
        this.domaine = domaine;
        this.ville = ville;
        this.contact = contact;
    }
}

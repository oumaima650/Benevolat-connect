package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entité Domaine mappée sur la table 'Domaine'.
 */
@Entity
@Table(name = "Domaine")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Domaine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idDomaine")
    private Long idDomaine;

    @Column(name = "nom", nullable = false, unique = true, length = 100)
    private String nom;

    @Column(name = "categorie", length = 100)
    private String categorie;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    public Domaine(String nom) {
        this.nom = nom;
    }

    public Domaine(String nom, String categorie, String description) {
        this.nom = nom;
        this.categorie = categorie;
        this.description = description;
    }

    public Long getId() {
        return idDomaine;
    }

    public void setId(Long id) {
        this.idDomaine = id;
    }
}

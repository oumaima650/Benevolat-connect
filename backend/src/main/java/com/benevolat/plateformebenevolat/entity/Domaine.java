package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entité partagée représentant un Domaine d'activité / Centre d'Intérêt.
 * Commune aux Bénévoles (intérêts) et aux Associations (secteurs d'activité).
 * Exemples : Écologie, Enfance & Jeunesse, Santé & Handicap...
 */
@Entity
@Table(name = "domaines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Domaine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String nom;

    private String categorie;

    private String description;

    public Domaine(String nom, String categorie, String description) {
        this.nom = nom;
        this.categorie = categorie;
        this.description = description;
    }
}

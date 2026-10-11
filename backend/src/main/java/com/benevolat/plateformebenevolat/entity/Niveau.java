package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Niveau de gamification (Débutant, Engagé, Expert, Champion). Table prédéfinie.
 */
@Entity
@Table(name = "Niveau")
@Getter
@Setter
@NoArgsConstructor
public class Niveau {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idNiveau")
    private Long idNiveau;

    @Column(name = "nom", nullable = false, unique = true, length = 50)
    private String nom;

    public Niveau(String nom) {
        this.nom = nom;
    }
}

package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "associations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Association {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    private String rnaSiret;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String ville;
    private String domaine;

    public Association(String nom, String rnaSiret, String description, String ville, String domaine) {
        this.nom = nom;
        this.rnaSiret = rnaSiret;
        this.description = description;
        this.ville = ville;
        this.domaine = domaine;
    }
}

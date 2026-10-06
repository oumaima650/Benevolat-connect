package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "domaines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Domaine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idDomaine")
    private Long idDomaine;

    @Column(nullable = false, length = 100)
    private String nom;

    private String categorie;

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


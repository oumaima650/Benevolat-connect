package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Column(nullable = false, length = 100)
    private String nom;

    public Domaine(String nom) {
        this.nom = nom;
    }
}

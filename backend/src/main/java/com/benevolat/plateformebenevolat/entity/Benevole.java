package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité Bénévole héritant d'Utilisateur selon le diagramme de classe.
 */
@Entity
@Table(name = "benevoles")
@PrimaryKeyJoinColumn(name = "utilisateur_id")
@Getter
@Setter
@NoArgsConstructor
public class Benevole extends Utilisateur {

    private String nom;
    private String prenom;
    private LocalDate dateNaissance;
    private String adresse;
    private String ville;

    @Column(length = 1000)
    private String biographie;

    private String photoUrl;
    private double rayonDeplacementKm;

    private Double latitude;
    private Double longitude;

    @ElementCollection
    @CollectionTable(name = "benevole_competences", joinColumns = @JoinColumn(name = "benevole_id"))
    @Column(name = "competence")
    private List<String> competences = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "benevole_centres_interet", joinColumns = @JoinColumn(name = "benevole_id"))
    @Column(name = "centre_interet")
    private List<String> centresInteret = new ArrayList<>();
}

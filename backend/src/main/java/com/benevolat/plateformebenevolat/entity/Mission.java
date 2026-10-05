package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "missions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String domaine;
    private String ville;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    private Integer nbBenevoles;

    @Enumerated(EnumType.STRING)
    private StatutMission statut = StatutMission.DISPONIBLE;

    private String badge;
    private String imageUrl;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "association_id")
    private Association association;

    public Mission(String titre, String description, String domaine, String ville,
                   LocalDate dateDebut, LocalDate dateFin, Integer nbBenevoles,
                   StatutMission statut, String badge, String imageUrl, Association association) {
        this.titre = titre;
        this.description = description;
        this.domaine = domaine;
        this.ville = ville;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
        this.nbBenevoles = nbBenevoles;
        this.statut = statut;
        this.badge = badge;
        this.imageUrl = imageUrl;
        this.association = association;
    }
}

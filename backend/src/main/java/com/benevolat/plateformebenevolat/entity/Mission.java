package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Mission")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idMission")
    private Long idMission;

    @Column(nullable = false, length = 150)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String adresse;

    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(nullable = false)
    private LocalDateTime dateDebut;

    @Column(nullable = false)
    private LocalDateTime dateFin;

    @Column(nullable = false)
    private Integer nbPlaces = 0;

    @Column(nullable = false)
    private Integer nbPlacesListeAttente = 0;

    @Column(nullable = false)
    private Integer nbRenfortDemande = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutMission statut = StatutMission.BROUILLON;

    @Column(nullable = false)
    private Boolean estSignalee = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idAssociation", nullable = false)
    private Association association;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idDomaine", nullable = false)
    private Domaine domaine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idImage", nullable = false)
    private ImageEvenement imageEvenement;

    public Mission(String titre, String description, String adresse, BigDecimal latitude, BigDecimal longitude,
                   LocalDateTime dateDebut, LocalDateTime dateFin, Integer nbPlaces, StatutMission statut,
                   Association association, Domaine domaine, ImageEvenement imageEvenement) {
        this.titre = titre;
        this.description = description;
        this.adresse = adresse;
        this.latitude = latitude;
        this.longitude = longitude;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
        this.nbPlaces = nbPlaces;
        this.statut = statut;
        this.association = association;
        this.domaine = domaine;
        this.imageEvenement = imageEvenement;
    }
}

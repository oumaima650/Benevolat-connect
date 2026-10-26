package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité Mission mappée sur la table 'Mission'.
 */
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

    @Column(name = "titre", nullable = false, length = 150)
    private String titre;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "adresse", length = 255)
    private String adresse;

    @Column(name = "latitude", precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name = "dateDebut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "dateFin", nullable = false)
    private LocalDateTime dateFin;

    @Column(name = "nbPlaces", nullable = false)
    private Integer nbPlaces = 0;

    @Column(name = "nbPlacesListeAttente", nullable = false)
    private Integer nbPlacesListeAttente = 0;

    @Column(name = "nbRenfortDemande", nullable = false)
    private Integer nbRenfortDemande = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    private StatutMission statut = StatutMission.BROUILLON;

    @Column(name = "estSignalee", nullable = false)
    private Boolean estSignalee = false;

    /** Motif du dernier signalement (F41). */
    @Column(name = "motifSignalement", length = 500)
    private String motifSignalement;

    /** Masquée par un administrateur : invisible du public (F41). */
    @Column(name = "estMasquee", nullable = false)
    private Boolean estMasquee = false;

    @Column(name = "createdAt", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updatedAt", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    /** Association « publie ». */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idAssociation", nullable = false)
    private Association association;

    /** Association « classe ». */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "idDomaine", nullable = false)
    private Domaine domaine;

    /** Compétences requises (association « requiert »). */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "MissionCompetence",
        joinColumns = @JoinColumn(name = "idMission"),
        inverseJoinColumns = @JoinColumn(name = "idCompetence")
    )
    private List<Competence> competences = new ArrayList<>();

    /** Images de l'événement (association « obtient »). */
    @OneToMany(mappedBy = "mission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImageEvenement> images = new ArrayList<>();

    public ImageEvenement getImageEvenement() {
        return (images != null && !images.isEmpty()) ? images.get(0) : null;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Mission(String titre, String description, String adresse, BigDecimal latitude, BigDecimal longitude,
                   LocalDateTime dateDebut, LocalDateTime dateFin, Integer nbPlaces, StatutMission statut,
                   Association association, Domaine domaine) {
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
    }
}

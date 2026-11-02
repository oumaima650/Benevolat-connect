package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Inscription d'un bénévole à une mission (association « s'inscrit »).
 * RM02 : un seul enregistrement par couple (bénévole, mission). Une réinscription
 * après annulation réutilise la ligne existante (nouveau statut, nouvelle dateInscription).
 */
@Entity
@Table(
    name = "Inscription",
    uniqueConstraints = @UniqueConstraint(name = "uq_inscription_benevole_mission", columnNames = {"idBenevole", "idMission"})
)
@Getter
@Setter
@NoArgsConstructor
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idInscription")
    private Long idInscription;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idBenevole", nullable = false)
    private Benevole benevole;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idMission", nullable = false)
    private Mission mission;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    private StatutInscription statut;

    /** Rang en liste d'attente (null si confirmée ou annulée). */
    @Column(name = "rang")
    private Integer rang;

    @Column(name = "dateInscription", nullable = false)
    private LocalDateTime dateInscription = LocalDateTime.now();

    /** F29 : un seul rappel par inscription. */
    @Column(name = "rappelEnvoye", nullable = false)
    private Boolean rappelEnvoye = false;

    /** Venue en réponse à un renfort urgent (badge « Renfort de choc »). */
    @Column(name = "estRenfort", nullable = false)
    private Boolean estRenfort = false;

    public Inscription(Benevole benevole, Mission mission, StatutInscription statut, Integer rang) {
        this.benevole = benevole;
        this.mission = mission;
        this.statut = statut;
        this.rang = rang;
    }
}

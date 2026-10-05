package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "inscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "benevole_id", nullable = false)
    private Benevole benevole;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    private LocalDateTime dateInscription = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    private StatutInscription statut = StatutInscription.CONFIRMEE;

    private Integer rang;

    public Inscription(Benevole benevole, Mission mission, StatutInscription statut, Integer rang) {
        this.benevole = benevole;
        this.mission = mission;
        this.statut = statut;
        this.rang = rang;
        this.dateInscription = LocalDateTime.now();
    }
}

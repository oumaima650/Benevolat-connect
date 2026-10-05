package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "certificats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Certificat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String codeVerification;

    private LocalDate dateEmission;
    private Integer nbHeures;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "benevole_id", nullable = false)
    private Benevole benevole;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    public Certificat(String codeVerification, LocalDate dateEmission, Integer nbHeures, Benevole benevole, Mission mission) {
        this.codeVerification = codeVerification;
        this.dateEmission = dateEmission;
        this.nbHeures = nbHeures;
        this.benevole = benevole;
        this.mission = mission;
    }
}

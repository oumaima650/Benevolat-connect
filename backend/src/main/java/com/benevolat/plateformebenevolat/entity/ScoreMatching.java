package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Score de pertinence d'une mission pour un bénévole (association « score »).
 * Mis en cache : recalculé uniquement si le profil ou la mission change.
 */
@Entity
@Table(
    name = "ScoreMatching",
    uniqueConstraints = @UniqueConstraint(name = "uq_score_benevole_mission", columnNames = {"idBenevole", "idMission"})
)
@Getter
@Setter
@NoArgsConstructor
public class ScoreMatching {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idScore")
    private Long idScore;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idBenevole", nullable = false)
    private Benevole benevole;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idMission", nullable = false)
    private Mission mission;

    /** Score entier de 0 à 100. */
    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "explication", columnDefinition = "TEXT")
    private String explication;

    @Enumerated(EnumType.STRING)
    @Column(name = "methode", nullable = false, length = 20)
    private MethodeScore methode;

    @Column(name = "dateCalcul", nullable = false)
    private LocalDateTime dateCalcul = LocalDateTime.now();

    public ScoreMatching(Benevole benevole, Mission mission, Integer score, String explication, MethodeScore methode) {
        this.benevole = benevole;
        this.mission = mission;
        this.score = score;
        this.explication = explication;
        this.methode = methode;
    }
}

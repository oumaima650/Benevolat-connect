package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Badge de gamification. Table prédéfinie ; chaque badge est associé à un niveau (association « associé »).
 */
@Entity
@Table(name = "Badge")
@Getter
@Setter
@NoArgsConstructor
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idBadge")
    private Long idBadge;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "nom", nullable = false, length = 100)
    private String nom;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idNiveau", nullable = false, unique = true)
    private Niveau niveau;

    public Badge(String code, String nom, Niveau niveau) {
        this.code = code;
        this.nom = nom;
        this.niveau = niveau;
    }
}

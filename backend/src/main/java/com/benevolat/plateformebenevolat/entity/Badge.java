package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Badge de gamification. Table prédéfinie : badges PALIER (tous les 5 niveaux, avec bannière)
 * et badges SPECIAL (critères d'engagement).
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

    @Column(name = "description", nullable = false, length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private TypeBadge type;

    @Enumerated(EnumType.STRING)
    @Column(name = "critere", nullable = false, length = 30)
    private CritereBadge critere;

    /** Seuil du critère : niveau à atteindre, nombre de missions, de domaines ou de mois. */
    @Column(name = "valeurCritere", nullable = false)
    private Integer valeurCritere;

    /** Thème de la bannière de profil (badges PALIER uniquement). */
    @Column(name = "theme", length = 30)
    private String theme;

    @Column(name = "ordre", nullable = false)
    private Integer ordre = 0;

    public Badge(String code, String nom, String description, TypeBadge type, CritereBadge critere,
                 Integer valeurCritere, String theme, Integer ordre) {
        this.code = code;
        this.nom = nom;
        this.description = description;
        this.type = type;
        this.critere = critere;
        this.valeurCritere = valeurCritere;
        this.theme = theme;
        this.ordre = ordre;
    }
}

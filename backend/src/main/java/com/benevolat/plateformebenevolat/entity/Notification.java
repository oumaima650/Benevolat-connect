package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Notification destinée à un utilisateur (association « recoit »).
 */
@Entity
@Table(name = "Notification")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idNotification")
    private Long idNotification;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idUtilisateur", nullable = false)
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private TypeNotif type;

    @Column(name = "titre", nullable = false, length = 200)
    private String titre;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "lue", nullable = false)
    private Boolean lue = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "statutEnvoi", nullable = false, length = 20)
    private StatutEnvoi statutEnvoi = StatutEnvoi.EN_ATTENTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "categorie", nullable = false, length = 30)
    private CategorieNotif categorie = CategorieNotif.SYSTEME;

    /** Lien relatif vers la page concernée (ex. /missions/12). */
    @Column(name = "lien", length = 255)
    private String lien;

    @Column(name = "createdAt", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification(Utilisateur utilisateur, TypeNotif type, String titre, String message) {
        this.utilisateur = utilisateur;
        this.type = type;
        this.titre = titre;
        this.message = message;
    }
}

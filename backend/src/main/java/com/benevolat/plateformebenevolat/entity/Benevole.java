package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entité JPA représentant un bénévole en base de données.
 * La table "benevoles" sera créée/mise à jour automatiquement
 * par Hibernate grâce à spring.jpa.hibernate.ddl-auto=update.
 * Lombok génère automatiquement les getters, setters et le constructeur vide.
 */
@Entity
@Table(name = "benevoles")
@Getter
@Setter
@NoArgsConstructor
public class Benevole {

    /** Identifiant unique auto-incrémenté par MySQL (stratégie IDENTITY). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nom complet du bénévole. */
    private String nom;

    /** Adresse email — servira d'identifiant de connexion. */
    private String email;

    /** Ville de résidence — utilisée pour le matching géographique (RG8). */
    private String ville;
}

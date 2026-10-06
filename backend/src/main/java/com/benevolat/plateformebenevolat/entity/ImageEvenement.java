package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entité ImageEvenement mappée sur la table 'ImageEvenement' de la base de données.
 */
@Entity
@Table(name = "ImageEvenement")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ImageEvenement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idImage")
    private Long idImage;

    @Column(name = "URL", nullable = false, length = 500)
    private String url;

    @Column(name = "titre", length = 150)
    private String titre;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    public ImageEvenement(String url, String titre, String description) {
        this.url = url;
        this.titre = titre;
        this.description = description;
    }
}

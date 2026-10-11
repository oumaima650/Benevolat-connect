package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entité ImageEvenement mappée sur la table 'ImageEvenement'.
 * Une image appartient à une seule mission ; une mission peut en avoir plusieurs.
 */
@Entity
@Table(name = "ImageEvenement")
@Getter
@Setter
@NoArgsConstructor
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

    @Column(name = "datePublication", nullable = false)
    private LocalDateTime datePublication = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idMission", nullable = false)
    private Mission mission;

    public ImageEvenement(String url, String titre, String description, Mission mission) {
        this.url = url;
        this.titre = titre;
        this.description = description;
        this.mission = mission;
    }
}

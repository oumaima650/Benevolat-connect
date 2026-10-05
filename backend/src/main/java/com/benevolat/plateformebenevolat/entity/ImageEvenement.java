package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Column(nullable = false, length = 500, name = "URL")
    private String url;

    @Column(length = 150)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    public ImageEvenement(String url, String titre, String description) {
        this.url = url;
        this.titre = titre;
        this.description = description;
    }
}

package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Image publiée par un bénévole pour illustrer sa participation (association « associe » avec Inscription).
 */
@Entity
@Table(name = "ImageParticipation")
@Getter
@Setter
@NoArgsConstructor
public class ImageParticipation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idImage")
    private Long idImage;

    @Column(name = "URL", nullable = false, length = 500)
    private String url;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "datePublication", nullable = false)
    private LocalDateTime datePublication = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idInscription", nullable = false)
    private Inscription inscription;

    public ImageParticipation(String url, String description, Inscription inscription) {
        this.url = url;
        this.description = description;
        this.inscription = inscription;
    }
}

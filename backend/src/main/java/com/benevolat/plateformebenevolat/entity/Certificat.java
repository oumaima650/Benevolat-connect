package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Certificat délivré pour une inscription (association « atteste »).
 * L'association émettrice se déduit via inscription.mission.association (pas de lien direct).
 * RM08 : un seul certificat par inscription ; RM09 : code de vérification unique.
 */
@Entity
@Table(name = "Certificat")
@Getter
@Setter
@NoArgsConstructor
public class Certificat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idCertificat")
    private Long idCertificat;

    @Column(name = "codeVerification", nullable = false, unique = true, length = 64)
    private String codeVerification;

    @Column(name = "dateDelivrance", nullable = false)
    private LocalDateTime dateDelivrance = LocalDateTime.now();

    @Column(name = "urlPdf", length = 500)
    private String urlPdf;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idInscription", nullable = false, unique = true)
    private Inscription inscription;

    public Certificat(Inscription inscription, String codeVerification, String urlPdf) {
        this.inscription = inscription;
        this.codeVerification = codeVerification;
        this.urlPdf = urlPdf;
    }
}

package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Badge obtenu par un bénévole (association « obtient » Benevole-Badge). RM11 : un seul par couple.
 */
@Entity
@Table(
    name = "Obtention",
    uniqueConstraints = @UniqueConstraint(name = "uq_obtention", columnNames = {"idBenevole", "idBadge"})
)
@Getter
@Setter
@NoArgsConstructor
public class Obtention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idObtention")
    private Long idObtention;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idBenevole", nullable = false)
    private Benevole benevole;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idBadge", nullable = false)
    private Badge badge;

    @Column(name = "dateAttribution", nullable = false)
    private LocalDateTime dateAttribution = LocalDateTime.now();

    public Obtention(Benevole benevole, Badge badge) {
        this.benevole = benevole;
        this.badge = badge;
    }
}

package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entité Association héritant d'Utilisateur selon le diagramme de classe.
 */
@Entity
@Table(name = "associations")
@PrimaryKeyJoinColumn(name = "utilisateur_id")
@Getter
@Setter
@NoArgsConstructor
public class Association extends Utilisateur {

    private String nomAssociation;

    @Column(length = 1500)
    private String description;

    private String ville;
    private String contact;
    private String logoUrl;
    private boolean valideeParAdmin = false;

    private Double latitude;
    private Double longitude;

    /** Relation ManyToMany avec la table partagée 'domaines' */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "association_domaines",
        joinColumns = @JoinColumn(name = "association_id"),
        inverseJoinColumns = @JoinColumn(name = "domaine_id")
    )
    private List<Domaine> domaines = new ArrayList<>();
}

package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * Entité Association héritant d'Utilisateur (table 'Association').
 * Le logo de l'association est la photoProfil héritée d'Utilisateur.
 */
@Entity
@Table(name = "Association")
@PrimaryKeyJoinColumn(name = "idAssociation")
@Getter
@Setter
@NoArgsConstructor
public class Association extends Utilisateur {

    @Column(name = "nom", nullable = false, length = 150)
    private String nom;

    public String getNomAssociation() {
        return nom;
    }

    public void setNomAssociation(String nomAssociation) {
        this.nom = nomAssociation;
    }

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "ville", length = 100)
    private String ville;

    @Column(name = "contact", length = 255)
    private String contact;

    /** Remplace l'ancien booléen valideeParAdmin : EN_ATTENTE / VALIDE / REFUSE (RM06). */
    @Enumerated(EnumType.STRING)
    @Column(name = "statutValidation", nullable = false, length = 20)
    private StatutValidation statutValidation = StatutValidation.EN_ATTENTE;

    /** Compatibilité : vrai uniquement si l'association est VALIDE. */
    public boolean isValideeParAdmin() {
        return statutValidation == StatutValidation.VALIDE;
    }

    public void setValideeParAdmin(boolean validee) {
        this.statutValidation = validee ? StatutValidation.VALIDE : StatutValidation.EN_ATTENTE;
    }

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    /** Administrateur qui a traité la demande (association « valide ») ; null tant qu'en attente. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idAdministrateur")
    private Administrateur administrateur;

    /** Domaines de spécialisation (association « se specialise »). */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "AssociationDomaine",
        joinColumns = @JoinColumn(name = "idAssociation"),
        inverseJoinColumns = @JoinColumn(name = "idDomaine")
    )
    private List<Domaine> domaines = new ArrayList<>();

    public String getDomaine() {
        return (domaines != null && !domaines.isEmpty()) ? domaines.get(0).getNom() : null;
    }

    public String getLogoUrl() {
        return getPhotoProfil();
    }

    public void setLogoUrl(String logoUrl) {
        setPhotoProfil(logoUrl);
    }

    public Association(String email, String motDePasse, String photoProfil, String nom, String description, String ville, String contact) {
        super(email, motDePasse, photoProfil);
        this.nom = nom;
        this.description = description;
        this.ville = ville;
        this.contact = contact;
    }

    @Override
    public Role getRole() {
        return Role.ASSOCIATION;
    }
}

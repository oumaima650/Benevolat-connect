package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entité Administrateur héritant d'Utilisateur (table 'Administrateur').
 */
@Entity
@Table(name = "Administrateur")
@PrimaryKeyJoinColumn(name = "idAdministrateur")
@Getter
@Setter
@NoArgsConstructor
public class Administrateur extends Utilisateur {

    public Administrateur(String email, String motDePasse, String photoProfil) {
        super(email, motDePasse, photoProfil);
    }

    @Override
    public Role getRole() {
        return Role.ADMIN;
    }
}

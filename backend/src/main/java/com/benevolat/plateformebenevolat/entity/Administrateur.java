package com.benevolat.plateformebenevolat.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entité Administrateur héritant d'Utilisateur selon le diagramme de classe.
 */
@Entity
@Table(name = "administrateurs")
@PrimaryKeyJoinColumn(name = "utilisateur_id")
@Getter
@Setter
@NoArgsConstructor
public class Administrateur extends Utilisateur {
}

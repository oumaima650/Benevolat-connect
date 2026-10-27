package com.benevolat.plateformebenevolat.service;

import com.benevolat.plateformebenevolat.entity.Niveau;
import com.benevolat.plateformebenevolat.repository.NiveauRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

/**
 * Calcule le niveau à partir du nombre de missions réalisées (certificats).
 * Seuils lus en base si {@code Niveau.seuilMissions} est renseigné, sinon constantes.
 */
@Component
@RequiredArgsConstructor
public class NiveauSeuils {

    public static final int DEBUTANT = 0;
    public static final int ENGAGE = 5;
    public static final int EXPERT = 15;
    public static final int CHAMPION = 30;

    private final NiveauRepository niveauRepository;

    public Resultat resolve(long missionsRealisees) {
        List<Niveau> niveaux = niveauRepository.findAll();
        boolean fromDb = niveaux.stream().anyMatch(n -> n.getSeuilMissions() != null);

        if (fromDb) {
            List<Niveau> ordered = niveaux.stream()
                    .filter(n -> n.getSeuilMissions() != null)
                    .sorted(Comparator.comparingInt(Niveau::getSeuilMissions))
                    .toList();
            Niveau current = ordered.get(0);
            Niveau next = null;
            for (int i = 0; i < ordered.size(); i++) {
                Niveau n = ordered.get(i);
                if (missionsRealisees >= n.getSeuilMissions()) {
                    current = n;
                    next = (i + 1 < ordered.size()) ? ordered.get(i + 1) : null;
                }
            }
            return new Resultat(
                    current.getNom(),
                    missionsRealisees,
                    next != null ? next.getSeuilMissions() : null,
                    next != null ? next.getNom() : null
            );
        }

        if (missionsRealisees >= CHAMPION) {
            return new Resultat("Champion", missionsRealisees, null, null);
        }
        if (missionsRealisees >= EXPERT) {
            return new Resultat("Expert", missionsRealisees, CHAMPION, "Champion");
        }
        if (missionsRealisees >= ENGAGE) {
            return new Resultat("Engagé", missionsRealisees, EXPERT, "Expert");
        }
        return new Resultat("Débutant", missionsRealisees, ENGAGE, "Engagé");
    }

    public record Resultat(String nom, long missionsActuelles, Integer seuilSuivant, String niveauSuivant) {
    }
}

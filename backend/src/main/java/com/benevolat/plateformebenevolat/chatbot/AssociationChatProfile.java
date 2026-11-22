package com.benevolat.plateformebenevolat.chatbot;

import com.benevolat.plateformebenevolat.repository.MissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AssociationChatProfile implements ChatProfile {

    private final MissionRepository missionRepository;

    @Override
    public String buildSystemPrompt() {
        return VisitorChatProfile.readFile("chatbot/system-association.md")
                + "\n\n# FAQ Association\n"
                + VisitorChatProfile.readFile("chatbot/faq-association.md");
    }

    @Override
    @Transactional(readOnly = true)
    public String buildContext(Long userId) {
        if (userId == null) return "";
        try {
            var missions = missionRepository.findByAssociationIdUtilisateurOrderByDateDebutDesc(userId);
            if (missions.isEmpty()) return "";

            var sb = new StringBuilder("Vos missions :\n");
            missions.stream().limit(10).forEach(m -> {
                // Taux de remplissage simple
                int places = m.getNbPlaces();
                int attente = m.getNbPlacesListeAttente();
                int confirmes = Math.max(0, places - attente); // approximation côté chatbot
                int taux = places > 0 ? Math.min(100, confirmes * 100 / places) : 0;

                sb.append("- \"").append(m.getTitre()).append("\"")
                  .append(" | Statut : ").append(m.getStatut())
                  .append(" | Places totales : ").append(places)
                  .append(" | Attente : ").append(attente)
                  .append(" | Taux approx. : ").append(taux).append("%")
                  .append("\n");
            });
            return sb.toString();
        } catch (Exception e) {
            log.warn("Impossible de construire le contexte association pour userId={} : {}", userId, e.getMessage());
            return "";
        }
    }

    @Override
    public List<String> suggestions() {
        return List.of(
                "Comment rédiger la description d'une mission ?",
                "Comment déclarer un renfort ?",
                "Comment délivrer un certificat ?"
        );
    }
}

package com.benevolat.plateformebenevolat.chatbot;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@Slf4j
public class VisitorChatProfile implements ChatProfile {

    @Override
    public String buildSystemPrompt() {
        return readFile("chatbot/system-visiteur.md")
                + "\n\n# FAQ CountMeIn\n"
                + readFile("chatbot/faq-visiteur.md");
    }

    @Override
    public String buildContext(Long userId) {
        return ""; // Aucune donnée de la base pour les visiteurs
    }

    @Override
    public List<String> suggestions() {
        return List.of(
                "Comment créer un compte ?",
                "Comment fonctionne la liste d'attente ?",
                "Comment vérifier un certificat ?"
        );
    }

    /** Utilitaire partagé par tous les profils pour lire un fichier de ressources. */
    public static String readFile(String path) {
        try {
            return new ClassPathResource(path).getContentAsString(StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Fichier chatbot introuvable : {}", path);
            return "";
        }
    }
}

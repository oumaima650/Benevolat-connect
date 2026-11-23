package com.benevolat.plateformebenevolat.chatbot;

import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class AdminChatProfile implements ChatProfile {

    @Override
    public String buildSystemPrompt() {
        return VisitorChatProfile.readFile("chatbot/system-admin.md")
                + "\n\n# FAQ Admin\n"
                + VisitorChatProfile.readFile("chatbot/faq-admin.md");
    }

    @Override
    public String buildContext(Long userId) {
        return ""; // Aucune donnée de la base pour l'admin dans le chatbot
    }

    @Override
    public List<String> suggestions() {
        return List.of(
                "Comment valider une association ?",
                "Comment modérer une mission signalée ?",
                "Où consulter les statistiques ?"
        );
    }
}

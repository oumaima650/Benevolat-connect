package com.benevolat.plateformebenevolat.chatbot;

import java.util.List;

public interface ChatProfile {
    /** Prompt système complet (instructions + FAQ filtrée). */
    String buildSystemPrompt();
    /** Contexte utilisateur injecté (données de la base, filtrées par userId). */
    String buildContext(Long userId);
    /** Suggestions de questions affichées dans le widget. */
    List<String> suggestions();
}

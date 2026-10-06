import { BookOpen, HeartHandshake, Leaf, Utensils } from "lucide-react";

export function missionPresentation(domaine: string) {
  switch (domaine) {
    case "Éducation": return { Icon: BookOpen, color: "text-ink", background: "bg-mustard", label: "Transmettre, c’est faire grandir." };
    case "Environnement": return { Icon: Leaf, color: "text-paper", background: "bg-emerald", label: "Un petit geste. Un avenir plus vert." };
    case "Solidarité": return { Icon: Utensils, color: "text-ink", background: "bg-pink", label: "L’entraide commence avec toi." };
    default: return { Icon: HeartHandshake, color: "text-ink", background: "bg-mustard", label: "Du temps donné. Du lien retrouvé." };
  }
}
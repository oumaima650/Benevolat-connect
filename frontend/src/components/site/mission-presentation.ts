import {
  BookOpen, HeartHandshake, Leaf, Utensils, Heart, Users,
  Baby, ShieldCheck, Music, Dumbbell, Scale, AlertTriangle, Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Presentation = { Icon: LucideIcon; color: string; background: string; label: string };

const MAP: Record<string, Presentation> = {
  // Domaines exacts renvoyés par le backend
  "Écologie & Environnement":   { Icon: Leaf,           color: "text-paper", background: "bg-emerald",  label: "Un petit geste. Un avenir plus vert." },
  "Protection Animale":         { Icon: Heart,          color: "text-paper", background: "bg-pink",     label: "Ensemble pour les plus vulnérables." },
  "Lutte contre la Pauvreté":   { Icon: Utensils,       color: "text-ink",   background: "bg-mustard",  label: "L'entraide commence avec toi." },
  "Enfance & Jeunesse":         { Icon: Baby,           color: "text-ink",   background: "bg-mustard",  label: "Chaque enfant mérite une chance." },
  "Aide aux Personnes Âgées":   { Icon: HeartHandshake, color: "text-ink",   background: "bg-mustard",  label: "Du temps donné. Du lien retrouvé." },
  "Santé & Handicap":           { Icon: ShieldCheck,    color: "text-paper", background: "bg-pink",     label: "Prendre soin, c'est s'engager." },
  "Culture & Art":              { Icon: Music,          color: "text-ink",   background: "bg-mustard",  label: "L'art comme vecteur de lien." },
  "Sport & Handisport":         { Icon: Dumbbell,       color: "text-paper", background: "bg-emerald",  label: "Le sport, une école de vie." },
  "Droits Humains & Égalité":   { Icon: Scale,          color: "text-paper", background: "bg-pink",     label: "La justice, ça se construit ensemble." },
  "Éducation pour tous":        { Icon: BookOpen,       color: "text-ink",   background: "bg-mustard",  label: "Transmettre, c'est faire grandir." },
  "Urgence & Catastrophes":     { Icon: AlertTriangle,  color: "text-paper", background: "bg-pink",     label: "Agir vite, agir ensemble." },
  "Insertion Professionnelle":  { Icon: Briefcase,      color: "text-ink",   background: "bg-mustard",  label: "Un emploi, une dignité retrouvée." },
  // Alias courts utilisés dans les données locales legacy
  "Éducation":                  { Icon: BookOpen,       color: "text-ink",   background: "bg-mustard",  label: "Transmettre, c'est faire grandir." },
  "Environnement":              { Icon: Leaf,           color: "text-paper", background: "bg-emerald",  label: "Un petit geste. Un avenir plus vert." },
  "Solidarité":                 { Icon: Utensils,       color: "text-ink",   background: "bg-pink",     label: "L'entraide commence avec toi." },
  "Santé & lien social":        { Icon: Heart,          color: "text-paper", background: "bg-pink",     label: "Prendre soin, c'est s'engager." },
  "Social":                     { Icon: Users,          color: "text-paper", background: "bg-pink",     label: "Ensemble, on va plus loin." },
};

export function missionPresentation(domaine: string): Presentation {
  return MAP[domaine] ?? { Icon: HeartHandshake, color: "text-ink", background: "bg-mustard", label: "Du temps donné. Du lien retrouvé." };
}

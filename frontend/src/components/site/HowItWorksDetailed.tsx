import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown, UserCheck, BellRing, CheckCircle2,
  XCircle, Sparkles, Award, ShieldCheck, Mail, ArrowUpRight,
  Zap, Clock3, Info, Star, Trophy, Crown, Sprout, BadgeCheck,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { useAuth } from "@/context/AuthContext";

/* ── Accordéon ── */
function Accordion({
  id, numero, titre, icon: Icon, accent, children, defaultOpen = false,
}: {
  id: string; numero: string; titre: string;
  icon: React.FC<any>; accent: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      id={id}
      className={`rounded-2xl border-2 border-ink bg-paper overflow-hidden transition-shadow duration-200 ${
        open ? "shadow-[6px_6px_0_var(--color-ink)]" : "shadow-[4px_4px_0_var(--color-ink)]"
      }`}
    >
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-6 py-5 text-left hover:bg-muted transition-colors"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink text-xs font-black ${accent}`}>
          {numero}
        </span>
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <Icon className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={2} />
          <span className="font-display text-lg font-black text-ink leading-tight">{titre}</span>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-ink transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          strokeWidth={2.5}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-400 ease-in-out"
        style={{ maxHeight: open ? "1800px" : "0px", opacity: open ? 1 : 0 }}
      >
        <div className="border-t-2 border-ink px-6 pb-8 pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border-2 border-ink bg-muted px-4 py-3 shadow-[2px_2px_0_var(--color-ink)]">
      <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

/* ── Section 1 : Inscription ── */
function FileAttente() {
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setStep(s => (s + 1) % 3), 2400);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);
  const PLACES = 10;
  const benevoles = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div className="rounded-xl border-2 border-ink bg-paper p-4 shadow-[3px_3px_0_var(--color-ink)]">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Simulation · Mission de {PLACES} places
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {benevoles.map((n) => {
          const confirmed = n <= PLACES;
          const rankW = n - PLACES;
          const promoted = step === 1 && n === PLACES + 1;
          const shifted  = step === 2 && n === PLACES + 2;
          let bg = confirmed ? "bg-emerald text-emerald-foreground border-emerald" : "bg-orange-100 text-orange-700 border-orange-300";
          let label = confirmed ? `${n}` : `W${rankW}`;
          let extra = "";
          if (promoted) { bg = "bg-mustard text-ink border-ink"; label = `${n}✓`; extra = "ring-2 ring-mustard ring-offset-1 scale-110"; }
          if (shifted)  { label = "W1"; }
          return (
            <span key={n} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-black transition-all duration-500 ${bg} ${extra}`}>
              {label}
            </span>
          );
        })}
      </div>
      <div className="rounded-lg border-2 border-ink bg-muted px-3 py-2 text-xs font-semibold text-ink min-h-[2.5rem] flex items-center shadow-[2px_2px_0_var(--color-ink)]">
        {step === 0 && "10 bénévoles confirmés (vert). Les suivants sont en liste d'attente."}
        {step === 1 && "Un bénévole annule → le premier de la liste obtient sa place automatiquement. ✓"}
        {step === 2 && "Les rangs avancent d'un cran. L'ordre d'arrivée est toujours respecté."}
      </div>
      <div className="mt-3 flex gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-emerald border border-ink" /> Confirmé</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-orange-200 border border-orange-400" /> En attente</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-mustard border border-ink" /> Vient d'obtenir sa place</span>
      </div>
    </div>
  );
}

function S1() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {[
          { icon: UserCheck,   bg: "bg-emerald text-emerald-foreground",              n: "01", titre: "Tu t'inscris",          desc: "S'il reste une place, tu es confirmé immédiatement. Pas de validation requise." },
          { icon: BellRing,    bg: "bg-orange-100 text-orange-700 border-orange-300", n: "02", titre: "Pas de place ?",         desc: "Tu rejoins la liste d'attente. Ton rang est visible dans ton espace." },
          { icon: CheckCircle2,bg: "bg-mustard text-ink",                             n: "03", titre: "Une place se libère",    desc: "Le premier de la liste est averti par e-mail et obtient la place automatiquement." },
        ].map(({ icon: Icon, bg, n, titre, desc }) => (
          <div key={n} className={`rounded-xl border-2 border-ink p-4 shadow-[3px_3px_0_var(--color-ink)] ${bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="font-black text-sm">{n}. {titre}</span>
            </div>
            <p className="text-xs leading-relaxed opacity-80">{desc}</p>
          </div>
        ))}
      </div>
      <FileAttente />
      <Note>Tu peux annuler ta place <strong>avant le début de la mission</strong>. Le suivant en liste d'attente en sera informé et récupérera la place.</Note>
    </>
  );
}

/* ── Section 2 : Badges & niveaux ── */
const NIVEAUX = [
  { icon: Sprout,  label: "Débutant",  seuil: "1 – 4",   badge: "Première mission", missions: 1,  max: 5,  accent: "bg-mustard text-ink",                   barColor: "#d97706" },
  { icon: Star,    label: "Engagé",    seuil: "5 – 14",  badge: "Badge Engagé",     missions: 5,  max: 15, accent: "bg-muted text-ink",                     barColor: "#9ca3af" },
  { icon: Trophy,  label: "Expert",    seuil: "15 – 29", badge: "Badge Expert",     missions: 15, max: 30, accent: "bg-pink text-pink-foreground",           barColor: "#e2457a" },
  { icon: Crown,   label: "Champion",  seuil: "30+",     badge: "Badge Champion",   missions: 30, max: 30, accent: "bg-emerald text-emerald-foreground",     barColor: "#1f8a5b" },
];

function S2() {
  return (
    <>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Chaque mission pour laquelle tu reçois un certificat compte dans ta progression.
        Plus tu t'engages, plus ton niveau monte. Les badges sont obtenus une seule fois, automatiquement.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {NIVEAUX.map(({ icon: Icon, label, seuil, badge, missions, max, accent, barColor }) => (
          <div key={label} className="flex flex-col rounded-xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 transition-all">
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink ${accent}`}>
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <p className="font-display font-black text-lg text-ink">{label}</p>
            <p className="text-xs text-muted-foreground mb-3">{seuil} missions</p>
            <div className="h-2.5 w-full rounded-full border border-ink bg-muted overflow-hidden mb-1">
              <div className="h-full rounded-full border-r border-ink" style={{ width: `${Math.min(100, (missions / max) * 100)}%`, backgroundColor: barColor }} />
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">{missions === max ? "Niveau max" : `à partir de ${missions} missions`}</p>
            <div className="mt-auto">
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 text-[10px] font-black" style={{ backgroundColor: barColor + "22", color: barColor }}>
                <Award className="h-3 w-3" /> {badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Section 3 : Recommandations IA ── */
function ScoreGauge({ score }: { score: number }) {
  const r = 30, circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#1f8a5b" : score >= 60 ? "#d97706" : "#e2457a";
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 40 40)" />
      <text x="40" y="40" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 16, fontWeight: 900, fill: color, fontFamily: "'Bricolage Grotesque',sans-serif" }}>
        {score}
      </text>
    </svg>
  );
}

const criteres = [
  { label: "Proximité", pct: 45, color: "#2563eb" },
  { label: "Affinité",  pct: 35, color: "#e2457a" },
  { label: "Besoin",    pct: 20, color: "#1f8a5b" },
];

function S3() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <div>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          La plateforme analyse ton profil (ville, compétences, domaines) et te propose les missions les plus pertinentes en tête de liste, avec une explication en langage simple.
        </p>
        <div className="space-y-3">
          {[
            { label: "Proximité", pct: 45, color: "#2563eb", desc: "Les missions près de chez toi passent en premier." },
            { label: "Affinité",  pct: 35, color: "#e2457a", desc: "Tes domaines et compétences sont pris en compte." },
            { label: "Besoin",    pct: 20, color: "#1f8a5b", desc: "Les missions qui ont le plus besoin de bénévoles remontent." },
          ].map(({ label, pct, color, desc }) => (
            <div key={label} className="rounded-xl border-2 border-ink bg-paper p-4 shadow-[2px_2px_0_var(--color-ink)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-sm text-ink">{label}</span>
                <span className="font-black text-base" style={{ color }}>{pct} %</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full border border-ink bg-muted mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <span className="inline-block rounded-full border-2 border-ink bg-mustard px-2.5 py-0.5 text-[10px] font-black text-ink mb-2">Pour toi</span>
            <p className="font-display font-black text-base text-ink">Atelier informatique seniors</p>
            <p className="text-xs text-muted-foreground mt-0.5">Réseau Vert Tanger · Tanger</p>
          </div>
          <ScoreGauge score={87} />
        </div>
        <div className="space-y-1.5 mb-4">
          {criteres.map(({ label, pct, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-16 text-[11px] text-muted-foreground shrink-0">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <span className="text-[11px] font-bold text-ink w-8 text-right">{pct}%</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg border-2 border-dashed border-ink/30 bg-muted p-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-mustard mt-0.5" />
          <p className="text-xs italic text-muted-foreground">
            "Vos compétences en informatique correspondent aux besoins, et la mission est à 3 km de chez vous."
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Section 4 : Certificats ── */
function S4() {
  const { user } = useAuth();

  // Nom affiché sur le certificat : prénom + nom (bénévole), nomAssociation (asso), ou nom fictif si non connecté
  const nomAffiche = user
    ? user.role === "ASSOCIATION"
      ? user.nomAssociation ?? user.email
      : [user.prenom, user.nom].filter(Boolean).join(" ") || user.email
    : "Yasmine El Idrissi";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
      <div>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Quand la mission se termine, l'association délivre un <strong>certificat PDF</strong> à chaque bénévole participant. C'est ce certificat qui valide ta mission et fait avancer ton niveau.
        </p>
        <div className="space-y-3">
          {[
            { icon: BadgeCheck,  label: "Un certificat unique par mission et par bénévole." },
            { icon: ShieldCheck, label: "Vérifiable en ligne par n'importe qui (recruteur, école...)." },
            { icon: Award,       label: "Téléchargeable à tout moment depuis ton espace." },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border-2 border-ink bg-muted p-3 shadow-[2px_2px_0_var(--color-ink)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink bg-emerald shrink-0">
                <Icon className="h-4 w-4 text-emerald-foreground" />
              </div>
              <span className="text-sm font-semibold text-ink">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border-4 border-ink bg-paper p-6 shadow-[6px_6px_0_var(--color-mustard)] relative">
        <div className="absolute -right-3 -top-3 flex h-14 w-14 rotate-12 items-center justify-center rounded-full border-4 border-ink bg-emerald text-center text-[9px] font-black leading-tight text-paper">
          Certifié<br />✓
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald mb-2">Certificat de bénévolat</p>
        <p className="text-xs text-muted-foreground">Décerné à</p>
        <p className="font-display text-2xl font-black text-ink">{nomAffiche}</p>
        <p className="mt-2 text-sm text-muted-foreground">pour <strong>Plantation d'arbres — Rabat</strong></p>
        <div className="mt-4 border-t-2 border-dashed border-ink/20 pt-4 flex justify-between text-xs text-muted-foreground">
          <span>Association Maroc Vert</span>
          <span>15 nov. 2026</span>
        </div>
        <p className="mt-3 font-mono text-[10px] tracking-widest text-muted-foreground">N° CMI-2026-RBA-047</p>
      </div>
    </div>
  );
}

/* ── Section 5 : Notifications ── */
function S5() {
  const notifs = [
    { icon: CheckCircle2, bg: "bg-emerald text-emerald-foreground", titre: "Place confirmée",       desc: "Tu reçois un e-mail dès que ta place est confirmée ou ta position en liste d'attente." },
    { icon: BellRing,     bg: "bg-pink text-pink-foreground",       titre: "Place obtenue",          desc: "Si quelqu'un se désiste et que tu es le suivant, tu es notifié immédiatement." },
    { icon: Clock3,       bg: "bg-mustard text-ink",                titre: "Rappel la veille",       desc: "Un rappel automatique t'est envoyé 24 h avant chaque mission confirmée." },
    { icon: Zap,          bg: "bg-red-100 text-red-700 border-red-300", titre: "Besoin urgent",    desc: "Certaines missions peuvent demander des bénévoles en urgence — tu seras alerté." },
    { icon: XCircle,      bg: "bg-rose-100 text-rose-700 border-rose-300", titre: "Annulation",    desc: "Si une mission est annulée, tu es prévenu et ta place libérée." },
    { icon: ShieldCheck,  bg: "bg-emerald text-emerald-foreground", titre: "Certificat disponible", desc: "L'association t'envoie le lien de téléchargement dès que ton certificat est prêt." },
  ];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {notifs.map(({ icon: Icon, bg, titre, desc }) => (
          <div key={titre} className="flex items-start gap-3 rounded-xl border-2 border-ink bg-paper p-4 shadow-[3px_3px_0_var(--color-ink)]">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink ${bg}`}>
              <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold text-sm text-ink">{titre}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="h-4 w-4 shrink-0" />
        Toutes les notifications arrivent par <strong className="text-ink mx-1">e-mail</strong>. Tu peux choisir lesquelles recevoir depuis ton espace.
      </div>
    </>
  );
}

/* ── Export ── */
const SECTIONS = [
  {
    id: "inscription", numero: "01", titre: "Comment l'inscription fonctionne",
    icon: UserCheck, accent: "bg-pink text-pink-foreground", defaultOpen: true,
    children: <S1 />,
  },
  {
    id: "badges", numero: "02", titre: "Niveaux et badges",
    icon: Award, accent: "bg-mustard text-ink",
    children: <S2 />,
  },
  {
    id: "recommandations", numero: "03", titre: "Des missions faites pour toi",
    icon: Sparkles, accent: "bg-emerald text-emerald-foreground",
    children: <S3 />,
  },
  {
    id: "certificats", numero: "04", titre: "Ton certificat de bénévolat",
    icon: BadgeCheck, accent: "bg-pink text-pink-foreground",
    children: <S4 />,
  },
  {
    id: "notifications", numero: "05", titre: "Tu es toujours informé",
    icon: BellRing, accent: "bg-mustard text-ink",
    children: <S5 />,
  },
];

export function HowItWorksDetailed() {
  return (
    <section id="comment-ca-marche" className="border-b-4 border-ink bg-muted py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">Comment ça marche</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            L'essentiel à savoir avant de te lancer. Clique sur une section pour l'ouvrir.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-4">
          {SECTIONS.map(({ id, numero, titre, icon, accent, defaultOpen, children }, i) => (
            <Reveal key={id} delay={i * 60}>
              <Accordion id={id} numero={numero} titre={titre} icon={icon} accent={accent} defaultOpen={defaultOpen ?? false}>
                {children}
              </Accordion>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/inscription"
            search={{ role: "BENEVOLE" }}
            className="press inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-pink px-6 py-3 text-sm font-bold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)]"
          >
            Je suis bénévole <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            to="/inscription"
            search={{ role: "ASSOCIATION" }}
            className="press inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-paper px-6 py-3 text-sm font-bold text-ink shadow-[4px_4px_0_var(--color-emerald)]"
          >
            Je suis une association <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

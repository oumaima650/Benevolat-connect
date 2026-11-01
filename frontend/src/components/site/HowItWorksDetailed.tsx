import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown, UserCheck, BellRing, CheckCircle2, XCircle,
  Sparkles, Award, ShieldCheck, Mail, ArrowUpRight, Zap,
  Clock3, Info, Star, Trophy, Crown, Sprout, BadgeCheck,
  Building2, FileText, Users, BarChart3, CalendarCheck, Check,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { themeBanniere } from "@/components/gamification/BanniereBenevole";
import { BadgeMedaille } from "@/components/gamification/BadgeMedaille";
import { useAuth } from "@/context/AuthContext";

/* ─────────────────────────────────────────────
   Composant accordéon
───────────────────────────────────────────── */
function Accordion({
  id, numero, titre, icon: Icon, accent, children, defaultOpen = false,
}: {
  id: string; numero: string; titre: string;
  icon: React.FC<any>; accent: string;
  children: ReactNode; defaultOpen?: boolean;
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

function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border-2 border-ink bg-muted px-4 py-3 shadow-[2px_2px_0_var(--color-ink)]">
      <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PARTIE BÉNÉVOLE — accordéons
═══════════════════════════════════════════ */

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
          let bg = confirmed
            ? "bg-emerald text-emerald-foreground border-emerald"
            : "bg-orange-100 text-orange-700 border-orange-300";
          let label: React.ReactNode = confirmed ? `${n}` : `W${rankW}`;
          let extra = "";
          if (promoted) { bg = "bg-mustard text-ink border-ink"; label = <span className="inline-flex items-center gap-0.5">{n}<Check className="h-2.5 w-2.5" /></span>; extra = "ring-2 ring-mustard ring-offset-1 scale-110"; }
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
        {step === 1 && <span className="inline-flex items-center gap-1">Un bénévole annule → le premier de la liste obtient sa place automatiquement. <Check className="h-3.5 w-3.5" /></span>}
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

function B1() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {[
          { icon: UserCheck,    bg: "bg-emerald text-emerald-foreground",              n: "01", titre: "Tu t'inscris",       desc: "S'il reste une place, tu es confirmé immédiatement. Pas de validation requise." },
          { icon: BellRing,     bg: "bg-orange-100 text-orange-700 border-orange-300", n: "02", titre: "Pas de place ?",      desc: "Tu rejoins la liste d'attente. Ton rang est visible dans ton espace." },
          { icon: CheckCircle2, bg: "bg-mustard text-ink",                             n: "03", titre: "Place libérée",       desc: "Le premier de la liste est averti par e-mail et obtient la place automatiquement." },
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
      <Note>Tu peux annuler ta place <strong>avant le début de la mission</strong>. Le suivant en liste d'attente récupère la place automatiquement.</Note>
    </>
  );
}

/** Un badge palier tous les 5 niveaux ; chacun débloque une bannière de profil. */
const PALIERS = ["etincelle", "flamme", "phare", "etoile", "constellation", "legende"].map((theme, i) => ({
  theme,
  niveau: (i + 1) * 5,
}));

function B2() {
  return (
    <>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Chaque mission pour laquelle tu reçois un certificat te fait gagner <strong>un niveau</strong>, et chaque niveau a son nom
        (Premier pas, Main tendue, Volontaire…). Tous les <strong>5 niveaux</strong>, tu décroches un badge qui personnalise la bannière
        de ton profil, visible par les associations. Des badges spéciaux récompensent aussi les renforts urgents, la fidélité et la diversité de tes missions.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PALIERS.map(({ theme, niveau }) => {
          const t = themeBanniere(theme);
          return (
            <div key={theme} className="overflow-hidden rounded-xl border-2 border-ink bg-paper shadow-[4px_4px_0_var(--color-ink)] hover:-translate-y-0.5 transition-all">
              <div className="relative h-16 border-b-2 border-ink" style={{ background: t.fond }}>
                <div aria-hidden className="absolute inset-0" style={{ backgroundImage: t.motif }} />
                {t.badge && <BadgeMedaille code={t.badge} taille={52} titre={t.label} className="absolute right-3 top-4" />}
              </div>
              <div className="p-4">
                <p className="font-display font-black text-lg text-ink">{t.label}</p>
                <p className="text-xs text-muted-foreground">Badge et bannière au niveau {niveau}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

const criteres = [
  { label: "Proximité",   pct: 40, color: "#2563eb", desc: "Les missions près de chez toi passent en premier." },
  { label: "Compétences", pct: 30, color: "#e2457a", desc: "Tes compétences sont comparées à celles demandées." },
  { label: "Besoin",      pct: 20, color: "#1f8a5b", desc: "Les renforts urgents et les missions qui manquent de bénévoles remontent." },
  { label: "Fidélité",    pct: 10, color: "#d97706", desc: "Les associations que tu as déjà aidées sont mises en avant." },
];

function B3() {
  const r = 30, circ = 2 * Math.PI * r;
  const score = 87;
  const color = "#1f8a5b";
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <div>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          La plateforme analyse ton profil et te propose les missions les plus pertinentes, avec une explication en langage simple.
        </p>
        <div className="space-y-3">
          {criteres.map(({ label, pct, color: c, desc }) => (
            <div key={label} className="rounded-xl border-2 border-ink bg-paper p-4 shadow-[2px_2px_0_var(--color-ink)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-sm text-ink">{label}</span>
                <span className="font-black text-base" style={{ color: c }}>{pct} %</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full border border-ink bg-muted mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c }} />
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
        </div>
        <div className="space-y-1.5 mb-4">
          {criteres.map(({ label, pct, color: c }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-16 text-[11px] text-muted-foreground shrink-0">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c }} />
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

function B4({ nomAffiche }: { nomAffiche: string }) {
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
        <div className="absolute -right-3 -top-3 flex h-14 w-14 rotate-12 flex-col items-center justify-center rounded-full border-4 border-ink bg-emerald text-center text-[9px] font-black leading-tight text-paper">
          Certifié<br /><Check className="h-3.5 w-3.5" />
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

function B5() {
  const notifs = [
    { icon: CheckCircle2, bg: "bg-emerald text-emerald-foreground",           titre: "Place confirmée",       desc: "Tu reçois un e-mail dès que ta place est confirmée ou ta position en liste d'attente." },
    { icon: BellRing,     bg: "bg-pink text-pink-foreground",                 titre: "Place obtenue",          desc: "Si quelqu'un se désiste et que tu es le suivant, tu es notifié immédiatement." },
    { icon: Clock3,       bg: "bg-mustard text-ink",                          titre: "Rappel la veille",       desc: "Un rappel automatique t'est envoyé 24 h avant chaque mission confirmée." },
    { icon: Zap,          bg: "bg-red-100 text-red-700 border-red-300",       titre: "Besoin urgent",          desc: "Certaines missions peuvent demander des bénévoles en urgence — tu seras alerté." },
    { icon: XCircle,      bg: "bg-rose-100 text-rose-700 border-rose-300",    titre: "Annulation",             desc: "Si une mission est annulée, tu es prévenu et ta place libérée." },
    { icon: ShieldCheck,  bg: "bg-emerald text-emerald-foreground",           titre: "Certificat disponible",  desc: "L'association t'envoie le lien de téléchargement dès que ton certificat est prêt." },
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

/* ═══════════════════════════════════════════
   PARTIE ASSOCIATION — frise + avantages
═══════════════════════════════════════════ */
const ETAPES_ASSO = [
  {
    icon: Building2,
    titre: "Créez votre compte",
    desc: "Inscrivez votre association. Notre équipe valide votre profil pour garantir la confiance.",
    accent: "bg-mustard text-ink",
  },
  {
    icon: FileText,
    titre: "Publiez votre mission",
    desc: "Décrivez votre besoin, le lieu, les dates, le nombre de places et les compétences recherchées.",
    accent: "bg-pink text-pink-foreground",
  },
  {
    icon: Users,
    titre: "Les bénévoles s'inscrivent",
    desc: "L'inscription est immédiate. Quand la mission est complète, une liste d'attente comble les désistements automatiquement.",
    accent: "bg-emerald text-emerald-foreground",
  },
  {
    icon: Zap,
    titre: "Réalisez votre mission",
    desc: "En cas de besoin de dernière minute, demandez un renfort. Les bénévoles en attente sont prévenus en priorité.",
    accent: "bg-mustard text-ink",
  },
  {
    icon: Award,
    titre: "Reconnaissez l'engagement",
    desc: "Délivrez un certificat PDF vérifiable. Les bénévoles gagnent des badges et progressent de niveau.",
    accent: "bg-pink text-pink-foreground",
  },
];

const AVANTAGES_ASSO = [
  {
    icon: Clock3,
    titre: "Moins d'absences",
    desc: "Des rappels automatiques sont envoyés aux bénévoles 24 h avant chaque mission.",
    bg: "bg-mustard text-ink",
  },
  {
    icon: Sparkles,
    titre: "Des bénévoles adaptés",
    desc: "L'IA recommande vos missions aux profils les plus pertinents, près de chez vous.",
    bg: "bg-pink text-pink-foreground",
  },
  {
    icon: BarChart3,
    titre: "Suivi simple",
    desc: "Un tableau de bord pour voir vos inscrits, votre liste d'attente et votre taux de remplissage.",
    bg: "bg-emerald text-emerald-foreground",
  },
];

function SectionAssociation() {
  return (
    <section id="comment-association" className="border-b-4 border-ink bg-paper py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-5">

        {/* En-tête */}
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Pour les associations</p>
          <h2 className="text-3xl sm:text-4xl">
            Trouvez vos bénévoles <span className="relative inline-block">
              <span className="relative z-10">en 5 étapes</span>
              <span className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-mustard" />
            </span>
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Aucun tableur, aucun appel sans fin. CountMeIn gère les inscriptions, la liste d'attente et les rappels pour vous.
          </p>
        </Reveal>

        {/* Frise des étapes */}
        <div className="mt-12 relative">
          {/* Ligne de connexion desktop */}
          <div className="absolute top-9 left-0 right-0 hidden h-0.5 bg-ink/10 md:block" style={{ zIndex: 0 }} />

          <div className="relative grid gap-8 md:grid-cols-5" style={{ zIndex: 1 }}>
            {ETAPES_ASSO.map(({ icon: Icon, titre, desc, accent }, i) => (
              <Reveal key={titre} delay={i * 100}>
                <div className="flex flex-col items-center text-center md:items-center">
                  {/* Numéro + icône */}
                  <div className={`relative flex h-18 w-18 items-center justify-center rounded-xl border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] mb-4 ${accent}`}
                    style={{ width: 56, height: 56 }}>
                    <Icon className="h-6 w-6" strokeWidth={2} />
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-paper text-[10px] font-black text-ink">
                      {i + 1}
                    </span>
                  </div>
                  <p className="font-display font-black text-sm text-ink leading-tight mb-1.5">{titre}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Séparateur */}
        <div className="my-12 h-px bg-ink/10" />

        {/* 3 avantages */}
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">Pourquoi CountMeIn</p>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {AVANTAGES_ASSO.map(({ icon: Icon, titre, desc, bg }, i) => (
            <Reveal key={titre} delay={i * 100}>
              <div className={`flex flex-col rounded-2xl border-2 border-ink p-6 shadow-[4px_4px_0_var(--color-ink)] transition-all hover:-translate-y-1 ${bg}`}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-paper mb-4">
                  <Icon className="h-6 w-6 text-ink" strokeWidth={2} />
                </div>
                <h3 className="font-display font-black text-lg mb-2">{titre}</h3>
                <p className="text-sm leading-relaxed opacity-80">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA */}
        <Reveal className="mt-10">
          <Link
            to="/inscription"
            search={{ role: "ASSOCIATION" }}
            className="press inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-ink px-7 py-4 text-sm font-bold text-paper shadow-[4px_4px_0_var(--color-mustard)]"
          >
            <Building2 className="h-4 w-4" />
            Inscrire mon association
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   PARTIE BÉNÉVOLE — accordéons
═══════════════════════════════════════════ */
function SectionBenevole({ nomAffiche }: { nomAffiche: string }) {
  const SECTIONS_B = [
    {
      id: "inscription", numero: "01", titre: "Comment l'inscription fonctionne",
      icon: UserCheck, accent: "bg-pink text-pink-foreground", defaultOpen: true,
      children: <B1 />,
    },
    {
      id: "badges", numero: "02", titre: "Niveaux et badges",
      icon: Award, accent: "bg-mustard text-ink",
      children: <B2 />,
    },
    {
      id: "recommandations", numero: "03", titre: "Des missions faites pour toi",
      icon: Sparkles, accent: "bg-emerald text-emerald-foreground",
      children: <B3 />,
    },
    {
      id: "certificats", numero: "04", titre: "Ton certificat de bénévolat",
      icon: BadgeCheck, accent: "bg-pink text-pink-foreground",
      children: <B4 nomAffiche={nomAffiche} />,
    },
    {
      id: "notifications", numero: "05", titre: "Tu es toujours informé",
      icon: BellRing, accent: "bg-mustard text-ink",
      children: <B5 />,
    },
  ];

  return (
    <section id="comment-ca-marche" className="border-b-4 border-ink bg-muted py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Pour les bénévoles</p>
          <h2 className="text-3xl sm:text-4xl">Comment ça marche</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            L'essentiel à savoir avant de te lancer. Clique sur une section pour l'ouvrir.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-4">
          {SECTIONS_B.map(({ id, numero, titre, icon, accent, defaultOpen, children }, i) => (
            <Reveal key={id} delay={i * 60}>
              <Accordion id={id} numero={numero} titre={titre} icon={icon} accent={accent} defaultOpen={defaultOpen ?? false}>
                {children}
              </Accordion>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <Link
            to="/inscription"
            search={{ role: "BENEVOLE" }}
            className="press inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-pink px-6 py-3 text-sm font-bold text-pink-foreground shadow-[4px_4px_0_var(--color-ink)]"
          >
            Je suis bénévole <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   EXPORT PRINCIPAL — logique d'affichage
═══════════════════════════════════════════ */
export function HowItWorksDetailed() {
  const { user } = useAuth();

  const nomAffiche = user
    ? user.role === "ASSOCIATION"
      ? user.nomAssociation ?? user.email
      : [user.prenom, user.nom].filter(Boolean).join(" ") || user.email
    : "Yasmine El Idrissi";

  // Association connectée → seulement la section association
  if (user?.role === "ASSOCIATION") {
    return <SectionAssociation />;
  }

  // Bénévole connecté → seulement la section bénévole
  if (user?.role === "BENEVOLE") {
    return <SectionBenevole nomAffiche={nomAffiche} />;
  }

  // Non connecté → les deux sections
  return (
    <>
      <SectionBenevole nomAffiche={nomAffiche} />
      <SectionAssociation />
    </>
  );
}

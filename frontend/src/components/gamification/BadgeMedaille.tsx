import { useId, type ReactNode } from 'react';

/**
 * Médailles des badges, dessinées en SVG (pas d'icônes ni d'émojis) : un anneau métallique,
 * un disque coloré et une illustration propre à chaque badge. La clé est Badge.code côté backend.
 */
type Medaille = {
  anneau: [string, string];
  disque: [string, string];
  illustration: ReactNode;
};

const ENCRE = '#1a1a1a';
const trait = { stroke: ENCRE, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Étoile à 5 branches centrée en (cx, cy). */
function etoile(cx: number, cy: number, R: number, r: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const rayon = i % 2 === 0 ? R : r;
    return `${(cx + rayon * Math.cos(angle)).toFixed(1)},${(cy + rayon * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

/** Étincelle à 4 branches centrée en (cx, cy). */
function etincelle(cx: number, cy: number, t: number) {
  const c = t * 0.12;
  return `M${cx} ${cy - t} C${cx + c} ${cy - c} ${cx + c} ${cy - c} ${cx + t} ${cy}
          C${cx + c} ${cy + c} ${cx + c} ${cy + c} ${cx} ${cy + t}
          C${cx - c} ${cy + c} ${cx - c} ${cy + c} ${cx - t} ${cy}
          C${cx - c} ${cy - c} ${cx - c} ${cy - c} ${cx} ${cy - t}Z`;
}

const MEDAILLES: Record<string, Medaille> = {
  ETINCELLE: {
    anneau: ['#fff1b8', '#c98a00'],
    disque: ['#ffd95a', '#f59e0b'],
    illustration: (
      <>
        <path d={etincelle(50, 51, 24)} fill="#fffaf0" {...trait} />
        <path d={etincelle(69, 31, 7)} fill="#fffaf0" {...trait} strokeWidth={2} />
        <path d={etincelle(31, 70, 6)} fill="#fffaf0" {...trait} strokeWidth={2} />
      </>
    ),
  },
  FLAMME: {
    anneau: ['#ffc9a3', '#b4410f'],
    disque: ['#ff9a4d', '#e8423f'],
    illustration: (
      <>
        <path d="M50 21 C57 33 69 39 67 56 C66 68 58 77 50 77 C41 77 33 69 33 58 C33 48 40 43 43 35 C45 44 48 47 51 47 C53 38 48 30 50 21Z" fill="#ffd166" {...trait} />
        <path d="M50 50 C54 56 59 59 58 65 C57 70 54 73 50 73 C46 73 42 70 42 65 C42 60 47 57 50 50Z" fill="#fff3c4" {...trait} strokeWidth={2} />
      </>
    ),
  },
  PHARE: {
    anneau: ['#dfe6ff', '#4f6bd8'],
    disque: ['#3c5aa6', '#1e2a5a'],
    illustration: (
      <>
        <path d="M50 36 L17 27 L17 45Z" fill="#fff3a8" opacity={0.75} />
        <path d="M50 36 L83 27 L83 45Z" fill="#fff3a8" opacity={0.75} />
        <path d="M43 44 L57 44 L61 74 L39 74Z" fill="#fffdf7" {...trait} />
        <path d="M42 54 L58 54 L59 62 L41 62Z" fill="#e8423f" {...trait} strokeWidth={2} />
        <rect x="44" y="35" width="12" height="9" rx="1.5" fill="#ffec99" {...trait} strokeWidth={2} />
        <path d="M41.5 35 L50 27 L58.5 35Z" fill="#e8423f" {...trait} strokeWidth={2} />
        <rect x="33" y="74" width="34" height="5" rx="2.5" fill={ENCRE} />
      </>
    ),
  },
  ETOILE: {
    anneau: ['#f6e6ff', '#8f5fd0'],
    disque: ['#8f6ad6', '#5b3fa0'],
    illustration: (
      <>
        <polygon points={etoile(50, 52, 26, 11)} fill="#ffe08a" {...trait} />
        <polygon points={etoile(50, 52, 12, 5)} fill="#fff7d6" stroke="none" />
      </>
    ),
  },
  CONSTELLATION: {
    anneau: ['#e4ddff', '#6d5bd0'],
    disque: ['#4a2585', '#0f1035'],
    illustration: (
      <>
        <polyline points="28,63 39,44 54,50 67,31 72,60 54,50" fill="none" stroke="#e9e3ff" strokeWidth={2} strokeLinejoin="round" />
        {[[28, 63], [39, 44], [54, 50], [72, 60]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={3.6} fill="#fffdf7" stroke={ENCRE} strokeWidth={1.5} />
        ))}
        <path d={etincelle(67, 31, 8)} fill="#fff7d6" stroke={ENCRE} strokeWidth={1.5} strokeLinejoin="round" />
        <circle cx="36" cy="30" r="1.4" fill="#fff" />
        <circle cx="62" cy="72" r="1.4" fill="#fff" />
        <circle cx="76" cy="44" r="1.2" fill="#fff" />
      </>
    ),
  },
  LEGENDE: {
    anneau: ['#fff4c2', '#a8770a'],
    disque: ['#4a3b14', '#1a1a1a'],
    illustration: (
      <>
        <path d="M29 64 L27 37 L40 49 L50 30 L60 49 L73 37 L71 64Z" fill="#ffd34d" {...trait} />
        <rect x="29" y="63" width="42" height="9" rx="2" fill="#e6b422" {...trait} />
        <circle cx="27" cy="37" r="3.6" fill="#e8423f" {...trait} strokeWidth={1.8} />
        <circle cx="50" cy="30" r="3.6" fill="#e8423f" {...trait} strokeWidth={1.8} />
        <circle cx="73" cy="37" r="3.6" fill="#e8423f" {...trait} strokeWidth={1.8} />
        <circle cx="50" cy="67.5" r="2.4" fill="#fffdf7" />
      </>
    ),
  },
  RENFORT_DE_CHOC: {
    anneau: ['#ffd6dc', '#d1193f'],
    disque: ['#ff6680', '#be123c'],
    illustration: (
      <>
        <path d="M27 38 A18 18 0 0 0 27 62" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
        <path d="M73 38 A18 18 0 0 1 73 62" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
        <path d="M56 21 L35 54 L48 54 L44 79 L66 44 L53 44Z" fill="#fff3a8" {...trait} />
      </>
    ),
  },
  FIDELE: {
    anneau: ['#ffe0ee', '#d4558b'],
    disque: ['#f7a8c9', '#e96fa3'],
    illustration: (
      <>
        <circle cx="42" cy="52" r="15" fill="none" stroke={ENCRE} strokeWidth={9} />
        <circle cx="42" cy="52" r="15" fill="none" stroke="#fffdf7" strokeWidth={4.5} />
        <circle cx="58" cy="52" r="15" fill="none" stroke={ENCRE} strokeWidth={9} />
        <circle cx="58" cy="52" r="15" fill="none" stroke="#ffd34d" strokeWidth={4.5} />
        {/* Entrelacement : l'anneau blanc repasse devant en haut */}
        <path d="M47.5 38 A15 15 0 0 1 56.8 46.5" fill="none" stroke={ENCRE} strokeWidth={9} strokeLinecap="butt" />
        <path d="M47.5 38 A15 15 0 0 1 56.8 46.5" fill="none" stroke="#fffdf7" strokeWidth={4.5} strokeLinecap="butt" />
      </>
    ),
  },
  EXPLORATEUR: {
    anneau: ['#d2f5e2', '#1f8a5b'],
    disque: ['#3cbf85', '#1f8a5b'],
    illustration: (
      <>
        <circle cx="50" cy="51" r="23" fill="#fffdf7" {...trait} />
        {[[50, 31, 50, 35], [50, 67, 50, 71], [30, 51, 34, 51], [66, 51, 70, 51]].map(([x1, y1, x2, y2]) => (
          <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ENCRE} strokeWidth={2} strokeLinecap="round" />
        ))}
        <path d="M50 34 L56 51 L44 51Z" fill="#e8423f" {...trait} strokeWidth={2} />
        <path d="M50 68 L56 51 L44 51Z" fill="#d6d3cc" {...trait} strokeWidth={2} />
        <circle cx="50" cy="51" r="2.8" fill={ENCRE} />
      </>
    ),
  },
  SPECIALISTE: {
    anneau: ['#dce9ff', '#2563eb'],
    disque: ['#6aa8ff', '#2563eb'],
    illustration: (
      <>
        <circle cx="47" cy="53" r="22" fill="#fffdf7" {...trait} />
        <circle cx="47" cy="53" r="14.5" fill="#e8423f" {...trait} strokeWidth={2} />
        <circle cx="47" cy="53" r="7.5" fill="#fffdf7" {...trait} strokeWidth={2} />
        <line x1="47" y1="53" x2="71" y2="29" stroke={ENCRE} strokeWidth={3} strokeLinecap="round" />
        <path d="M71 29 L71 21 L76 24 L79 29 L71 29Z" fill="#ffd34d" {...trait} strokeWidth={1.8} />
        <circle cx="47" cy="53" r="2.6" fill={ENCRE} />
      </>
    ),
  },
  REGULIER: {
    anneau: ['#feeccd', '#c56a05'],
    disque: ['#fcc441', '#d97706'],
    illustration: (
      <>
        <rect x="28" y="56" width="11" height="16" rx="2.5" fill="#fffdf7" {...trait} />
        <rect x="44.5" y="46" width="11" height="26" rx="2.5" fill="#fffdf7" {...trait} />
        <rect x="61" y="36" width="11" height="36" rx="2.5" fill="#e8423f" {...trait} />
        <path d="M30 44 L41 35 L52 38 L68 24" fill="none" stroke={ENCRE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M62 23 L69 23 L69 30" fill="none" stroke={ENCRE} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
};

const PAR_DEFAUT: Medaille = {
  anneau: ['#f3efe6', '#9a9486'],
  disque: ['#e9e4d8', '#c9c2b2'],
  illustration: <polygon points={etoile(50, 52, 22, 9)} fill="#fffdf7" {...trait} />,
};

type Props = {
  code: string;
  /** Diamètre en pixels. */
  taille?: number;
  /** Non obtenu : médaille grisée. */
  verrouille?: boolean;
  titre?: string;
  className?: string;
};

export function BadgeMedaille({ code, taille = 64, verrouille = false, titre, className = '' }: Props) {
  const id = useId().replace(/:/g, '');
  const m = MEDAILLES[code] ?? PAR_DEFAUT;
  return (
    <svg
      viewBox="0 0 104 104"
      width={taille}
      height={taille}
      role="img"
      aria-label={titre ?? code}
      className={`shrink-0 ${verrouille ? 'opacity-45 grayscale' : ''} ${className}`}
    >
      {titre && <title>{titre}</title>}
      <defs>
        <linearGradient id={`anneau-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={m.anneau[0]} />
          <stop offset="55%" stopColor={m.anneau[1]} />
          <stop offset="100%" stopColor={m.anneau[0]} />
        </linearGradient>
        <radialGradient id={`disque-${id}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor={m.disque[0]} />
          <stop offset="100%" stopColor={m.disque[1]} />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <circle cx="50" cy="50" r="35" />
        </clipPath>
      </defs>
      {/* Ombre décalée (charte néo-brutaliste) */}
      <circle cx="53" cy="53" r="47" fill={ENCRE} />
      <circle cx="50" cy="50" r="47" fill={`url(#anneau-${id})`} stroke={ENCRE} strokeWidth={3} />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="1.5 4" />
      <circle cx="50" cy="50" r="35" fill={`url(#disque-${id})`} stroke={ENCRE} strokeWidth={2.5} />
      <g clipPath={`url(#clip-${id})`}>{m.illustration}</g>
      <circle cx="50" cy="50" r="35" fill="none" stroke={ENCRE} strokeWidth={2.5} />
      {/* Reflet */}
      <path d="M17 38 A35 35 0 0 1 40 13" fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={3.5} strokeLinecap="round" />
    </svg>
  );
}

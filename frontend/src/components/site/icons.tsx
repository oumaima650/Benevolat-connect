// Trois motifs récurrents : sourire (espoir), mains (entraide), cercle (communauté).

type IconProps = { className?: string };

export function SmileMotif({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="currentColor" />
      <circle cx="22" cy="25" r="4" fill="var(--color-ink)" />
      <circle cx="42" cy="25" r="4" fill="var(--color-ink)" />
      <path
        d="M18 38c4 8 24 8 28 0"
        stroke="var(--color-ink)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HandsMotif({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="26" width="26" height="12" rx="6" fill="currentColor" />
      <rect x="36" y="26" width="26" height="12" rx="6" fill="currentColor" />
      <path
        d="M22 32h20"
        stroke="var(--color-ink)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="9" fill="currentColor" stroke="var(--color-ink)" strokeWidth="4" />
    </svg>
  );
}

export function GlobeMotif({ className }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="currentColor" />
      <ellipse cx="32" cy="32" rx="13" ry="30" stroke="var(--color-ink)" strokeWidth="4" />
      <path d="M2 32h60M7 17h50M7 47h50" stroke="var(--color-ink)" strokeWidth="4" />
    </svg>
  );
}

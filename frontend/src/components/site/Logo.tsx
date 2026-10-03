import logoImg from "@/assets/logo.png";

export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <img
      src={logoImg}
      alt="COUNTMEIN — CONNECTER • SOUTENIR • AGIR"
      className={`max-w-full object-contain ${className}`}
    />
  );
}

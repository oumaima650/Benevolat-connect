import {
  Heart,
  Users,
  Globe2,
  MapPin,
  Calendar,
  Search,
  Award,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
  BadgeCheck,
  Mail,
  Phone,
  Instagram,
  Linkedin,
  Facebook,
  Menu,
  X,
  Rocket,
  Handshake,
  Target,
  TrendingUp,
  SearchCheck,
  FileCheck2,
  Ticket,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type IconName =
  | "heart" | "users" | "globe" | "mapPin" | "calendar" | "search"
  | "award" | "shield" | "clock" | "arrowRight" | "check"
  | "building" | "sparkles" | "verified" | "mail" | "phone"
  | "instagram" | "linkedin" | "facebook" | "menu" | "close"
  | "rocket" | "handshake" | "target" | "trending" | "searchCheck"
  | "fileCheck" | "ticket";

const ICONS: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  heart: Heart,
  users: Users,
  globe: Globe2,
  mapPin: MapPin,
  calendar: Calendar,
  search: Search,
  award: Award,
  shield: ShieldCheck,
  clock: Clock,
  arrowRight: ArrowRight,
  check: CheckCircle2,
  building: Building2,
  sparkles: Sparkles,
  verified: BadgeCheck,
  mail: Mail,
  phone: Phone,
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  menu: Menu,
  close: X,
  rocket: Rocket,
  handshake: Handshake,
  target: Target,
  trending: TrendingUp,
  searchCheck: SearchCheck,
  fileCheck: FileCheck2,
  ticket: Ticket,
};

export type IconProps = SVGProps<SVGSVGElement> & { name: IconName };

export function Icon({ name, className = "h-5 w-5", ...rest }: IconProps) {
  const C = ICONS[name];
  return <C aria-hidden="true" className={className} strokeWidth={1.9} {...rest} />;
}

export type MotifProps = SVGProps<SVGSVGElement>;

export function SmileMotif({ className = "h-5 w-5", ...rest }: MotifProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true" {...rest}>
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

export function HandsMotif({ className = "h-5 w-5", ...rest }: MotifProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true" {...rest}>
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

export function GlobeMotif({ className = "h-5 w-5", ...rest }: MotifProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true" {...rest}>
      <circle cx="32" cy="32" r="30" fill="currentColor" />
      <ellipse cx="32" cy="32" rx="13" ry="30" stroke="var(--color-ink)" strokeWidth="4" />
      <path d="M2 32h60M7 17h50M7 47h50" stroke="var(--color-ink)" strokeWidth="4" />
    </svg>
  );
}

export {
  Heart,
  Users,
  Globe2,
  MapPin,
  Calendar,
  Search,
  Award,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
  BadgeCheck,
  Mail,
  Phone,
  Instagram,
  Linkedin,
  Facebook,
  Menu as IconMenu,
  X as IconClose,
  Rocket,
  Handshake,
  Target,
  TrendingUp,
  SearchCheck,
  FileCheck2,
  Ticket,
};


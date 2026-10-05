import { BadgeCheck, HeartHandshake, Earth } from "lucide-react";

type IconProps = { className?: string };

export function SmileMotif({ className }: IconProps) {
  return <BadgeCheck className={className} strokeWidth={1.8} aria-hidden="true" />;
}
export function HandsMotif({ className }: IconProps) {
  return <HeartHandshake className={className} strokeWidth={1.8} aria-hidden="true" />;
}
export function GlobeMotif({ className }: IconProps) {
  return <Earth className={className} strokeWidth={1.8} aria-hidden="true" />;
}

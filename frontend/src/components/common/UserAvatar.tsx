/**
 * UserAvatar — affiche la photo de profil Cloudinary si disponible,
 * sinon les initiales de l'utilisateur sur fond mustard (bénévole)
 * ou emerald (association).
 */
import { useState } from "react";
import { type UserProfile, getInitial } from "@/context/AuthContext";

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

const shadowClasses: Record<Size, string> = {
  sm: "shadow-[2px_2px_0_var(--color-ink)]",
  md: "shadow-[3px_3px_0_var(--color-ink)]",
  lg: "shadow-[4px_4px_0_var(--color-ink)]",
};

type Props = {
  user: UserProfile | null;
  size?: Size;
  className?: string;
  onClick?: () => void;
};

export function UserAvatar({ user, size = "md", className = "", onClick }: Props) {
  const [imgError, setImgError] = useState(false);

  const initial   = getInitial(user);
  const photoUrl  = user?.photoUrl;
  const isAsso    = user?.role === "ASSOCIATION";
  const bgColor   = isAsso ? "bg-emerald" : "bg-mustard";
  const textColor = isAsso ? "text-emerald-foreground" : "text-ink";

  const showPhoto = photoUrl && !imgError;

  const base = `
    relative flex shrink-0 items-center justify-center
    rounded-full border-2 border-ink overflow-hidden
    font-extrabold uppercase select-none
    ${sizeClasses[size]}
    ${shadowClasses[size]}
    ${showPhoto ? "" : `${bgColor} ${textColor}`}
    ${onClick ? "cursor-pointer transition-opacity hover:opacity-90 press" : ""}
    ${className}
  `.replace(/\s+/g, " ").trim();

  return (
    <button
      type="button"
      className={base}
      onClick={onClick}
      aria-label={user ? `Avatar de ${user.prenom ?? user.nomAssociation ?? user.email}` : "Avatar"}
      disabled={!onClick}
      style={!onClick ? { cursor: "default" } : undefined}
    >
      {showPhoto ? (
        <img
          src={photoUrl}
          alt={initial}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </button>
  );
}

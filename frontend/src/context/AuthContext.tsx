import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserProfile = {
  id?: number;
  email: string;
  nom?: string;
  prenom?: string;
  nomAssociation?: string;
  role?: "BENEVOLE" | "ASSOCIATION" | "ADMIN";
  photoUrl?: string;     // photo bénévole ou logo association (URL Cloudinary)
  photoProfil?: string;  // alias retourné par le backend
  logoUrl?: string;      // alias logo association
  ville?: string;
  telephone?: string;
};

type AuthContextType = {
  user: UserProfile | null;
  token: string | null;
  loginUser: (user: UserProfile, token: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<UserProfile>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem("countmein_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("countmein_token") || null;
  });

  const loginUser = (newUser: UserProfile, newToken: string) => {
    // Normaliser : s'assurer que photoUrl est toujours rempli
    // (le backend retourne "photoProfil", certains endroits utilisent "logoUrl")
    const normalized: UserProfile = {
      ...newUser,
      photoUrl: newUser.photoUrl || newUser.photoProfil || newUser.logoUrl || "",
    };
    setUser(normalized);
    setToken(newToken);
    localStorage.setItem("countmein_user", JSON.stringify(normalized));
    localStorage.setItem("countmein_token", newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("countmein_user");
    localStorage.removeItem("countmein_token");
  };

  const updateUser = (partial: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: UserProfile = {
        ...prev,
        ...partial,
        photoUrl: partial.photoUrl ?? partial.photoProfil ?? prev.photoUrl ?? "",
      };
      localStorage.setItem("countmein_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function getInitial(user: UserProfile | null): string {
  if (!user) return "?";
  if (user.nomAssociation) {
    return user.nomAssociation.charAt(0).toUpperCase();
  }
  if (user.prenom) {
    return user.prenom.charAt(0).toUpperCase();
  }
  if (user.nom) {
    return user.nom.charAt(0).toUpperCase();
  }
  return user.email.charAt(0).toUpperCase();
}

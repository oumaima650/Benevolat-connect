import { createContext, useContext, useState, type ReactNode } from "react";

type ModalType =
  | "login"
  | "register-benevole"
  | "register-association"
  | "forgot-password"
  | "reset-password"
  | null;

type AuthModalContextType = {
  modal: ModalType;
  resetToken: string | null;
  openLogin: () => void;
  openRegisterBenevole: () => void;
  openRegisterAssociation: () => void;
  openForgotPassword: () => void;
  openResetPassword: (token: string) => void;
  closeModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalType>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  return (
    <AuthModalContext.Provider
      value={{
        modal,
        resetToken,
        openLogin: () => setModal("login"),
        openRegisterBenevole: () => setModal("register-benevole"),
        openRegisterAssociation: () => setModal("register-association"),
        openForgotPassword: () => setModal("forgot-password"),
        openResetPassword: (token) => { setResetToken(token); setModal("reset-password"); },
        closeModal: () => { setModal(null); setResetToken(null); },
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

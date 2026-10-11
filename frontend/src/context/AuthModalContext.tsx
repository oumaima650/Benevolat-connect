import { createContext, useContext, useState, type ReactNode } from "react";

type ModalType = "login" | "register-benevole" | "register-association" | null;

type AuthModalContextType = {
  modal: ModalType;
  openLogin: () => void;
  openRegisterBenevole: () => void;
  openRegisterAssociation: () => void;
  closeModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <AuthModalContext.Provider
      value={{
        modal,
        openLogin: () => setModal("login"),
        openRegisterBenevole: () => setModal("register-benevole"),
        openRegisterAssociation: () => setModal("register-association"),
        closeModal: () => setModal(null),
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

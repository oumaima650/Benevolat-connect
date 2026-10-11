import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterBenevoleModal } from "@/components/auth/RegisterBenevoleModal";
import { RegisterAssociationModal } from "@/components/auth/RegisterAssociationModal";

export function AuthModals() {
  return (
    <>
      <LoginModal />
      <RegisterBenevoleModal />
      <RegisterAssociationModal />
    </>
  );
}

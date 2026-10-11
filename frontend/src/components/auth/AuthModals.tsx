import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterBenevoleModal } from "@/components/auth/RegisterBenevoleModal";
import { RegisterAssociationModal } from "@/components/auth/RegisterAssociationModal";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { ResetPasswordModal } from "@/components/auth/ResetPasswordModal";

export function AuthModals() {
  return (
    <>
      <LoginModal />
      <RegisterBenevoleModal />
      <RegisterAssociationModal />
      <ForgotPasswordModal />
      <ResetPasswordModal />
    </>
  );
}

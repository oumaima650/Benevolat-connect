import { useEffect, useState } from "react";
import { NOTIFICATIONS_CHANGED, notificationApi } from "@/services/notificationApi";

/**
 * Nombre de notifications non lues de l'utilisateur connecté (badges des layouts).
 * Rafraîchi toutes les 30 s, au retour sur l'onglet et après chaque action du centre de notifications.
 */
export function useUnreadNotifications(enabled = true): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let actif = true;
    const charger = () =>
      notificationApi
        .compterNonLues()
        .then((n) => actif && setCount(n))
        .catch(() => {});

    charger();
    const timer = window.setInterval(charger, 30_000);
    window.addEventListener(NOTIFICATIONS_CHANGED, charger);
    window.addEventListener("focus", charger);
    return () => {
      actif = false;
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_CHANGED, charger);
      window.removeEventListener("focus", charger);
    };
  }, [enabled]);

  return count;
}

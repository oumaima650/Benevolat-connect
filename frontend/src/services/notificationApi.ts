import { apiRequest } from "./http";

/** Catégories d'événements (miroir de l'enum backend CategorieNotif). */
export type CategorieNotif =
  | "INSCRIPTION"
  | "LISTE_ATTENTE"
  | "PROMOTION"
  | "ANNULATION"
  | "MISSION_MODIFIEE"
  | "MISSION_ANNULEE"
  | "RENFORT"
  | "RAPPEL"
  | "CERTIFICAT"
  | "VALIDATION"
  | "COMPTE"
  | "MODERATION"
  | "SYSTEME";

export type NotificationItem = {
  id: number;
  categorie: CategorieNotif;
  titre: string;
  message: string;
  lien: string | null;
  lue: boolean;
  date: string;
};

/** Préférence unique (F31) : e-mails activés ou non. */
export type NotificationPrefs = {
  emailActif: boolean;
};

/** Événement navigateur émis quand le nombre de non lues change (rafraîchit les badges). */
export const NOTIFICATIONS_CHANGED = "countmein:notifications-changed";

export function signalerChangementNotifications() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

export const notificationApi = {
  lister: () => apiRequest<NotificationItem[]>("/api/notifications"),

  compterNonLues: () =>
    apiRequest<{ count: number }>("/api/notifications/non-lues/count").then((r) => r.count),

  marquerLue: (id: number) => apiRequest<void>(`/api/notifications/${id}/lue`, { method: "PATCH" }),

  marquerToutesLues: () => apiRequest<void>("/api/notifications/lire-tout", { method: "PATCH" }),

  supprimer: (id: number) => apiRequest<void>(`/api/notifications/${id}`, { method: "DELETE" }),

  getPreferences: () => apiRequest<NotificationPrefs>("/api/notifications/preferences"),

  majPreferences: (prefs: NotificationPrefs) =>
    apiRequest<NotificationPrefs>("/api/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(prefs),
    }),
};

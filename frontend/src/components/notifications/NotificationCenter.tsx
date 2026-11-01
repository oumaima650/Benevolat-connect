import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Award, Bell, CalendarClock, CheckCheck, CheckCircle2, Clock, Flag, Hourglass, Loader2,
  PartyPopper, ShieldCheck, Siren, Trash2, Trophy, UserCog, UserMinus, XCircle, type LucideIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  notificationApi, signalerChangementNotifications,
  type CategorieNotif, type NotificationItem, type NotificationPrefs,
} from "@/services/notificationApi";

const STYLE: Record<CategorieNotif, { icon: LucideIcon; classe: string }> = {
  INSCRIPTION: { icon: CheckCircle2, classe: "bg-emerald/15 text-emerald" },
  LISTE_ATTENTE: { icon: Hourglass, classe: "bg-mustard/30 text-ink" },
  PROMOTION: { icon: PartyPopper, classe: "bg-emerald/15 text-emerald" },
  ANNULATION: { icon: UserMinus, classe: "bg-red-100 text-red-700" },
  MISSION_MODIFIEE: { icon: CalendarClock, classe: "bg-blue-100 text-blue-700" },
  MISSION_ANNULEE: { icon: XCircle, classe: "bg-red-100 text-red-700" },
  RENFORT: { icon: Siren, classe: "bg-pink/20 text-ink" },
  RAPPEL: { icon: Clock, classe: "bg-mustard/30 text-ink" },
  CERTIFICAT: { icon: Award, classe: "bg-emerald/15 text-emerald" },
  VALIDATION: { icon: ShieldCheck, classe: "bg-blue-100 text-blue-700" },
  COMPTE: { icon: UserCog, classe: "bg-muted text-ink" },
  MODERATION: { icon: Flag, classe: "bg-red-100 text-red-700" },
  GAMIFICATION: { icon: Trophy, classe: "bg-mustard/40 text-ink" },
  SYSTEME: { icon: Bell, classe: "bg-muted text-ink" },
};

function dateRelative(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 7 * 86400) return `il y a ${Math.floor(diff / 86400)} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function NotifItem({
  n, onOpen, onRead, onDelete,
}: {
  n: NotificationItem;
  onOpen: (n: NotificationItem) => void;
  onRead: (n: NotificationItem) => void;
  onDelete: (n: NotificationItem) => void;
}) {
  const { icon: Icon, classe } = STYLE[n.categorie] ?? STYLE.SYSTEME;
  return (
    <div
      className={`group flex items-start gap-3 rounded-2xl border-2 border-ink p-4 shadow-[3px_3px_0_var(--color-ink)] transition-colors ${
        n.lue ? "bg-paper" : "bg-emerald/10"
      } ${n.lien ? "cursor-pointer hover:bg-muted" : ""}`}
      onClick={() => n.lien && onOpen(n)}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink ${classe}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-ink">{n.titre}</p>
          {!n.lue && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border border-ink bg-pink" aria-label="Non lue" />}
        </div>
        <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">{n.message}</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{dateRelative(n.date)}</p>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {!n.lue && (
              <button onClick={() => onRead(n)}
                className="text-xs font-semibold text-ink underline underline-offset-2 hover:text-emerald">
                Marquer comme lue
              </button>
            )}
            <button onClick={() => onDelete(n)} aria-label="Supprimer la notification"
              className="rounded-md p-1 text-muted-foreground opacity-60 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Centre de notifications (F30) + préférences e-mail (F31), partagé par les espaces
 * bénévole, association et administrateur.
 */
export function NotificationCenter({ avecPreferences = false }: { avecPreferences?: boolean }) {
  const router = useRouter();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    notificationApi.lister()
      .then(setNotifs)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
    if (avecPreferences) {
      notificationApi.getPreferences().then(setPrefs).catch(() => {});
    }
  }, [avecPreferences]);

  const nonLues = useMemo(() => notifs.filter((n) => !n.lue), [notifs]);

  async function marquerLue(n: NotificationItem) {
    setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, lue: true } : x)));
    await notificationApi.marquerLue(n.id).catch(() => {});
    signalerChangementNotifications();
  }

  async function ouvrir(n: NotificationItem) {
    if (!n.lue) await marquerLue(n);
    if (n.lien) router.history.push(n.lien);
  }

  async function toutLire() {
    setNotifs((prev) => prev.map((x) => ({ ...x, lue: true })));
    await notificationApi.marquerToutesLues().catch((e) => toast.error(e.message));
    signalerChangementNotifications();
  }

  async function supprimer(n: NotificationItem) {
    setNotifs((prev) => prev.filter((x) => x.id !== n.id));
    await notificationApi.supprimer(n.id).catch((e) => toast.error(e.message));
    signalerChangementNotifications();
  }

  async function majPrefs(next: NotificationPrefs) {
    const avant = prefs;
    setPrefs(next);
    try {
      setPrefs(await notificationApi.majPreferences(next));
      toast.success("Préférences enregistrées.");
    } catch (e: any) {
      setPrefs(avant);
      toast.error(e.message);
    }
  }

  const liste = (items: NotificationItem[], vide: string) =>
    items.length === 0 ? (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink/30 py-14 text-center">
        <Bell className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="font-semibold text-ink">{vide}</p>
        <p className="text-sm text-muted-foreground">Vous êtes à jour !</p>
      </div>
    ) : (
      items.map((n) => <NotifItem key={n.id} n={n} onOpen={ouvrir} onRead={marquerLue} onDelete={supprimer} />)
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {nonLues.length} notification{nonLues.length > 1 ? "s" : ""} non lue{nonLues.length > 1 ? "s" : ""}
          </p>
        </div>
        {nonLues.length > 0 && (
          <Button variant="outline" size="sm" onClick={toutLire}
            className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]">
            <CheckCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald" /></div>
      ) : (
        <Tabs defaultValue={nonLues.length > 0 ? "unread" : "all"}>
          <TabsList className="h-auto gap-1 rounded-xl border-2 border-ink bg-muted p-1">
            <TabsTrigger value="unread"
              className="rounded-lg data-[state=active]:bg-emerald data-[state=active]:font-bold data-[state=active]:text-emerald-foreground">
              Non lues ({nonLues.length})
            </TabsTrigger>
            <TabsTrigger value="all"
              className="rounded-lg data-[state=active]:bg-emerald data-[state=active]:font-bold data-[state=active]:text-emerald-foreground">
              Toutes ({notifs.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="unread" className="mt-4 space-y-3">{liste(nonLues, "Aucune notification non lue")}</TabsContent>
          <TabsContent value="all" className="mt-4 space-y-3">{liste(notifs, "Aucune notification pour le moment")}</TabsContent>
        </Tabs>
      )}

      {avecPreferences && prefs && (
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="pref-email" className="cursor-pointer font-display font-bold text-ink">
                Recevoir les notifications par e-mail
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Toutes les notifications restent visibles ici. Les messages importants
                (annulation de mission, validation, sécurité du compte) sont toujours envoyés.
              </p>
            </div>
            <Switch id="pref-email" checked={prefs.emailActif}
              onCheckedChange={(v) => majPrefs({ emailActif: v })} />
          </div>
        </div>
      )}
    </div>
  );
}

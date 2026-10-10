import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { NotificationDash } from '@/components/dashboard/data';

export const Route = createFileRoute('/association/notifications')({
  component: NotificationsAssociation,
});

const NOTIFS_ASSO: NotificationDash[] = [
  {
    id: 'na1',
    type: 'CONFIRMATION',
    titre: 'Nouvelle inscription',
    message: 'Yasmine El Idrissi s\'est inscrite à la mission "Collecte de vêtements d\'hiver".',
    lu: false,
    date: '2026-09-12T10:00:00',
  },
  {
    id: 'na2',
    type: 'RENFORT_URGENT',
    titre: 'Mission complète',
    message: 'La mission "Distribution de repas solidaires" a atteint sa capacité maximale.',
    lu: false,
    date: '2026-09-14T09:30:00',
  },
  {
    id: 'na3',
    type: 'PROMOTION',
    titre: 'Validation en attente',
    message: 'Votre demande de publication de la mission "Atelier numérique" est en cours de validation.',
    lu: true,
    date: '2026-09-10T14:00:00',
  },
  {
    id: 'na4',
    type: 'RAPPEL',
    titre: 'Mission dans 24h',
    message: 'La mission "Plantation d\'arbres en forêt de Bouhachem" commence demain.',
    lu: true,
    date: '2026-10-02T09:00:00',
  },
  {
    id: 'na5',
    type: 'ANNULATION',
    titre: 'Inscription annulée',
    message: 'Karim Benjelloun a annulé son inscription à "Distribution de repas solidaires".',
    lu: true,
    date: '2026-09-08T11:00:00',
  },
  {
    id: 'na6',
    type: 'CONFIRMATION',
    titre: 'Renfort obtenu',
    message: '3 nouveaux bénévoles ont rejoint la mission "Collecte de vêtements d\'hiver" en renfort urgent.',
    lu: true,
    date: '2026-09-11T16:30:00',
  },
];

const typeIcons: Record<NotificationDash['type'], string> = {
  CONFIRMATION: '✅',
  PROMOTION: '🎉',
  ANNULATION: '❌',
  RAPPEL: '⏰',
  RENFORT_URGENT: '🚨',
};

const typeColors: Record<NotificationDash['type'], string> = {
  CONFIRMATION: 'bg-green-100 text-green-700 border-green-200',
  PROMOTION: 'bg-blue-100 text-blue-700 border-blue-200',
  ANNULATION: 'bg-red-100 text-red-700 border-red-200',
  RAPPEL: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  RENFORT_URGENT: 'bg-red-200 text-red-800 border-red-300',
};

function NotifItem({ n, onMarkRead }: { n: NotificationDash; onMarkRead: (id: string) => void }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border-2 border-ink p-4 shadow-[3px_3px_0_var(--color-ink)] ${
        n.lu ? 'bg-paper' : 'bg-emerald/10'
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${typeColors[n.type]}`}
        aria-hidden="true"
      >
        {typeIcons[n.type]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-ink">{n.titre}</p>
          {!n.lu && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Non lue" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {new Date(n.date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {!n.lu && (
            <button
              onClick={() => onMarkRead(n.id)}
              className="text-xs font-semibold text-ink underline underline-offset-2 hover:text-emerald"
            >
              Marquer comme lue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationsAssociation() {
  const [notifs, setNotifs] = useState<NotificationDash[]>(NOTIFS_ASSO);
  const [prefs, setPrefs] = useState({
    CONFIRMATION: true,
    PROMOTION: true,
    RAPPEL: true,
    ANNULATION: true,
    RENFORT_URGENT: true,
  });

  const nonLues = notifs.filter((n) => !n.lu);

  function markRead(id: string) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, lu: true } : n)));
  }

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, lu: true })));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {nonLues.length} notification{nonLues.length > 1 ? 's' : ''} non lue
            {nonLues.length > 1 ? 's' : ''}
          </p>
        </div>
        {nonLues.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)]"
          >
            <CheckCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="h-auto gap-1 rounded-xl border-2 border-ink bg-muted p-1">
          <TabsTrigger
            value="unread"
            className="rounded-lg data-[state=active]:bg-emerald data-[state=active]:font-bold data-[state=active]:text-emerald-foreground"
          >
            Non lues ({nonLues.length})
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-lg data-[state=active]:bg-emerald data-[state=active]:font-bold data-[state=active]:text-emerald-foreground"
          >
            Toutes ({notifs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-4 space-y-3">
          {nonLues.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="font-semibold text-ink">Aucune notification non lue</p>
              <p className="text-sm text-muted-foreground">Vous êtes à jour !</p>
            </div>
          ) : (
            nonLues.map((n) => <NotifItem key={n.id} n={n} onMarkRead={markRead} />)
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-3">
          {notifs.map((n) => (
            <NotifItem key={n.id} n={n} onMarkRead={markRead} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Préférences */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <h2 className="font-display mb-4 font-bold text-ink">Préférences de notification</h2>
        <div className="space-y-4">
          {(
            [
              { key: 'CONFIRMATION', label: 'Nouvelles inscriptions' },
              { key: 'PROMOTION', label: 'Promotions / validations' },
              { key: 'RAPPEL', label: 'Rappels avant mission' },
              { key: 'ANNULATION', label: 'Annulations d\'inscription' },
              { key: 'RENFORT_URGENT', label: 'Alertes capacité / renfort' },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={`pref-asso-${key}`} className="cursor-pointer text-sm font-medium text-ink">
                {label}
              </Label>
              <Switch
                id={`pref-asso-${key}`}
                checked={prefs[key]}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

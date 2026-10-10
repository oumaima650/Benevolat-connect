import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { CheckCircle, Star, Award, Clock, CalendarDays, MapPin, Bell, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  missions,
  notifications,
  inscriptionsBenevole,
  formaterDate,
  prochainNiveau,
} from '@/components/dashboard/data';

export const Route = createFileRoute('/benevole/')({
  component: BenevoleDashboard,
});

const donutData = [
  { name: 'Solidarité', value: 1, fill: '#ec4899' },
  { name: 'Environnement', value: 1, fill: '#10b981' },
  { name: 'Sport', value: 1, fill: '#f59e0b' },
];

function BenevoleDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const niveauInfo = prochainNiveau(3);
  const progressPct = Math.round((niveauInfo.actuel / niveauInfo.suivant) * 100);

  const prochainesMissions = missions
    .filter((m) => m.statut === 'PUBLIEE' || m.statut === 'EN_COURS')
    .slice(0, 2);

  const enAttente = inscriptionsBenevole.filter((i) => i.statut === 'EN_LISTE_ATTENTE');
  const dernieresNotifs = notifications.slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Bonjour, Yasmine 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">Voici un aperçu de votre activité bénévole.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Missions réalisées" value="3" icon={CheckCircle} colorClass="text-mustard" />
        <KpiCard label="Niveau actuel" value="Engagé" icon={Star} colorClass="text-pink" />
        <KpiCard label="Badges obtenus" value="2" icon={Award} colorClass="text-emerald" />
        <KpiCard label="En liste d'attente" value="2" icon={Clock} colorClass="text-muted-foreground" />
      </div>

      {/* Level progress */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-mustard" aria-hidden="true" />
            <h2 className="font-display font-bold text-ink">Progression de niveau</h2>
          </div>
          <span className="rounded-full border-2 border-ink bg-mustard px-3 py-0.5 text-xs font-bold text-ink">
            Engagé
          </span>
        </div>
        <Progress value={progressPct} className="h-3" />
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-semibold text-ink">
            {niveauInfo.actuel} / {niveauInfo.suivant} missions
          </span>{' '}
          pour atteindre le niveau{' '}
          <span className="font-bold text-pink">{niveauInfo.label}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Prochaines missions */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display font-bold text-ink mb-3">Prochaines missions</h2>
          <ul className="space-y-3">
            {prochainesMissions.map((m) => (
              <li key={m.id} className="rounded-xl border-2 border-ink bg-muted p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink leading-tight">{m.titre}</p>
                  <StatusBadge statut={m.statut} />
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" aria-hidden="true" /> {m.ville}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3" aria-hidden="true" /> {formaterDate(m.dateDebut)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Liste d'attente */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display font-bold text-ink mb-3">Ma liste d'attente</h2>
          {enAttente.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune inscription en attente.</p>
          ) : (
            <ul className="space-y-3">
              {enAttente.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between rounded-xl border-2 border-ink bg-muted p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink leading-tight">{i.missionTitre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{i.ville}</p>
                  </div>
                  <span className="shrink-0 rounded-full border-2 border-orange-400 bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                    Rang {i.rang}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dernières notifs */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display font-bold text-ink mb-3">Dernières notifications</h2>
          <ul className="space-y-3">
            {dernieresNotifs.map((n) => {
              const iconColors: Record<typeof n.type, string> = {
                CONFIRMATION: 'bg-green-100 text-green-700',
                PROMOTION: 'bg-blue-100 text-blue-700',
                ANNULATION: 'bg-red-100 text-red-700',
                RAPPEL: 'bg-yellow-100 text-yellow-700',
                RENFORT_URGENT: 'bg-red-200 text-red-800',
              };
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 rounded-xl p-3 ${
                    n.lu ? 'bg-muted' : 'bg-mustard/20 border border-mustard'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${iconColors[n.type]}`}
                  >
                    <Bell className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink">{n.titre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Doughnut chart */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <h2 className="font-display font-bold text-ink mb-4">Missions réalisées par domaine</h2>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                strokeWidth={2}
                stroke="oklch(0.16 0 0)"
              >
                {donutData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} mission${value > 1 ? 's' : ''}`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-3">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full border border-ink"
                  style={{ backgroundColor: d.fill }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-ink">{d.name}</span>
                <span className="text-sm text-muted-foreground">{d.value} mission</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

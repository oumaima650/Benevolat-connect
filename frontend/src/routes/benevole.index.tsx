import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  CheckCircle, Star, Award, Clock,
  CalendarDays, MapPin, Bell, TrendingUp,
  ArrowUpRight, Flame, Hand,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend,
} from 'recharts';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@tanstack/react-router';
import { formaterDate } from '@/components/dashboard/data';
import { useAuth } from '@/context/AuthContext';
import { benevoleApi, ApiHttpError, type BenevoleDashboardData } from '@/services/benevoleApi';
import { toast } from 'sonner';

function emptyDashboard(prenom: string): BenevoleDashboardData {
  return {
    prenom: prenom || 'bénévole',
    missionsRealisees: 0,
    niveauActuel: 'Débutant',
    badgesObtenus: 0,
    enListeAttenteCount: 0,
    progressPct: 0,
    missionsPourSuivant: 0,
    missionsTotalPourSuivant: 5,
    prochainNiveauLabel: 'Engagé',
    prochainesMissions: [],
    listeAttente: [],
    dernieresNotifications: [],
    activiteMensuelle: [],
    missionsParDomaine: [],
  };
}

export const Route = createFileRoute('/benevole/')({
  component: BenevoleDashboard,
});

/* ── tooltip personnalisé ── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border-2 border-ink bg-paper px-3 py-2 shadow-[3px_3px_0_var(--color-ink)] text-xs">
      <p className="font-bold text-ink mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name} : <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function BenevoleDashboard() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<BenevoleDashboardData | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setLoadError('Session expirée. Reconnectez-vous pour charger votre tableau de bord.');
      setData(emptyDashboard(user?.prenom ?? 'bénévole'));
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    benevoleApi.getDashboardData(token)
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des données.';
        console.error(err);

        // JWT absent, invalide ou rôle incorrect (ex. ancien faux token de la page démo) :
        // on purge la session et on renvoie vers la connexion.
        if (err instanceof ApiHttpError && (err.status === 401 || err.status === 403)) {
          logout();
          toast.error(message);
          void navigate({ to: '/login' });
          return;
        }

        setLoadError(message);
        setData(emptyDashboard(user?.prenom ?? 'bénévole'));
        toast.error(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, user?.prenom, reloadKey, logout, navigate]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const scoreNiveau = [
    { name: 'Progression', value: data.progressPct, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-2xl border-2 border-ink bg-mustard/20 p-4 shadow-[3px_3px_0_var(--color-ink)]">
          <p className="text-sm font-semibold text-ink">{loadError}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Le tableau de bord appelle <code>GET /api/benevoles/me/dashboard</code> sur le backend (port 8080).
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="press mt-3 inline-flex items-center rounded-xl border-2 border-ink bg-paper px-3 py-1.5 text-xs font-bold text-ink shadow-[2px_2px_0_var(--color-ink)]"
          >
            Réessayer
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink inline-flex items-center gap-2">
            Bonjour, {data.prenom} <Hand className="h-6 w-6 text-mustard" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Voici un aperçu de votre activité bénévole.</p>
        </div>
        <Link
          to="/benevole/explorer"
          className="press inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-pink px-4 py-2.5 text-sm font-bold text-pink-foreground shadow-[3px_3px_0_var(--color-ink)]"
        >
          Explorer les missions <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Missions réalisées" value={data.missionsRealisees.toString()} icon={CheckCircle} colorClass="text-mustard" />
        <KpiCard label="Niveau actuel"       value={data.niveauActuel}             icon={Star}         colorClass="text-pink" />
        <KpiCard label="Badges obtenus"      value={data.badgesObtenus.toString()} icon={Award}        colorClass="text-emerald" />
        <KpiCard label="En liste d'attente"  value={data.enListeAttenteCount.toString()} icon={Clock}  colorClass="text-muted-foreground" />
      </div>

      {/* Progression niveau avec jauge radiale */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Jauge */}
          <div className="flex items-center justify-center">
            <div className="relative h-28 w-28">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="65%"
                  outerRadius="100%"
                  data={scoreNiveau}
                  startAngle={220}
                  endAngle={-40}
                  barSize={10}
                >
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f3f4f6' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-ink">{data.progressPct}%</span>
                <span className="text-[10px] text-muted-foreground">niveau</span>
              </div>
            </div>
          </div>
          {/* Texte */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-mustard" />
              <h2 className="font-display font-bold text-ink">Progression de niveau</h2>
              <span className="rounded-full border-2 border-ink bg-mustard px-3 py-0.5 text-xs font-bold text-ink">
                {data.niveauActuel}
              </span>
            </div>
            <Progress value={data.progressPct} className="h-3 mb-2" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-ink">{data.missionsPourSuivant} / {data.missionsTotalPourSuivant} missions</span>{' '}
              pour atteindre le niveau{' '}
              <span className="font-bold text-pink">{data.prochainNiveauLabel}</span>
            </p>
            <div className="mt-3 flex gap-2 text-xs">
              {[
                { label: 'Débutant',  current: data.niveauActuel === 'Débutant' },
                { label: 'Engagé',    current: data.niveauActuel === 'Engagé' },
                { label: 'Expert',    current: data.niveauActuel === 'Expert' },
                { label: 'Champion',  current: data.niveauActuel === 'Champion' },
              ].map((n) => (
                <span
                  key={n.label}
                  className={`rounded-full px-2 py-0.5 border font-medium ${
                    n.current
                      ? 'border-ink bg-mustard text-ink font-bold'
                      : 'border-border bg-muted text-muted-foreground'
                  }`}
                >
                  {n.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ligne 3 colonnes */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Prochaines missions */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display font-bold text-ink mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-pink" /> Prochaines missions
          </h2>
          <ul className="space-y-2">
            {data.prochainesMissions.map((m) => (
              <li key={m.id} className="rounded-xl border-2 border-ink bg-muted p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-ink leading-tight line-clamp-1">{m.titre}</p>
                  <StatusBadge statut={m.statut as any} />
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {m.ville} · {formaterDate(m.dateDebut)}
                </p>
              </li>
            ))}
            {data.prochainesMissions.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune mission à venir.</p>
            )}
          </ul>
          <Link to="/benevole/explorer" className="mt-3 flex items-center gap-1 text-xs font-semibold text-pink hover:underline">
            Voir toutes les missions <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Liste d'attente */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display font-bold text-ink mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" /> Liste d'attente
          </h2>
          {data.listeAttente.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune inscription en attente.</p>
          ) : (
            <ul className="space-y-2">
              {data.listeAttente.map((i) => (
                <li key={i.idInscription} className="flex items-center justify-between rounded-xl border-2 border-ink bg-muted p-3">
                  <div>
                    <p className="text-sm font-semibold text-ink leading-tight line-clamp-1">{i.missionTitre}</p>
                    <p className="text-xs text-muted-foreground">{i.ville}</p>
                  </div>
                  <span className="shrink-0 rounded-full border-2 border-orange-400 bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">
                    Rang {i.rang}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/benevole/parcours" className="mt-3 flex items-center gap-1 text-xs font-semibold text-pink hover:underline">
            Mon parcours <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display font-bold text-ink mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-500" /> Dernières notifications
          </h2>
          <ul className="space-y-2">
            {data.dernieresNotifications.map((n) => {
              const colors: Record<string, string> = {
                INSCRIPTION:     'bg-green-100 text-green-700 border-green-300',
                LISTE_ATTENTE:   'bg-yellow-100 text-yellow-700 border-yellow-300',
                PROMOTION:       'bg-blue-100 text-blue-700 border-blue-300',
                ANNULATION:      'bg-red-100 text-red-700 border-red-300',
                MISSION_ANNULEE: 'bg-red-100 text-red-700 border-red-300',
                RAPPEL:          'bg-yellow-100 text-yellow-700 border-yellow-300',
                RENFORT:         'bg-red-200 text-red-800 border-red-400',
                CERTIFICAT:      'bg-green-100 text-green-700 border-green-300',
              };
              return (
                <li key={n.id} className={`rounded-xl border p-3 text-xs ${n.lue ? 'bg-muted border-border' : 'bg-mustard/15 border-mustard'}`}>
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold mb-1 ${colors[n.categorie] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                    {(n.categorie || 'INFO').replaceAll('_', ' ')}
                  </span>
                  <p className="font-semibold text-ink line-clamp-2">{n.message}</p>
                </li>
              );
            })}
            {data.dernieresNotifications.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune notification.</p>
            )}
          </ul>
          <Link to="/benevole/notifications" className="mt-3 flex items-center gap-1 text-xs font-semibold text-pink hover:underline">
            Toutes les notifications <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Graphiques — ligne */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Activité mensuelle — grouped bar */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-4 w-4 text-pink" />
            <h2 className="font-display font-bold text-ink">Activité mensuelle</h2>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data.activiteMensuelle} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="inscriptions" name="Inscriptions" fill="oklch(0.7 0.16 355)" radius={[4, 4, 0, 0]} stroke="oklch(0.16 0 0)" strokeWidth={1} />
              <Bar dataKey="certifs"      name="Certificats"  fill="oklch(0.54 0.14 156)" radius={[4, 4, 0, 0]} stroke="oklch(0.16 0 0)" strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Doughnut domaines */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-mustard" />
            <h2 className="font-display font-bold text-ink">Missions par domaine</h2>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <PieChart width={180} height={180}>
              <Pie
                data={data.missionsParDomaine}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                dataKey="value"
                paddingAngle={4}
                strokeWidth={2}
                stroke="oklch(0.16 0 0)"
              >
                {data.missionsParDomaine.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} mission`, '']} />
            </PieChart>
            <div className="flex flex-col gap-3 flex-1">
              {data.missionsParDomaine.map((d) => (
                <div key={d.name} className="flex items-center justify-between gap-2 rounded-lg border-2 border-ink bg-muted px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border border-ink shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-sm font-medium text-ink">{d.name}</span>
                  </div>
                  <span className="rounded-full border border-ink bg-paper px-2 text-xs font-bold text-ink">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

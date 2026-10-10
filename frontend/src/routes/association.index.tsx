import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Target, Users, CheckCircle, Clock, FileText,
  ClipboardCheck, AlertCircle, TrendingUp, ArrowUpRight,
  BarChart2, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid,
  AreaChart, Area, Legend, RadialBarChart, RadialBar,
} from 'recharts';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@tanstack/react-router';

export const Route = createFileRoute('/association/')({
  component: AssociationDashboard,
});

/* ── données ── */
const fillData = [
  { mission: 'Distribution repas',   pct: 80, couleur: '#10b981' },
  { mission: 'Plantation arbres',    pct: 47, couleur: '#f59e0b' },
  { mission: 'Collecte vêtements',   pct: 38, couleur: '#f59e0b' },
  { mission: 'Atelier numérique',    pct: 12, couleur: '#ef4444' },
  { mission: 'Soutien scolaire',     pct: 100, couleur: '#10b981' },
  { mission: 'Animation jeunesse',   pct: 65, couleur: '#10b981' },
];

const inscriptionsData = [
  { semaine: 'S1', inscriptions: 4,  confirmees: 3 },
  { semaine: 'S2', inscriptions: 7,  confirmees: 6 },
  { semaine: 'S3', inscriptions: 5,  confirmees: 4 },
  { semaine: 'S4', inscriptions: 12, confirmees: 10 },
  { semaine: 'S5', inscriptions: 9,  confirmees: 7 },
  { semaine: 'S6', inscriptions: 15, confirmees: 13 },
  { semaine: 'S7', inscriptions: 11, confirmees: 9 },
  { semaine: 'S8', inscriptions: 18, confirmees: 15 },
];

const statutData = [
  { name: 'Publiée',       value: 3, fill: '#22c55e' },
  { name: 'En cours',      value: 1, fill: '#3b82f6' },
  { name: 'Terminée',      value: 2, fill: '#9ca3af' },
  { name: 'Renfort urgent',value: 1, fill: '#ef4444' },
  { name: 'Brouillon',     value: 1, fill: '#fde047' },
];

const tauxGlobal = [{ name: 'Remplissage', value: 62, fill: '#10b981' }];

const TODO_ITEMS = [
  {
    id: 't1',
    type: 'CERTIFICAT',
    label: 'Délivrer les certificats',
    mission: 'Marathon caritatif de Casablanca',
    icon: FileText,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    actionTo: '/association/certificats',
    actionLabel: 'Délivrer',
  },
  {
    id: 't2',
    type: 'CLOTURE',
    label: 'Clôturer la mission',
    mission: 'Distribution de repas solidaires',
    icon: ClipboardCheck,
    color: 'text-emerald bg-emerald/10 border-emerald/30',
    actionTo: '/association/missions',
    actionLabel: 'Clôturer',
  },
  {
    id: 't3',
    type: 'RENFORT',
    label: 'Répondre au besoin de renfort',
    mission: 'Collecte de vêtements d\'hiver',
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50 border-red-200',
    actionTo: '/association/renforts',
    actionLabel: 'Voir',
  },
];

/* ── tooltip ── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border-2 border-ink bg-paper px-3 py-2 shadow-[3px_3px_0_var(--color-ink)] text-xs">
      <p className="font-bold text-ink mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name} : <span className="font-semibold">{p.value}{p.unit ?? ''}</span>
        </p>
      ))}
    </div>
  );
}

/* ── barre colorée selon valeur ── */
const getBarColor = (pct: number) => {
  if (pct >= 80) return '#10b981';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
};

function AssociationDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bonjour, Association Nour. Voici votre activité.</p>
        </div>
        <Link
          to="/association/nouvelle-mission"
          className="press inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-emerald px-4 py-2.5 text-sm font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)]"
        >
          + Nouvelle mission
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Missions actives"    value="5"   icon={Target}      colorClass="text-emerald" />
        <KpiCard label="Taux de remplissage" value="62%" icon={CheckCircle} colorClass="text-mustard" />
        <KpiCard label="Inscrits confirmés"  value="28"  icon={Users}       colorClass="text-pink" />
        <KpiCard label="En liste d'attente"  value="17"  icon={Clock}       colorClass="text-muted-foreground" />
        <KpiCard label="Certificats délivrés"value="12"  icon={FileText}    colorClass="text-blue-500" />
      </div>

      {/* Taux global + À faire */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Jauge taux global */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] flex flex-col items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald" />
          <p className="font-display font-bold text-ink text-sm">Taux de remplissage global</p>
          <div className="relative h-32 w-32 mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="65%"
                outerRadius="100%"
                data={tauxGlobal}
                startAngle={220}
                endAngle={-40}
                barSize={12}
              >
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f3f4f6' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-ink">62%</span>
              <span className="text-[10px] text-muted-foreground">rempli</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Sur 5 missions actives</p>
        </div>

        {/* À faire — occupe 2 colonnes */}
        <div className="md:col-span-2 rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display mb-3 font-bold text-ink flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" /> À faire
          </h2>
          <ul className="space-y-2">
            {TODO_ITEMS.map((item) => (
              <li
                key={item.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${item.color}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper border border-current">
                  <item.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.mission}</p>
                </div>
                <Link
                  to={item.actionTo as any}
                  className="shrink-0 rounded-lg border-2 border-ink bg-paper px-3 py-1 text-xs font-bold text-ink hover:bg-muted shadow-[2px_2px_0_var(--color-ink)]"
                >
                  {item.actionLabel} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Graphiques — ligne 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* BarChart taux remplissage */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-emerald" />
            <h2 className="font-display font-bold text-ink">Taux de remplissage par mission</h2>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={fillData} margin={{ top: 0, right: 0, left: -20, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="mission"
                tick={{ fontSize: 10 }}
                angle={-35}
                textAnchor="end"
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pct" name="Remplissage" unit="%" radius={[6, 6, 0, 0]} stroke="oklch(0.16 0 0)" strokeWidth={1}>
                {fillData.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.pct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex gap-3 text-xs">
            {[['#10b981', '≥ 80%'], ['#f59e0b', '40–79%'], ['#ef4444', '< 40%']].map(([c, l]) => (
              <span key={l} className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full border border-ink" style={{ backgroundColor: c }} />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* AreaChart inscriptions */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-pink" />
            <h2 className="font-display font-bold text-ink">Inscriptions par semaine</h2>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={inscriptionsData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInscriptions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="oklch(0.7 0.16 355)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="oklch(0.7 0.16 355)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="colorConfirmees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="oklch(0.54 0.14 156)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="oklch(0.54 0.14 156)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="semaine" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="inscriptions"
                name="Inscriptions"
                stroke="oklch(0.7 0.16 355)"
                strokeWidth={2.5}
                fill="url(#colorInscriptions)"
                dot={{ fill: 'oklch(0.7 0.16 355)', r: 4, strokeWidth: 2, stroke: '#fff' }}
              />
              <Area
                type="monotone"
                dataKey="confirmees"
                name="Confirmées"
                stroke="oklch(0.54 0.14 156)"
                strokeWidth={2.5}
                fill="url(#colorConfirmees)"
                dot={{ fill: 'oklch(0.54 0.14 156)', r: 4, strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Graphiques — ligne 2 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Doughnut statuts */}
        <div className="md:col-span-1 rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display mb-4 font-bold text-ink flex items-center gap-2">
            <Target className="h-4 w-4 text-mustard" /> Répartition des statuts
          </h2>
          <div className="flex flex-col items-center gap-3">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={statutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={65}
                  dataKey="value"
                  paddingAngle={3}
                  strokeWidth={2}
                  stroke="oklch(0.16 0 0)"
                >
                  {statutData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'missions']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1.5">
              {statutData.map((d) => (
                <div key={d.name} className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-ink" style={{ backgroundColor: d.fill }} />
                    <span className="text-ink font-medium">{d.name}</span>
                  </div>
                  <span className="font-bold text-ink">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="md:col-span-2 rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display mb-4 font-bold text-ink flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-ink" /> Accès rapides
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mes missions',       to: '/association/missions',          bg: 'bg-emerald text-emerald-foreground',  icon: '📋' },
              { label: 'Nouvelle mission',   to: '/association/nouvelle-mission',  bg: 'bg-mustard text-ink',                 icon: '➕' },
              { label: 'Inscrits',           to: '/association/inscrits',          bg: 'bg-pink text-pink-foreground',        icon: '👥' },
              { label: 'Renforts',           to: '/association/renforts',          bg: 'bg-paper text-ink',                   icon: '⚡' },
              { label: 'Certificats',        to: '/association/certificats',       bg: 'bg-paper text-ink',                   icon: '📄' },
              { label: 'Notifications',      to: '/association/notifications',     bg: 'bg-paper text-ink',                   icon: '🔔' },
            ].map(({ label, to, bg, icon }) => (
              <Link
                key={to}
                to={to as any}
                className={`press flex items-center gap-2 rounded-xl border-2 border-ink px-3 py-3 text-sm font-semibold shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90 ${bg}`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

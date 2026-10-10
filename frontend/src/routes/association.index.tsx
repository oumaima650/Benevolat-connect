import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Target,
  Users,
  CheckCircle,
  Clock,
  FileText,
  ClipboardCheck,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/association/')({
  component: AssociationDashboard,
});

const fillData = [
  { mission: 'Distribution repas', pct: 80 },
  { mission: 'Plantation arbres', pct: 47 },
  { mission: 'Collecte vêtements', pct: 38 },
  { mission: 'Atelier numérique', pct: 0 },
  { mission: 'Soutien scolaire', pct: 100 },
  { mission: 'Animation jeunesse', pct: 65 },
];

const inscriptionsData = [
  { semaine: 'S1', inscriptions: 4 },
  { semaine: 'S2', inscriptions: 7 },
  { semaine: 'S3', inscriptions: 5 },
  { semaine: 'S4', inscriptions: 12 },
  { semaine: 'S5', inscriptions: 9 },
  { semaine: 'S6', inscriptions: 15 },
  { semaine: 'S7', inscriptions: 11 },
  { semaine: 'S8', inscriptions: 18 },
];

const statutData = [
  { name: 'Publiée', value: 3, fill: '#22c55e' },
  { name: 'En cours', value: 1, fill: '#3b82f6' },
  { name: 'Terminée', value: 2, fill: '#9ca3af' },
  { name: 'Renfort urgent', value: 1, fill: '#ef4444' },
  { name: 'Brouillon', value: 1, fill: '#fde047' },
];

const TODO_ITEMS = [
  {
    id: 't1',
    type: 'CERTIFICAT',
    label: 'Délivrer les certificats',
    mission: 'Marathon caritatif de Casablanca',
    icon: FileText,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    id: 't2',
    type: 'CLOTURE',
    label: 'Clôturer la mission',
    mission: 'Distribution de repas solidaires',
    icon: ClipboardCheck,
    color: 'text-emerald bg-emerald/10',
  },
  {
    id: 't3',
    type: 'RENFORT',
    label: 'Répondre au besoin de renfort',
    mission: 'Collecte de vêtements',
    icon: AlertCircle,
    color: 'text-red-600 bg-red-50',
  },
];

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
        <h1 className="font-display text-2xl font-black text-ink">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bonjour, Association Nour. Voici votre activité.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Missions actives" value="5" icon={Target} colorClass="text-emerald" />
        <KpiCard label="Taux de remplissage" value="62%" icon={CheckCircle} colorClass="text-mustard" />
        <KpiCard label="Inscrits confirmés" value="28" icon={Users} colorClass="text-pink" />
        <KpiCard label="En liste d'attente" value="17" icon={Clock} colorClass="text-muted-foreground" />
        <KpiCard label="Certificats délivrés" value="12" icon={FileText} colorClass="text-blue-500" />
      </div>

      {/* À faire */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <h2 className="font-display mb-3 font-bold text-ink">À faire</h2>
        <ul className="space-y-2">
          {TODO_ITEMS.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border-2 border-ink p-3 shadow-[2px_2px_0_var(--color-ink)]"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.color}`}>
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.mission}</p>
              </div>
              <StatusBadge
                statut={
                  item.type === 'CERTIFICAT'
                    ? 'TERMINEE'
                    : item.type === 'CLOTURE'
                      ? 'EN_COURS'
                      : 'RENFORT_URGENT'
                }
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bar chart: fill rate per mission */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display mb-4 font-bold text-ink">Taux de remplissage par mission</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fillData} margin={{ top: 0, right: 0, left: -10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="mission"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Remplissage']} />
              <Bar dataKey="pct" fill="oklch(0.54 0.14 156)" radius={[4, 4, 0, 0]} stroke="oklch(0.16 0 0)" strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line chart: inscriptions per week */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display mb-4 font-bold text-ink">Inscriptions par semaine</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={inscriptionsData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="semaine" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [v, 'Inscriptions']} />
              <Line
                type="monotone"
                dataKey="inscriptions"
                stroke="oklch(0.7 0.16 355)"
                strokeWidth={2.5}
                dot={{ fill: 'oklch(0.7 0.16 355)', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut: mission status */}
      <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
        <h2 className="font-display mb-4 font-bold text-ink">Répartition des missions par statut</h2>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={statutData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
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
          <div className="flex flex-col gap-2">
            {statutData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-ink"
                  style={{ backgroundColor: d.fill }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-ink">{d.name}</span>
                <span className="text-sm text-muted-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

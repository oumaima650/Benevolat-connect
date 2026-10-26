import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Award, Building2, ClipboardList, Flag, Hourglass, Loader2, MapPin, PieChart as PieIcon,
  ShieldAlert, Tags, TrendingUp, UserCheck, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { adminApi, type AdminStats, type Serie } from '@/services/adminApi';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

const INK = 'oklch(0.16 0 0)';
const PALETTE = ['#00864A', '#EEC22A', '#E96FA3', '#3B82F6', '#8B5CF6', '#F97316', '#14B8A6', '#64748B', '#A3A3A3'];

const STATUTS: Record<string, { label: string; color: string }> = {
  PUBLIEE: { label: 'Publiée', color: '#00864A' },
  SATUREE: { label: 'Saturée', color: '#EEC22A' },
  EN_COURS: { label: 'En cours', color: '#3B82F6' },
  RENFORT_URGENT: { label: 'Renfort urgent', color: '#E96FA3' },
  TERMINEE: { label: 'Terminée', color: '#8B5CF6' },
  CLOTUREE: { label: 'Clôturée', color: '#64748B' },
  ANNULEE: { label: 'Annulée', color: '#EF4444' },
  BROUILLON: { label: 'Brouillon', color: '#D4D4D4' },
};

function Carte({ titre, icon: Icon, children, className = '' }: {
  titre: string; icon: typeof Users; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] ${className}`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-emerald" />
        <h2 className="font-display font-bold text-ink">{titre}</h2>
      </div>
      {children}
    </div>
  );
}

function Vide() {
  return <p className="py-10 text-center text-sm text-muted-foreground">Pas encore de données.</p>;
}

function BarresHorizontales({ data, unite = 'missions' }: { data: Serie[]; unite?: string }) {
  if (data.length === 0) return <Vide />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip formatter={(v: number) => [v, unite]} cursor={{ fill: '#F3F2EE' }} />
        <Bar dataKey="valeur" radius={[0, 6, 6, 0]} stroke={INK} strokeWidth={1}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => toast.error(e.message));
  }, []);

  if (!stats) {
    return <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-emerald" /></div>;
  }

  const statutData = Object.entries(stats.missionsParStatut)
    .filter(([s, n]) => n > 0 && s !== 'BROUILLON')
    .map(([s, n]) => ({ name: STATUTS[s]?.label ?? s, value: n, fill: STATUTS[s]?.color ?? '#A3A3A3' }));

  const evolution = stats.inscriptionsParMois.map((s, i) => ({
    mois: s.label,
    inscriptions: s.valeur,
    utilisateurs: stats.nouveauxUtilisateursParMois[i]?.valeur ?? 0,
  }));

  const tauxConfirmation = stats.inscriptions > 0
    ? Math.round((stats.inscriptionsConfirmees / stats.inscriptions) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-ink">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vue d'ensemble de l'activité de la plateforme CountMeIn.</p>
      </div>

      {/* À traiter */}
      {(stats.associationsEnAttente > 0 || stats.missionsSignalees > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.associationsEnAttente > 0 && (
            <Link to="/admin/associations"
              className="press flex items-center gap-3 rounded-2xl border-2 border-ink bg-mustard p-4 shadow-[3px_3px_0_var(--color-ink)]">
              <Hourglass className="h-6 w-6 shrink-0 text-ink" />
              <div>
                <p className="font-bold text-ink">{stats.associationsEnAttente} association(s) à valider</p>
                <p className="text-xs text-ink/70">Elles ne peuvent pas publier tant que vous ne les avez pas validées.</p>
              </div>
            </Link>
          )}
          {stats.missionsSignalees > 0 && (
            <Link to="/admin/missions"
              className="press flex items-center gap-3 rounded-2xl border-2 border-ink bg-pink p-4 shadow-[3px_3px_0_var(--color-ink)]">
              <ShieldAlert className="h-6 w-6 shrink-0 text-ink" />
              <div>
                <p className="font-bold text-ink">{stats.missionsSignalees} mission(s) signalée(s)</p>
                <p className="text-xs text-ink/70">À examiner dans l'onglet Modération.</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Bénévoles" value={stats.benevoles} icon={Users} colorClass="text-emerald" />
        <KpiCard label="Associations" value={stats.associations} icon={Building2} colorClass="text-blue-500"
          {...(stats.associationsEnAttente > 0 ? { trend: `${stats.associationsEnAttente} en attente` } : {})} />
        <KpiCard label="Missions actives" value={stats.missionsActives} icon={ClipboardList} colorClass="text-mustard"
          trend={`${stats.missions} au total`} />
        <KpiCard label="Inscriptions" value={stats.inscriptions} icon={UserCheck} colorClass="text-pink"
          trend={`${tauxConfirmation}% confirmées`} />
        <KpiCard label="En liste d'attente" value={stats.inscriptionsEnAttente} icon={Hourglass} colorClass="text-muted-foreground" />
        <KpiCard label="Certificats délivrés" value={stats.certificats} icon={Award} colorClass="text-emerald" />
      </div>

      {/* Évolution + statuts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Carte titre="Évolution sur 6 mois" icon={TrendingUp} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={evolution} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gInscr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00864A" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00864A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E96FA3" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#E96FA3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="inscriptions" name="Inscriptions" stroke="#00864A" strokeWidth={2.5} fill="url(#gInscr)" />
              <Area type="monotone" dataKey="utilisateurs" name="Nouveaux comptes" stroke="#E96FA3" strokeWidth={2.5} fill="url(#gUsers)" />
            </AreaChart>
          </ResponsiveContainer>
        </Carte>

        <Carte titre="Missions par statut" icon={PieIcon}>
          {statutData.length === 0 ? <Vide /> : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={statutData} dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={3} stroke={INK} strokeWidth={2}>
                    {statutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'missions']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {statutData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border border-ink" style={{ backgroundColor: d.fill }} />
                      {d.name}
                    </span>
                    <span className="font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Carte>
      </div>

      {/* Répartitions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Carte titre="Missions par domaine" icon={Tags}>
          <BarresHorizontales data={stats.missionsParDomaine} />
        </Carte>
        <Carte titre="Missions par ville" icon={MapPin}>
          <BarresHorizontales data={stats.missionsParVille} />
        </Carte>
        <Carte titre="Bénévoles par ville" icon={Users}>
          <BarresHorizontales data={stats.benevolesParVille} unite="bénévoles" />
        </Carte>
      </div>

      {stats.comptesSuspendus > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Flag className="h-4 w-4" /> {stats.comptesSuspendus} compte(s) suspendu(s) ou désactivé(s) —{' '}
          <Link to="/admin/utilisateurs" className="font-semibold text-ink underline underline-offset-2">gérer les comptes</Link>
        </p>
      )}
    </div>
  );
}

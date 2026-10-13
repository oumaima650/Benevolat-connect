import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Target, Users, CheckCircle, Clock, FileText,
  AlertCircle, TrendingUp, ArrowUpRight, BarChart2, Lock,
  Building2, Plus, UserCheck, Zap, Award, User, LucideIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
  RadialBarChart, RadialBar,
} from 'recharts';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getMyMissions, getMyProfile, type MissionDashboard, type AssociationProfile } from '@/services/associationApi';
import { useAuth } from '@/context/AuthContext';
import { useValidation } from '@/context/ValidationContext';

export const Route = createFileRoute('/association/')({
  component: AssociationDashboard,
});

/* ── Tooltip custom ── */
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

const getBarColor = (pct: number) =>
  pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';

const STATUT_COLORS: Record<string, string> = {
  PUBLIEE: '#22c55e',
  EN_COURS: '#3b82f6',
  TERMINEE: '#9ca3af',
  RENFORT_URGENT: '#ef4444',
  BROUILLON: '#fde047',
  COMPLETE: '#f97316',
  ANNULEE: '#6b7280',
  CLOTUREE: '#8b5cf6',
};

function AssociationDashboard() {
  const { user } = useAuth();
  const validationStatus = useValidation();
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<MissionDashboard[]>([]);
  const [profile, setProfile] = useState<AssociationProfile | null>(null);

  useEffect(() => {
    if (validationStatus === 'VALIDE') {
      Promise.all([getMyMissions(), getMyProfile()])
        .then(([m, p]) => { setMissions(m); setProfile(p); })
        .catch(() => { })
        .finally(() => setLoading(false));
    } else if (validationStatus !== null) {
      getMyProfile().then(setProfile).catch(() => { }).finally(() => setLoading(false));
    }
  }, [validationStatus]);

  /* ── Vue EN_ATTENTE / REFUSE ── */
  if (validationStatus !== null && validationStatus !== 'VALIDE') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-yellow-400 bg-yellow-50 shadow-[4px_4px_0_var(--color-ink)]">
            {validationStatus === 'REFUSE'
              ? <AlertCircle className="h-12 w-12 text-red-500" />
              : <Clock className="h-12 w-12 text-yellow-500" />
            }
          </div>
          <div>
            <h1 className="font-display text-3xl font-black text-ink">
              {validationStatus === 'REFUSE' ? 'Demande refusée' : 'En attente de validation'}
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-sm mx-auto">
              {validationStatus === 'REFUSE'
                ? "Votre demande a été refusée par l'équipe CountMeIn. Contactez-nous pour plus d'informations."
                : "Votre association est en cours d'examen. Vous serez notifié(e) par email dès qu'elle sera validée."}
            </p>
          </div>

          {/* Ce que tu peux faire en attendant */}
          <div className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-[4px_4px_0_var(--color-ink)] text-left space-y-3">
            <h2 className="font-display font-bold text-ink text-sm uppercase tracking-wide">En attendant, vous pouvez :</h2>
            <div className="space-y-2">
              {[
                { icon: Building2, label: 'Compléter votre profil', desc: 'Ajoutez logo, description et domaines.', to: '/association/profil' },
                { icon: FileText, label: 'Consulter vos notifications', desc: 'Suivez les mises à jour de votre dossier.', to: '/association/notifications' },
              ].map(({ icon: Icon, label, desc, to }) => (
                <Link key={to} to={to as any}
                  className="flex items-center gap-4 rounded-xl border-2 border-ink bg-muted/30 p-3 hover:bg-muted transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-paper shadow-[2px_2px_0_var(--color-ink)]">
                    <Icon className="h-5 w-5 text-emerald" />
                  </div>
                  <div>
                    <p className="font-bold text-ink text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Ce qui sera débloqué */}
          <div className="rounded-2xl border-2 border-ink/20 bg-muted/20 p-5 text-left space-y-2">
            <h2 className="font-display font-bold text-ink/50 text-sm uppercase tracking-wide flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" /> Fonctionnalités débloquées après validation
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {['Créer des missions', 'Gérer les inscrits', 'Émettre des certificats', 'Statistiques', 'Renforts urgents', 'Tableau de bord complet'].map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-ink/40 font-semibold">
                  <Lock className="h-3 w-3" /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  /* ── Calculs KPIs ── */
  const actives = missions.filter(m => ['PUBLIEE', 'EN_COURS', 'RENFORT_URGENT', 'COMPLETE'].includes(m.statut));
  const totalPlaces = actives.reduce((s, m) => s + (m.nbPlaces ?? 0), 0);
  const totalInscrits = actives.reduce((s, m) => s + (m.nbInscritsConfirmes ?? 0), 0);
  const totalAttente = actives.reduce((s, m) => s + (m.nbListeAttente ?? 0), 0);
  const tauxGlobal = totalPlaces > 0 ? Math.round((totalInscrits / totalPlaces) * 100) : 0;

  const fillData = actives.slice(0, 8).map(m => ({
    mission: m.titre.length > 16 ? m.titre.substring(0, 16) + '…' : m.titre,
    pct: m.nbPlaces > 0 ? Math.round((m.nbInscritsConfirmes / m.nbPlaces) * 100) : 0,
  }));

  const statutCounts = missions.reduce<Record<string, number>>((acc, m) => {
    acc[m.statut] = (acc[m.statut] ?? 0) + 1; return acc;
  }, {});

  const statutData = Object.entries(statutCounts).map(([name, value]) => ({
    name: name.replace('_', ' '), value,
    fill: STATUT_COLORS[name] ?? '#9ca3af',
  }));

  const tauxGaugeData = [{ name: 'Remplissage', value: tauxGlobal, fill: '#10b981' }];

  const urgentes = missions.filter(m => m.statut === 'RENFORT_URGENT');
  const terminees = missions.filter(m => m.statut === 'TERMINEE');
  const todoItems = [
    ...urgentes.map(m => ({ icon: AlertCircle, label: 'Besoin de renforts', mission: m.titre, color: 'text-red-600 bg-red-50 border-red-200', to: '/association/renforts' })),
    ...terminees.map(m => ({ icon: CheckCircle, label: 'Mission à clôturer', mission: m.titre, color: 'text-emerald bg-emerald/10 border-emerald/30', to: '/association/missions' })),
  ].slice(0, 4);

  const nomAssociation = profile?.nomAssociation ?? user?.nomAssociation ?? 'votre association';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bonjour, <span className="font-semibold text-ink">{nomAssociation}</span>. Voici votre activité.
          </p>
        </div>
        <Link to="/association/nouvelle-mission"
          className="press inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-emerald px-4 py-2.5 text-sm font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)]">
          + Nouvelle mission
        </Link>
      </div>

      {/* KPI Cards — 5 colonnes */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Missions actives" value={String(actives.length)} icon={Target} colorClass="text-emerald" />
        <KpiCard label="Taux de remplissage" value={`${tauxGlobal}%`} icon={CheckCircle} colorClass="text-mustard" />
        <KpiCard label="Inscrits confirmés" value={String(totalInscrits)} icon={Users} colorClass="text-pink" />
        <KpiCard label="En liste d'attente" value={String(totalAttente)} icon={Clock} colorClass="text-muted-foreground" />
        <KpiCard label="Total missions" value={String(missions.length)} icon={FileText} colorClass="text-blue-500" />
      </div>

      {/* Ligne 2 : Jauge + À faire + Accès rapides */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Jauge */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)] flex flex-col items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald" />
          <p className="font-display font-bold text-ink text-sm text-center">Taux de remplissage global</p>
          <div className="relative h-36 w-36">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="65%" outerRadius="100%" data={tauxGaugeData} startAngle={220} endAngle={-40} barSize={14}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f3f4f6' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-ink">{tauxGlobal}%</span>
              <span className="text-[10px] text-muted-foreground">rempli</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Sur {actives.length} missions actives</p>
        </div>

        {/* À faire */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display mb-3 font-bold text-ink flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" /> À faire
          </h2>
          {todoItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-10 w-10 text-emerald mb-2" />
              <p className="text-sm font-semibold text-ink">Tout est à jour !</p>
              <p className="text-xs text-muted-foreground">Aucune action requise.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todoItems.map((item, i) => (
                <li key={i} className={`flex items-center gap-3 rounded-xl border p-3 ${item.color}`}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.mission}</p>
                  </div>
                  <Link to={item.to as any} className="shrink-0 rounded-lg border-2 border-ink bg-paper px-2 py-1 text-xs font-bold text-ink hover:bg-muted shadow-[2px_2px_0_var(--color-ink)]">
                    Voir →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Accès rapides */}
        <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
          <h2 className="font-display mb-3 font-bold text-ink flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" /> Accès rapides
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {([
              { label: 'Missions', to: '/association/missions', bg: 'bg-emerald text-emerald-foreground', Icon: FileText },
              { label: 'Nouvelle', to: '/association/nouvelle-mission', bg: 'bg-mustard text-ink', Icon: Plus },
              { label: 'Inscrits', to: '/association/inscrits', bg: 'bg-pink text-pink-foreground', Icon: UserCheck },
              { label: 'Renforts', to: '/association/renforts', bg: 'bg-paper text-ink', Icon: Zap },
              { label: 'Certificats', to: '/association/certificats', bg: 'bg-paper text-ink', Icon: Award },
              { label: 'Profil', to: '/association/profil', bg: 'bg-paper text-ink', Icon: User },
            ] as { label: string; to: string; bg: string; Icon: LucideIcon }[]).map(({ label, to, bg, Icon }) => (
              <Link key={to} to={to as any}
                className={`press flex items-center gap-1.5 rounded-xl border-2 border-ink px-2.5 py-2.5 text-xs font-semibold shadow-[2px_2px_0_var(--color-ink)] hover:opacity-90 ${bg}`}>
                <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Ligne 3 : Graphiques pleine largeur */}
      <div className="grid gap-4 lg:grid-cols-2">
        {fillData.length > 0 && (
          <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-4 w-4 text-emerald" />
              <h2 className="font-display font-bold text-ink">Taux de remplissage par mission</h2>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={fillData} margin={{ top: 0, right: 0, left: -20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="mission" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pct" name="Remplissage" unit="%" radius={[6, 6, 0, 0]} stroke="oklch(0.16 0 0)" strokeWidth={1}>
                  {fillData.map((entry, index) => <Cell key={index} fill={getBarColor(entry.pct)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 flex gap-3 text-xs">
              {[['#10b981', '≥ 80%'], ['#f59e0b', '40–79%'], ['#ef4444', '< 40%']].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full border border-ink" style={{ backgroundColor: c }} />{l}
                </span>
              ))}
            </div>
          </div>
        )}

        {statutData.length > 0 && (
          <div className="rounded-2xl border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_var(--color-ink)]">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-mustard" />
              <h2 className="font-display font-bold text-ink">Répartition des statuts</h2>
            </div>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={statutData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3} strokeWidth={2} stroke="oklch(0.16 0 0)">
                    {statutData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'missions']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statutData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-full border border-ink" style={{ backgroundColor: d.fill }} />
                      <span className="text-ink font-medium">{d.name}</span>
                    </div>
                    <span className="font-bold text-ink">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {missions.length === 0 && (
          <div className="lg:col-span-2 rounded-2xl border-2 border-dashed border-ink/30 bg-paper p-12 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-ink/20 bg-muted/30">
              <FileText className="h-7 w-7 text-ink/40" />
            </div>
            <p className="font-bold text-ink text-lg">Aucune mission pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">Créez votre première mission pour mobiliser des bénévoles.</p>
            <Link to="/association/nouvelle-mission"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-emerald px-5 py-2.5 text-sm font-bold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)]">
              + Créer une mission
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


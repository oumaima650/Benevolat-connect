import { createFileRoute, Outlet, Link, Navigate, useNavigate, useMatchRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Building2, Users, Flag, Bell, Menu, LogOut, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import logoImage from '@/assets/logo.png';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { adminApi, ADMIN_CHANGED } from '@/services/adminApi';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

type Compteurs = { associations: number; signalements: number; notifications: number };

const NAV_ITEMS = [
  { label: 'Tableau de bord', to: '/admin', icon: LayoutDashboard, exact: true, badge: null },
  { label: 'Associations', to: '/admin/associations', icon: Building2, exact: false, badge: 'associations' },
  { label: 'Utilisateurs', to: '/admin/utilisateurs', icon: Users, exact: false, badge: null },
  { label: 'Modération', to: '/admin/missions', icon: Flag, exact: false, badge: 'signalements' },
  { label: 'Notifications', to: '/admin/notifications', icon: Bell, exact: false, badge: 'notifications' },
] as const;

function SidebarContent({ onClose, compteurs }: { onClose?: () => void; compteurs: Compteurs }) {
  const matchRoute = useMatchRoute();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    onClose?.();
    navigate({ to: '/' }).then(logout);
  }

  return (
    <div className="flex h-full flex-col bg-paper">
      <div className="flex h-16 items-center border-b-2 border-ink px-4">
        <Link to="/" onClick={onClose}>
          <img src={logoImage} alt="CountMeIn" className="h-8 w-auto" />
        </Link>
      </div>

      <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl border-2 border-ink bg-mustard px-3 py-2 text-xs font-bold text-ink">
        <ShieldCheck className="h-4 w-4" /> Administration
      </div>

      <nav className="flex-1 overflow-y-auto py-3" aria-label="Navigation administrateur">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ label, to, icon: Icon, exact, badge }) => {
            const isActive = !!matchRoute({ to, fuzzy: !exact });
            const valeur = badge ? compteurs[badge] : 0;
            return (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'border-l-4 border-ink bg-emerald text-emerald-foreground'
                      : 'text-ink/70 hover:bg-muted hover:text-ink',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {valeur > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-ink bg-pink px-1 text-[10px] font-bold text-ink">
                      {valeur > 99 ? '99+' : valeur}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-2 border-t-2 border-ink p-3">
        <Link to="/" onClick={onClose}
          className="flex w-full items-center gap-2 rounded-xl border-2 border-ink bg-emerald px-3 py-2.5 text-sm font-semibold text-emerald-foreground shadow-[3px_3px_0_var(--color-ink)] hover:opacity-90">
          ← Retour à l'accueil
        </Link>
        <button onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl border-2 border-ink bg-paper px-3 py-2.5 text-sm font-semibold text-ink shadow-[3px_3px_0_var(--color-ink)] hover:bg-muted">
          <LogOut className="h-4 w-4" /> Déconnexion
        </button>
      </div>
    </div>
  );
}

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const estAdmin = user?.role === 'ADMIN';
  const notifications = useUnreadNotifications(estAdmin);
  const [stats, setStats] = useState({ associations: 0, signalements: 0 });

  useEffect(() => {
    if (!estAdmin) return;
    const charger = () =>
      adminApi.stats()
        .then((s) => setStats({ associations: s.associationsEnAttente, signalements: s.missionsSignalees }))
        .catch(() => {});
    charger();
    const timer = window.setInterval(charger, 60_000);
    window.addEventListener(ADMIN_CHANGED, charger);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(ADMIN_CHANGED, charger);
    };
  }, [estAdmin]);

  // Protection d'accès (redirection déclarative)
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'ASSOCIATION') return <Navigate to="/association" />;
  if (user.role !== 'ADMIN') return <Navigate to="/benevole" />;

  const compteurs: Compteurs = { ...stats, notifications };

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r-2 border-ink bg-paper lg:flex lg:flex-col">
        <SidebarContent compteurs={compteurs} />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 border-r-2 border-ink bg-paper p-0">
          <SidebarContent compteurs={compteurs} onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b-2 border-ink bg-paper px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="rounded-lg border-2 border-ink bg-paper p-1.5 shadow-[2px_2px_0_var(--color-ink)] hover:bg-muted lg:hidden"
              aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="hidden font-display text-lg font-black text-ink sm:block">Espace Administrateur</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/notifications"
              className="relative rounded-lg border-2 border-ink bg-paper p-1.5 shadow-[2px_2px_0_var(--color-ink)] hover:bg-muted"
              aria-label={`Notifications (${notifications} non lues)`}>
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-ink bg-pink px-0.5 text-[9px] font-bold text-ink">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Link>
            <span className="hidden max-w-[200px] truncate text-sm font-semibold text-ink md:block">{user.email}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

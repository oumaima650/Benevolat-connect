import { createFileRoute, Outlet, Link, useNavigate, useMatchRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
  LayoutDashboard,
  Search,
  MapPin,
  Sparkles,
  BookOpen,
  Award,
  Bell,
  UserCircle,
  Menu,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import logoImage from '@/assets/logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/benevole')({
  component: BenevoleLayout,
});

const navItems = [
  { label: 'Tableau de bord', to: '/benevole' as const, icon: LayoutDashboard, exact: true },
  { label: 'Explorer les missions', to: '/benevole/explorer' as const, icon: Search, exact: false },
  { label: 'Carte', to: '/benevole/carte' as const, icon: MapPin, exact: false },
  { label: 'Recommandations', to: '/benevole/recommandations' as const, icon: Sparkles, exact: false },
  { label: 'Mon parcours', to: '/benevole/parcours' as const, icon: BookOpen, exact: false },
  { label: 'Badges & niveau', to: '/benevole/badges' as const, icon: Award, exact: false },
  { label: 'Notifications', to: '/benevole/notifications' as const, icon: Bell, exact: false, badge: 3 },
  { label: 'Mon profil', to: '/benevole/profil' as const, icon: UserCircle, exact: false },
] as const;

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const matchRoute = useMatchRoute();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate({ to: '/' });
  }

  return (
    <div className="flex h-full flex-col bg-paper">
      {/* Logo */}
      <div className="flex h-16 items-center border-b-2 border-ink px-4">
        <Link to="/" onClick={onClose} className="flex items-center gap-2">
          <img src={logoImage} alt="CountMeIn" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Navigation bénévole">
        <ul className="space-y-1 px-2">
          {navItems.map(({ label, to, icon: Icon, exact, ...rest }) => {
            const badge = 'badge' in rest ? rest.badge : undefined;
            const isActive = exact
              ? !!matchRoute({ to, fuzzy: false })
              : !!matchRoute({ to, fuzzy: true });
            return (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-mustard border-l-4 border-ink font-bold text-ink'
                      : 'text-ink/70 hover:bg-muted hover:text-ink',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {badge != null && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t-2 border-ink p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl border-2 border-ink bg-paper px-3 py-2.5 text-sm font-semibold text-ink shadow-[3px_3px_0_var(--color-ink)] hover:bg-muted"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

function BenevoleLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Protection d'accès : redirige si non connecté ou mauvais rôle
  if (!user) {
    navigate({ to: '/login' });
    return null;
  }
  if (user.role === 'ASSOCIATION') {
    navigate({ to: '/association' });
    return null;
  }

  function handleLogout() {
    logout();
    navigate({ to: '/' });
  }

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r-2 border-ink bg-paper lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 border-r-2 border-ink bg-paper">
          <SidebarContent onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-ink bg-paper px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border-2 border-ink bg-paper p-1.5 shadow-[2px_2px_0_var(--color-ink)] hover:bg-muted lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <h2 className="font-display text-xl font-black text-ink hidden sm:block">Espace Bénévole</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications bell */}
            <Link
              to="/benevole/notifications"
              className="relative rounded-lg border-2 border-ink bg-paper p-1.5 shadow-[2px_2px_0_var(--color-ink)] hover:bg-muted"
              aria-label="Notifications (3 non lues)"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                3
              </span>
            </Link>

            {/* Avatar dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-xl border-2 border-ink bg-mustard px-3 py-1.5 text-sm font-bold text-ink shadow-[2px_2px_0_var(--color-ink)] hover:opacity-90"
                  aria-label="Menu utilisateur"
                >
                  <span>YE</span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-2 border-ink shadow-[3px_3px_0_var(--color-ink)]">
                <DropdownMenuItem asChild>
                  <Link to="/benevole/profil" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}

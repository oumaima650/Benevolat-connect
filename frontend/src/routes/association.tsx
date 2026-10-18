import { createFileRoute, Outlet, Link, Navigate, useNavigate, useMatchRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ClipboardList, PlusCircle, Users, Zap,
  FileText, Bell, Building2, Menu, LogOut, ChevronDown,
  AlertTriangle, Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/common/UserAvatar';
import logoImage from '@/assets/logo.png';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { getMyProfile } from '@/services/associationApi';
import { ValidationContext, type ValidationStatus } from '@/context/ValidationContext';
export { useValidation } from '@/context/ValidationContext';

export const Route = createFileRoute('/association')({
  component: AssociationLayout,
});

/* ── Items nav avec accès conditionnel ── */
const NAV_ITEMS = [
  { label: 'Tableau de bord',  to: '/association',                    icon: LayoutDashboard, exact: true,  needsValidation: true  },
  { label: 'Mes missions',     to: '/association/missions',           icon: ClipboardList,   exact: false, needsValidation: true  },
  { label: 'Créer une mission',to: '/association/nouvelle-mission',   icon: PlusCircle,      exact: false, needsValidation: true  },
  { label: 'Inscrits & attente',to: '/association/inscrits',          icon: Users,           exact: false, needsValidation: true  },
  { label: 'Renforts',         to: '/association/renforts',           icon: Zap,             exact: false, needsValidation: true  },
  { label: 'Certificats',      to: '/association/certificats',        icon: FileText,        exact: false, needsValidation: true  },
  { label: 'Notifications',    to: '/association/notifications',      icon: Bell,            exact: false, needsValidation: false, badge: 2 },
  { label: 'Profil',           to: '/association/profil',             icon: Building2,       exact: false, needsValidation: false },
] as const;

function SidebarContent({
  onClose, validationStatus,
}: {
  onClose?: () => void;
  validationStatus: ValidationStatus;
}) {
  const matchRoute = useMatchRoute();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const isValidated = validationStatus === 'VALIDE';

  function handleLogout() {
    onClose?.();
    // Naviguer d'abord vers l'accueil, puis vider la session :
    // évite que le layout redirige vers /login pendant le rendu
    navigate({ to: '/' }).then(logout);
  }

  return (
    <div className="flex h-full flex-col bg-paper">
      {/* Logo */}
      <div className="flex h-16 items-center border-b-2 border-ink px-4">
        <Link to="/" onClick={onClose}>
          <img src={logoImage} alt="CountMeIn" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Statut badge dans sidebar */}
      {validationStatus && (
        <div className={`mx-3 mt-3 rounded-xl border-2 px-3 py-2 text-xs font-semibold ${
          validationStatus === 'VALIDE'
            ? 'border-green-400 bg-green-50 text-green-700'
            : validationStatus === 'REFUSE'
            ? 'border-red-400 bg-red-50 text-red-700'
            : 'border-yellow-400 bg-yellow-50 text-yellow-700'
        }`}>
          {validationStatus === 'VALIDE' ? '✓ Association validée' : validationStatus === 'REFUSE' ? '✗ Demande refusée' : '⏳ En attente de validation'}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3" aria-label="Navigation association">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ label, to, icon: Icon, exact, needsValidation, ...rest }) => {
            const badge = 'badge' in rest ? rest.badge : undefined;
            const locked = needsValidation && !isValidated;
            const isActive = exact
              ? !!matchRoute({ to, fuzzy: false })
              : !!matchRoute({ to, fuzzy: true });

            if (locked) {
              return (
                <li key={to}>
                  <span className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/30 cursor-not-allowed select-none">
                    <Icon className="h-4 w-4 shrink-0 opacity-40" />
                    <span className="flex-1">{label}</span>
                    <Lock className="h-3 w-3 opacity-40" />
                  </span>
                </li>
              );
            }

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

      {/* Bas sidebar */}
      <div className="border-t-2 border-ink p-3 space-y-2">
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

function AssociationLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return; // Ne pas appeler l'API si déconnecté
    getMyProfile()
      .then((p) => setValidationStatus(p.statutValidation as ValidationStatus))
      .catch(() => {}); // Silencieux — ne pas bloquer la navigation
  }, [user]);

  // Protection d'accès (redirection déclarative, jamais navigate() pendant le rendu)
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'BENEVOLE') return <Navigate to="/benevole" />;

  function handleLogout() { navigate({ to: '/' }).then(logout); }

  return (
    <ValidationContext.Provider value={validationStatus}>
      <div className="flex h-screen overflow-hidden bg-paper">
        {/* Desktop Sidebar */}
        <aside className="hidden w-60 shrink-0 border-r-2 border-ink bg-paper lg:flex lg:flex-col h-screen sticky top-0">
          <SidebarContent validationStatus={validationStatus} />
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-60 p-0 border-r-2 border-ink bg-paper">
            <SidebarContent validationStatus={validationStatus} onClose={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          {/* Banner EN_ATTENTE */}
          {validationStatus === 'EN_ATTENTE' && (
            <div className="flex items-center gap-2 border-b-2 border-yellow-400 bg-yellow-50 px-4 py-2.5 text-sm font-semibold text-yellow-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Votre association est en attente de validation — seuls le profil et les notifications sont accessibles.
            </div>
          )}
          {validationStatus === 'REFUSE' && (
            <div className="flex items-center gap-2 border-b-2 border-red-400 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Votre demande a été refusée. Contactez l'équipe CountMeIn.
            </div>
          )}

          {/* Header */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b-2 border-ink bg-paper px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)}
                className="rounded-lg border-2 border-ink bg-paper p-1.5 shadow-[2px_2px_0_var(--color-ink)] hover:bg-muted lg:hidden"
                aria-label="Ouvrir le menu">
                <Menu className="h-5 w-5" />
              </button>
              <h2 className="hidden font-display text-lg font-black text-ink sm:block">Espace Association</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/association/notifications"
                className="relative rounded-lg border-2 border-ink bg-paper p-1.5 shadow-[2px_2px_0_var(--color-ink)] hover:bg-muted">
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">2</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex cursor-pointer items-center gap-1 rounded-xl border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] overflow-hidden hover:opacity-90">
                    <UserAvatar user={user} size="sm" />
                    <ChevronDown className="h-3.5 w-3.5 mr-1.5 text-ink" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-2 border-ink shadow-[3px_3px_0_var(--color-ink)]">
                  <DropdownMenuItem asChild>
                    <Link to="/association/profil" className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" /> Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content — pleine largeur */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ValidationContext.Provider>
  );
}

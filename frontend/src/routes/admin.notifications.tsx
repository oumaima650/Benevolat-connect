import { createFileRoute } from '@tanstack/react-router';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export const Route = createFileRoute('/admin/notifications')({
  component: NotificationsAdmin,
});

/** L'administrateur reçoit uniquement des notifications dans l'application (pas d'e-mail). */
function NotificationsAdmin() {
  return <NotificationCenter />;
}

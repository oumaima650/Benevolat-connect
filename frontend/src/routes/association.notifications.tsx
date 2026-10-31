import { createFileRoute } from '@tanstack/react-router';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export const Route = createFileRoute('/association/notifications')({
  component: NotificationsAssociation,
});

function NotificationsAssociation() {
  return <NotificationCenter avecPreferences />;
}

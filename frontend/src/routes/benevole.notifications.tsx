import { createFileRoute } from '@tanstack/react-router';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export const Route = createFileRoute('/benevole/notifications')({
  component: NotificationsBenevole,
});

function NotificationsBenevole() {
  return <NotificationCenter avecPreferences />;
}

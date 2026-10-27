import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/benevole/carte')({
  component: CarteRedirect,
});

function CarteRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.navigate({ to: '/benevole/explorer', search: { tab: 'carte' } });
  }, [router]);

  return null;
}

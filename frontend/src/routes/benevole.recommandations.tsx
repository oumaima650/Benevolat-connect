import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/benevole/recommandations')({
  component: RecommandationsRedirect,
});

function RecommandationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.navigate({ to: '/benevole/explorer', search: { tab: 'recommandations' } });
  }, [router]);

  return null;
}

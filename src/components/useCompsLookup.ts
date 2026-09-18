import { useCallback, useState } from 'react';
import type { CompQuery, CompsLookupMode, CompsLookupOptions, CompsResult } from '@/src/models/comps';
import { shouldRefetchDetailed } from '@/src/services/comps/last5Avg';

export function useCompsLookup(
  lookupComps: (query: CompQuery, options?: CompsLookupOptions) => Promise<CompsResult>,
) {
  const [result, setResult] = useState<CompsResult | null>(null);
  const [view, setView] = useState<CompsLookupMode>('quick');
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setResult(null);
    setView('quick');
  }, []);

  const runLookup = useCallback(
    async (query: CompQuery, mode: CompsLookupMode = 'quick') => {
      setLoading(true);
      if (mode === 'quick') {
        setResult(null);
        setView('quick');
      }
      try {
        const next = await lookupComps(query, { mode });
        setResult(next);
        setView(mode);
        return next;
      } finally {
        setLoading(false);
      }
    },
    [lookupComps],
  );

  const changeView = useCallback(
    async (next: CompsLookupMode) => {
      if (loading) return;
      if (next === 'quick') {
        setView('quick');
        return;
      }
      setView('detailed');
      if (!result || !shouldRefetchDetailed(result)) return;
      await runLookup(result.query, 'detailed');
    },
    [loading, result, runLookup],
  );

  return { result, view, loading, runLookup, changeView, reset };
}

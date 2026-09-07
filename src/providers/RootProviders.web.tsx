import type { ReactNode } from 'react';
import { ChamberProvider } from '@/src/context/ChamberProvider';

export function RootProviders({ children }: { children: ReactNode }) {
  return <ChamberProvider>{children}</ChamberProvider>;
}

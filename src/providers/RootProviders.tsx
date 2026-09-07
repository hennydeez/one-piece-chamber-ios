import { SQLiteProvider } from 'expo-sqlite';
import type { ReactNode } from 'react';
import { ChamberProvider } from '@/src/context/ChamberProvider';
import { migrateChamberDb } from '@/src/db/migrate';

export function RootProviders({ children }: { children: ReactNode }) {
  return (
    <SQLiteProvider databaseName="chamber.db" onInit={migrateChamberDb} useSuspense={false}>
      <ChamberProvider>{children}</ChamberProvider>
    </SQLiteProvider>
  );
}

import { createContext, useContext } from 'react';
import type { ChamberContextValue } from './chamberTypes';

export const ChamberContext = createContext<ChamberContextValue | null>(null);

export function useChamber(): ChamberContextValue {
  const ctx = useContext(ChamberContext);
  if (!ctx) {
    throw new Error('useChamber must be used inside ChamberProvider');
  }
  return ctx;
}

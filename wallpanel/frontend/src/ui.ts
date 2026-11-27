import { createContext, useContext } from 'react';
import type { DashboardConfig, Tile } from './types';

export type DialogState =
  | null
  | { kind: 'tile'; tile: Tile | null; viewIdx: number }
  | { kind: 'view'; viewIdx: number }
  | { kind: 'section'; sectionIdx: number }
  | { kind: 'settings' }
  | { kind: 'alarm'; tile: Tile }
  | { kind: 'camera'; tile: Tile }
  | { kind: 'confirm'; message: string; onOk: () => void };

export interface UIContextValue {
  editing: boolean;
  openDialog: (d: DialogState) => void;
  config: DashboardConfig;
  /** Modifica una copia del tablero y la guarda. */
  update: (fn: (draft: DashboardConfig) => void) => void;
  sectionIdx: number;
}

export const UIContext = createContext<UIContextValue>(null!);
export const useUI = () => useContext(UIContext);

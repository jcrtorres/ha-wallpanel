import { createContext, useContext, useSyncExternalStore } from 'react';
import type { HassBase } from './client';

export const HassContext = createContext<HassBase>(null!);
export const useHass = () => useContext(HassContext);

/** Estado de una entidad; el componente solo se repinta cuando cambia esa entidad. */
export function useEntity(id?: string) {
  const hass = useHass();
  return useSyncExternalStore(
    (fn) => (id ? hass.subscribe(id, fn) : () => {}),
    () => (id ? hass.states[id] : undefined),
  );
}

/** Varias entidades a la vez (gráfico de barras). */
export function useEntities(ids: string[]) {
  const hass = useHass();
  const key = ids.join(',');
  return useSyncExternalStore(
    (fn) => { const un = ids.map((i) => hass.subscribe(i, fn)); return () => un.forEach((u) => u()); },
    () => cacheFor(hass, key, ids),
  );
}
const cache = new Map<string, { deps: unknown[]; val: unknown[] }>();
function cacheFor(hass: HassBase, key: string, ids: string[]) {
  const deps = ids.map((i) => hass.states[i]);
  const c = cache.get(key);
  if (c && c.deps.every((d, i) => d === deps[i])) return c.val as typeof deps;
  cache.set(key, { deps, val: deps });
  return deps;
}

export function useConnStatus() {
  const hass = useHass();
  return useSyncExternalStore((fn) => hass.subscribeStatus(fn), () => hass.status);
}

export function useAllEntityIds() {
  const hass = useHass();
  return Object.keys(hass.states).sort();
}

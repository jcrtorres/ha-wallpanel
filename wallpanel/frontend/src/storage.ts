import type { DashboardConfig } from './types';

const LS = 'wallpanel.config';
let serverAvailable = false;

/** Carga el tablero: primero del add-on (/data), si no hay servidor desde localStorage. */
export async function loadConfig(): Promise<DashboardConfig | null> {
  try {
    const r = await fetch('api/config', { cache: 'no-store' });
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) {
      serverAvailable = true;
      const cfg = await r.json();
      if (cfg?.sections) return cfg;
      return null;
    }
  } catch { /* sin servidor: vista previa */ }
  try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch { return null; }
}

export async function saveConfig(cfg: DashboardConfig) {
  localStorage.setItem(LS, JSON.stringify(cfg));
  if (!serverAvailable) return;
  const r = await fetch('api/config', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cfg) });
  if (!r.ok) throw new Error('No se pudo guardar el tablero');
}

export async function detectMode(): Promise<'ha' | 'demo'> {
  try {
    const r = await fetch('api/info', { cache: 'no-store' });
    if (r.ok && (r.headers.get('content-type') || '').includes('json')) return (await r.json()).mode;
  } catch { /* */ }
  return 'demo';
}

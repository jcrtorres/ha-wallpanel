import type { HassEntity } from '../types';

export const domainOf = (id?: string) => (id || '').split('.')[0];
export const num = (v: unknown) => { const n = parseFloat(String(v)); return Number.isFinite(n) ? n : 0; };
export const fmt = (v: unknown, dec = 0) => { const n = parseFloat(String(v)); return Number.isFinite(n) ? n.toFixed(dec).replace(/\.0$/, '') : '--'; };
export const friendly = (s?: HassEntity, fallback = '') => s?.attributes?.friendly_name || fallback;

const ACTIVE = ['on', 'open', 'unlocked', 'playing', 'home', 'armed_away', 'armed_home', 'armed_night', 'triggered', 'heat', 'cool', 'cleaning'];
export const isActive = (s?: HassEntity) => !!s && ACTIVE.includes(s.state);

const STATE_ES: Record<string, string> = {
  on: 'ON', off: 'OFF', locked: 'Cerrada', unlocked: 'Abierta', open: 'Abierta', closed: 'Cerrada', opening: 'Abriendo', closing: 'Cerrando',
  disarmed: 'Desarmada', armed_away: 'Armada', armed_home: 'En casa', armed_night: 'Noche', triggered: '¡Alarma!', arming: 'Armando',
  pending: 'Pendiente', unavailable: 'No disp.', unknown: '--', playing: 'Reproduciendo', paused: 'Pausa', idle: 'Inactivo',
};
export function stateText(s: HassEntity | undefined, domain: string) {
  if (!s) return 'N/D';
  if (['scene', 'script', 'button', 'input_button'].includes(domain)) return 'Activar';
  const unit = s.attributes?.unit_of_measurement;
  return STATE_ES[s.state] ?? s.state + (unit ? ' ' + unit : '');
}
export const condES = (c?: string) => ({ sunny: 'Soleado', 'clear-night': 'Despejado', cloudy: 'Nublado', partlycloudy: 'Parcialmente nublado', rainy: 'Lluvia', pouring: 'Lluvia fuerte', snowy: 'Nieve', fog: 'Niebla', windy: 'Viento' } as Record<string, string>)[c || ''] || c || '';
export const hvacES = (c?: string) => ({ heat: 'Calor', cool: 'Frío', off: 'Apagado', auto: 'Auto', heat_cool: 'Auto', dry: 'Secado', fan_only: 'Ventilador' } as Record<string, string>)[c || ''] || c || '';

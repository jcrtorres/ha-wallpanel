import type { HassBase } from './client';
import { domainOf } from './format';

/** Acción por defecto al tocar una entidad. */
export function runAction(hass: HassBase, id: string) {
  const d = domainOf(id);
  const call = (dom: string, svc: string) => hass.callService(dom, svc, { entity_id: id }).catch((e) => console.warn(e));
  if (d === 'scene' || d === 'script') return call(d, 'turn_on');
  if (d === 'button' || d === 'input_button') return call(d, 'press');
  if (d === 'lock') return call('lock', hass.states[id]?.state === 'locked' ? 'unlock' : 'lock');
  if (d === 'cover') return call('cover', hass.states[id]?.state === 'closed' ? 'open_cover' : 'close_cover');
  if (d === 'media_player') return call(d, 'toggle');
  if (['light', 'switch', 'fan', 'input_boolean', 'automation', 'siren', 'humidifier', 'vacuum'].includes(d)) return call('homeassistant', 'toggle');
}

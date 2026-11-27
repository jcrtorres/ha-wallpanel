import type { HassEntity } from '../types';

export type ConnStatus = 'connecting' | 'ok' | 'demo' | 'error';

type Listener = () => void;

/** Almacén de estados con suscripción por entidad (para que solo se repinten las tarjetas afectadas). */
export abstract class HassBase {
  states: Record<string, HassEntity> = {};
  status: ConnStatus = 'connecting';
  statusDetail = '';
  private byEntity = new Map<string, Set<Listener>>();
  private all = new Set<Listener>();
  private statusL = new Set<Listener>();
  onConfigUpdated?: () => void;

  subscribe(entityId: string | null, fn: Listener) {
    if (entityId === null) { this.all.add(fn); return () => this.all.delete(fn); }
    let s = this.byEntity.get(entityId);
    if (!s) this.byEntity.set(entityId, (s = new Set()));
    s.add(fn);
    return () => { s!.delete(fn); };
  }
  subscribeStatus(fn: Listener) { this.statusL.add(fn); return () => this.statusL.delete(fn); }

  protected setStatus(s: ConnStatus, detail = '') { this.status = s; this.statusDetail = detail; this.statusL.forEach((f) => f()); }
  protected emit(entityId: string | null) {
    if (entityId) this.byEntity.get(entityId)?.forEach((f) => f());
    else this.byEntity.forEach((set) => set.forEach((f) => f()));
    this.all.forEach((f) => f());
  }

  abstract connect(): void;
  abstract callService(domain: string, service: string, data?: Record<string, unknown>): Promise<unknown>;
  abstract cameraUrl(entityId: string): string | null;
}

/** Conexión real a través del puente WebSocket del add-on (sin token en el navegador). */
export class BridgeClient extends HassBase {
  private ws?: WebSocket;
  private id = 1;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private retry = 0;

  connect() {
    this.setStatus('connecting');
    const url = new URL('ws', location.href);
    url.protocol = url.protocol.replace('http', 'ws');
    const ws = (this.ws = new WebSocket(url));
    ws.onmessage = (ev) => this.onMessage(JSON.parse(ev.data));
    ws.onclose = () => {
      this.pending.forEach((p) => p.reject(new Error('Conexión cerrada')));
      this.pending.clear();
      this.setStatus('error', 'Desconectado, reintentando…');
      setTimeout(() => this.connect(), Math.min(30000, 1000 * 2 ** this.retry++));
    };
  }

  private async onMessage(msg: any) {
    if (msg.type === 'wallpanel/ready') {
      this.retry = 0;
      try {
        const list: HassEntity[] = await this.send({ type: 'get_states' });
        this.states = Object.fromEntries(list.map((s) => [s.entity_id, s]));
        this.emit(null);
        await this.send({ type: 'subscribe_events', event_type: 'state_changed' });
        this.setStatus('ok');
      } catch (e: any) { this.setStatus('error', e.message); }
    } else if (msg.type === 'wallpanel/error') {
      this.setStatus('error', msg.message);
    } else if (msg.type === 'wallpanel/config_updated') {
      this.onConfigUpdated?.();
    } else if (msg.type === 'event' && msg.event?.event_type === 'state_changed') {
      const { entity_id, new_state } = msg.event.data;
      if (new_state) this.states[entity_id] = new_state; else delete this.states[entity_id];
      this.emit(entity_id);
    } else if (msg.type === 'result' && this.pending.has(msg.id)) {
      const p = this.pending.get(msg.id)!;
      this.pending.delete(msg.id);
      msg.success ? p.resolve(msg.result) : p.reject(new Error(msg.error?.message || 'Error'));
    }
  }

  send(payload: Record<string, unknown>): Promise<any> {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return reject(new Error('Sin conexión'));
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, ...payload }));
    });
  }

  callService(domain: string, service: string, data: Record<string, unknown> = {}) {
    return this.send({ type: 'call_service', domain, service, service_data: data });
  }

  cameraUrl(entityId: string) { return `api/camera/${entityId}?t=${Date.now()}`; }
}

/** Datos simulados para probar el diseño sin Home Assistant. */
export class DemoClient extends HassBase {
  connect() {
    const st = (entity_id: string, state: string | number, attributes: Record<string, any> = {}): HassEntity => ({ entity_id, state: String(state), attributes });
    this.states = Object.fromEntries([
      st('sensor.salon_temperatura', 23, { unit_of_measurement: '°C', friendly_name: 'Temperatura salón' }),
      st('sensor.salon_humedad', 56, { unit_of_measurement: '%', friendly_name: 'Humedad salón' }),
      st('sensor.pm25', 54, { unit_of_measurement: 'µg/m³', friendly_name: 'Calidad del aire' }),
      st('climate.salon', 'heat', { friendly_name: 'Termostato', current_temperature: 23, temperature: 22 }),
      st('weather.casa', 'sunny', { friendly_name: 'Clima', temperature: 20, humidity: 41 }),
      st('sensor.consumo_electricidad', 135, { unit_of_measurement: 'kWh', friendly_name: 'Electricidad', last_period: 150 }),
      st('sensor.consumo_calefaccion', 220, { unit_of_measurement: 'kWh', friendly_name: 'Calefacción', last_period: 190 }),
      st('sensor.consumo_agua', 131, { unit_of_measurement: 'L', friendly_name: 'Agua', last_period: 160 }),
      st('sensor.consumo_gas', 209, { unit_of_measurement: 'm³', friendly_name: 'Gas', last_period: 200 }),
      st('sensor.consumo_agua_caliente', 158, { unit_of_measurement: 'L', friendly_name: 'Agua caliente', last_period: 170 }),
      st('input_number.piso_ascensor', 15, { friendly_name: 'Ascensor', min: 1, max: 30, step: 1 }),
      st('script.llamar_ascensor', 'off', { friendly_name: 'Llamar ascensor' }),
      st('light.salon', 'on', { friendly_name: 'Luces salón' }),
      st('light.cocina', 'off', { friendly_name: 'Luces cocina' }),
      st('light.dormitorio', 'off', { friendly_name: 'Luces dormitorio' }),
      st('light.todas', 'off', { friendly_name: 'Apagado general' }),
      st('switch.modo_salida', 'on', { friendly_name: 'Modo salida' }),
      st('fan.ventilacion', 'off', { friendly_name: 'Ventilación' }),
      st('lock.puerta_principal', 'locked', { friendly_name: 'Puerta principal' }),
      st('cover.persianas_salon', 'open', { friendly_name: 'Persianas salón' }),
      st('alarm_control_panel.casa', 'disarmed', { friendly_name: 'Alarma', code_format: 'number' }),
      st('sensor.paquetes', 2, { friendly_name: 'Paquetes' }),
      st('camera.entrada', 'idle', { friendly_name: 'Cámara entrada' }),
      st('scene.cine', 'scening', { friendly_name: 'Escena cine' }),
      st('media_player.tv', 'off', { friendly_name: 'TV' }),
    ].map((s) => [s.entity_id, s]));
    this.setStatus('demo', 'Modo demo: datos simulados');
    this.emit(null);
    setInterval(() => this.set('sensor.salon_temperatura', (22.5 + Math.random()).toFixed(1)), 8000);
  }

  private set(id: string, state: string | number, attrs?: Record<string, any>) {
    const s = this.states[id];
    if (!s) return;
    this.states[id] = { ...s, state: String(state), attributes: { ...s.attributes, ...attrs } };
    this.emit(id);
  }

  async callService(_domain: string, service: string, data: Record<string, any> = {}) {
    for (const id of ([] as string[]).concat(data.entity_id || [])) {
      const s = this.states[id];
      if (!s) continue;
      if (service === 'toggle') this.set(id, s.state === 'on' ? 'off' : 'on');
      else if (service === 'turn_on' && !/^(scene|script)\./.test(id)) this.set(id, 'on');
      else if (service === 'turn_off') this.set(id, 'off');
      else if (service === 'lock') this.set(id, 'locked');
      else if (service === 'unlock') this.set(id, 'unlocked');
      else if (service === 'open_cover') this.set(id, 'open');
      else if (service === 'close_cover') this.set(id, 'closed');
      else if (service.startsWith('alarm_arm')) this.set(id, 'armed_' + service.replace('alarm_arm_', ''));
      else if (service === 'alarm_disarm') this.set(id, 'disarmed');
      else if (service === 'set_temperature') this.set(id, s.state, { temperature: data.temperature });
      else if (service === 'set_value') this.set(id, data.value);
    }
  }

  cameraUrl() { return null; }
}

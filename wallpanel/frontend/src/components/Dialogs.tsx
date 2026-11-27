import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Accent, DashboardConfig, Tile, TileType } from '../types';
import { useHass } from '../ha/hooks';
import { friendly, stateText } from '../ha/format';
import { ICONS } from '../icons';
import { useUI, type DialogState } from '../ui';
import { defaultConfig, uid } from '../defaultConfig';

const input = 'rounded-md border border-line bg-bg p-2.5 text-[15px] text-ink outline-none focus:border-copper';
const btn = 'rounded-md border border-line bg-tile px-4 py-2.5';
const primary = 'rounded-md border border-copper bg-copper px-4 py-2.5 text-[#1a1a1a]';

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} onClose={onClose} onCancel={onClose}
      className="m-auto max-h-[88vh] w-[min(560px,92vw)] rounded-xl border border-line bg-bg2 p-0 text-ink backdrop:bg-[#05080f]/70">
      <div className="flex max-h-[88vh] flex-col gap-3.5 overflow-y-auto p-5">
        <h2 className="m-0 text-xl font-normal">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
const Field = ({ label, children, hidden }: { label: string; children: ReactNode; hidden?: boolean }) =>
  hidden ? null : <label className="flex flex-1 flex-col gap-1.5 text-[13px] text-muted">{label}{children}</label>;
const Actions = ({ children }: { children: ReactNode }) => <div className="mt-1.5 flex flex-wrap justify-end gap-2.5">{children}</div>;

// ---------- Editor de tarjeta ----------
const TYPES: Record<TileType, string> = {
  entity: 'Entidad (automático según dominio)',
  'climate-big': 'Temperatura grande',
  weather: 'Clima exterior',
  bars: 'Gráfico de barras',
  number: 'Número con ▲▼ + acción (p. ej. ascensor)',
};
const ACCENTS: Record<Accent, string> = { auto: 'Automático (cobre al estar activa)', none: 'Sin color', copper: 'Cobre', teal: 'Turquesa' };

function TileEditor({ tile, viewIdx, close }: { tile: Tile | null; viewIdx: number; close: () => void }) {
  const { update, config, sectionIdx, openDialog } = useUI();
  const hass = useHass();
  const [t, setT] = useState<Tile>(() => tile ? structuredClone(tile) : { id: uid(), type: 'entity', w: 1, h: 1, accent: 'auto' });
  const [targetView, setTargetView] = useState(viewIdx);
  const [barsText, setBarsText] = useState((tile?.entities || []).map((e) => e.entity + (e.label ? ' | ' + e.label : '')).join('\n'));
  const set = (patch: Partial<Tile>) => setT((x) => ({ ...x, ...patch }));
  const ids = Object.keys(hass.states).sort();
  const views = config.sections[sectionIdx].views;
  const is = (...types: TileType[]) => types.includes(t.type);

  const save = () => {
    const final: Tile = {
      ...t,
      entities: barsText.split('\n').map((l) => l.split('|').map((x) => x.trim())).filter(([e]) => e).map(([entity, label]) => ({ entity, label })),
    };
    update((c) => {
      const vs = c.sections[sectionIdx].views;
      const src = vs[viewIdx].tiles;
      const i = src.findIndex((x) => x.id === final.id);
      if (i >= 0 && targetView === viewIdx) src[i] = final;
      else { if (i >= 0) src.splice(i, 1); vs[targetView].tiles.push(final); }
    });
    close();
  };

  const entityInput = (key: 'entity' | 'humidity' | 'extra' | 'action', placeholder = 'light.salon') => (
    <input className={input} list="wp-entities" value={(t[key] as string) || ''} placeholder={placeholder} autoComplete="off"
      onChange={(e) => set({ [key]: e.target.value.trim() })} />
  );

  return (
    <Modal title={tile ? 'Editar tarjeta' : 'Nueva tarjeta'} onClose={close}>
      <datalist id="wp-entities">{ids.map((i) => <option key={i} value={i}>{friendly(hass.states[i])}</option>)}</datalist>
      <Field label="Tipo">
        <select className={input} value={t.type} onChange={(e) => set({ type: e.target.value as TileType })}>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="Entidad" hidden={is('bars')}>{entityInput('entity')}</Field>
      <Field label="Entidad de humedad (opcional)" hidden={!is('climate-big')}>{entityInput('humidity', 'sensor.humedad')}</Field>
      <Field label="Entidad extra, p. ej. calidad del aire (opcional)" hidden={!is('climate-big')}>{entityInput('extra', 'sensor.pm25')}</Field>
      <Field label="Acción al tocar (script, escena o botón)" hidden={!is('number')}>{entityInput('action', 'script.llamar_ascensor')}</Field>
      {is('number') && (
        <div className="flex gap-2.5">
          <Field label="Texto del botón"><input className={input} value={t.cta || ''} onChange={(e) => set({ cta: e.target.value })} /></Field>
          <Field label="Unidad"><input className={input} value={t.unit || ''} onChange={(e) => set({ unit: e.target.value })} /></Field>
        </div>
      )}
      <Field label="Entidades (una por línea: sensor.x | Etiqueta)" hidden={!is('bars')}>
        <textarea className={`${input} min-h-32 font-mono text-xs`} value={barsText} onChange={(e) => setBarsText(e.target.value)} />
      </Field>
      <Field label="Atributo con el valor anterior para comparar (opcional)" hidden={!is('bars')}>
        <input className={input} value={t.compareAttr || ''} onChange={(e) => set({ compareAttr: e.target.value.trim() })} />
      </Field>
      <Field label="Etiqueta">
        <input className={input} value={t.label || ''} placeholder="(nombre de la entidad)" onChange={(e) => set({ label: e.target.value })} />
      </Field>
      {is('entity', 'number') && (
        <div className="flex gap-2.5">
          {is('entity') && (
            <Field label="Icono">
              <select className={input} value={t.icon || ''} onChange={(e) => set({ icon: e.target.value })}>
                <option value="">(automático)</option>
                {Object.keys(ICONS).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
          )}
          <Field label="Color">
            <select className={input} value={t.accent || 'auto'} onChange={(e) => set({ accent: e.target.value as Accent })}>
              {Object.entries(ACCENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>
      )}
      <Field label="Cámara: mostrar" hidden={!(is('entity') && t.entity?.startsWith('camera.'))}>
        <select className={input} value={t.mode || ''} onChange={(e) => set({ mode: e.target.value as Tile['mode'] })}>
          <option value="">Imagen en vivo</option><option value="icon">Solo icono (abre al tocar)</option>
        </select>
      </Field>
      <div className="flex gap-2.5">
        <Field label="Ancho (columnas)">
          <select className={input} value={t.w} onChange={(e) => set({ w: +e.target.value })}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>
        </Field>
        <Field label="Alto (filas)">
          <select className={input} value={t.h} onChange={(e) => set({ h: +e.target.value })}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>
        </Field>
        <Field label="Vista">
          <select className={input} value={targetView} onChange={(e) => setTargetView(+e.target.value)}>
            {views.map((v, i) => <option key={v.id} value={i}>{v.name}</option>)}
          </select>
        </Field>
      </div>
      <Actions>
        {tile && <button className={`${btn} mr-auto text-alert`} onClick={() => openDialog({
          kind: 'confirm', message: '¿Borrar esta tarjeta?',
          onOk: () => update((c) => { const ts = c.sections[sectionIdx].views[viewIdx].tiles; ts.splice(ts.findIndex((x) => x.id === t.id), 1); }),
        })}>Borrar</button>}
        <button className={btn} onClick={close}>Cancelar</button>
        <button className={primary} onClick={save}>Guardar</button>
      </Actions>
    </Modal>
  );
}

// ---------- Renombrar vista / sección ----------
function RenameDialog({ title, value, onSave, close, extra }: { title: string; value: string; onSave: (v: string) => void; close: () => void; extra?: ReactNode }) {
  const [v, setV] = useState(value);
  return (
    <Modal title={title} onClose={close}>
      <Field label="Nombre"><input autoFocus className={input} value={v} onChange={(e) => setV(e.target.value)} /></Field>
      <Actions>{extra}<button className={btn} onClick={close}>Cancelar</button><button className={primary} onClick={() => { onSave(v.trim() || value); close(); }}>Guardar</button></Actions>
    </Modal>
  );
}

function SectionDialog({ i, close, onSection }: { i: number; close: () => void; onSection: (i: number) => void }) {
  const { config, update, openDialog } = useUI();
  const s = config.sections[i];
  if (!s) return null;
  const move = (dir: number) => { update((c) => { const a = c.sections; [a[i], a[i + dir]] = [a[i + dir], a[i]]; }); onSection(i + dir); close(); };
  return (
    <RenameDialog title="Sección" value={s.name} close={close}
      onSave={(name) => update((c) => { c.sections[i].name = name; })}
      extra={<>
        {config.sections.length > 1 && <button className={`${btn} mr-auto text-alert`} onClick={() => openDialog({
          kind: 'confirm', message: `¿Borrar la sección «${s.name}» con todas sus vistas?`,
          onOk: () => { update((c) => { c.sections.splice(i, 1); }); onSection(0); },
        })}>Borrar</button>}
        {i > 0 && <button className={btn} onClick={() => move(-1)}>◀</button>}
        {i < config.sections.length - 1 && <button className={btn} onClick={() => move(1)}>▶</button>}
      </>} />
  );
}

// ---------- Alarma con teclado ----------
function AlarmDialog({ tile, close }: { tile: Tile; close: () => void }) {
  const hass = useHass();
  const s = hass.states[tile.entity!];
  const [code, setCode] = useState('');
  const needCode = !!s?.attributes?.code_format;
  const go = (service: string) => {
    hass.callService('alarm_control_panel', service, { entity_id: tile.entity, ...(code ? { code } : {}) }).catch((e) => alert(e.message));
    close();
  };
  return (
    <Modal title={`${tile.label || friendly(s)} · ${stateText(s, 'alarm_control_panel')}`} onClose={close}>
      {needCode && (
        <>
          <div className={`${input} h-12 text-center text-2xl tracking-[.5em]`}>{'•'.repeat(code.length) || <span className="text-sm tracking-normal text-muted">Código</span>}</div>
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
              <button key={k} className="rounded-md border border-line bg-tile p-4 text-xl active:bg-line"
                onClick={() => setCode((c) => (k === '⌫' ? c.slice(0, -1) : k === 'C' ? '' : c + k))}>{k}</button>
            ))}
          </div>
        </>
      )}
      <Actions>
        <button className={btn} onClick={close}>Cerrar</button>
        <button className={btn} onClick={() => go('alarm_disarm')}>Desarmar</button>
        <button className={btn} onClick={() => go('alarm_arm_home')}>Armar en casa</button>
        <button className={primary} onClick={() => go('alarm_arm_away')}>Armar ausente</button>
      </Actions>
    </Modal>
  );
}

function CameraDialog({ tile, close }: { tile: Tile; close: () => void }) {
  const hass = useHass();
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 2000); return () => clearInterval(t); }, []);
  const src = hass.cameraUrl(tile.entity!);
  return (
    <Modal title={tile.label || friendly(hass.states[tile.entity!])} onClose={close}>
      {src ? <img key={tick} src={src} className="w-full rounded-md" /> : <p className="text-sm text-muted">Sin imagen (modo demo o cámara no disponible).</p>}
      <Actions><button className={primary} onClick={close}>Cerrar</button></Actions>
    </Modal>
  );
}

// ---------- Ajustes ----------
function SettingsDialog({ close, replaceConfig }: { close: () => void; replaceConfig: (c: DashboardConfig) => void }) {
  const { config, openDialog } = useUI();
  const hass = useHass();
  const [json, setJson] = useState(() => JSON.stringify(config, null, 2));
  const [idle, setIdle] = useState(config.idleReturnSec ?? 120);
  const [err, setErr] = useState('');
  const save = () => {
    try {
      const parsed = JSON.parse(json) as DashboardConfig;
      if (!Array.isArray(parsed.sections) || !parsed.sections.length) throw new Error('Falta "sections"');
      replaceConfig({ ...parsed, idleReturnSec: idle });
      close();
    } catch (e: any) { setErr('JSON no válido: ' + e.message); }
  };
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = 'wallpanel.json'; a.click();
  };
  return (
    <Modal title="Ajustes" onClose={close}>
      <p className="m-0 text-xs leading-relaxed text-muted">
        Conexión: {hass.status === 'ok' ? 'Home Assistant (vía Supervisor)' : hass.status === 'demo' ? 'Modo demo con datos simulados' : hass.statusDetail || hass.status}.
        El tablero se guarda en el add-on y se comparte entre todas las tablets.
      </p>
      <Field label="Volver a la primera vista tras inactividad (segundos, 0 = nunca)">
        <input type="number" min={0} className={input} value={idle} onChange={(e) => setIdle(+e.target.value)} />
      </Field>
      <Field label="Tablero (JSON): copiar para respaldo o pegar para importar">
        <textarea className={`${input} min-h-48 font-mono text-xs`} value={json} onChange={(e) => setJson(e.target.value)} />
      </Field>
      {err && <p className="m-0 text-sm text-alert">{err}</p>}
      <Actions>
        <button className={`${btn} mr-auto text-alert`} onClick={() => openDialog({
          kind: 'confirm', message: '¿Reemplazar el tablero actual por el ejemplo?', onOk: () => replaceConfig(defaultConfig()),
        })}>Restaurar ejemplo</button>
        <button className={btn} onClick={download}>Descargar</button>
        <button className={btn} onClick={close}>Cancelar</button>
        <button className={primary} onClick={save}>Guardar</button>
      </Actions>
    </Modal>
  );
}

function Confirm({ message, onOk, close }: { message: string; onOk: () => void; close: () => void }) {
  return (
    <Modal title="Confirmar" onClose={close}>
      <p className="m-0">{message}</p>
      <Actions><button className={btn} onClick={close}>Cancelar</button><button className={primary} onClick={() => { onOk(); close(); }}>Sí</button></Actions>
    </Modal>
  );
}

export function Dialogs({ dialog, close, onSection, replaceConfig }:
  { dialog: DialogState; close: () => void; onSection: (i: number) => void; replaceConfig: (c: DashboardConfig) => void }) {
  const { config, update, sectionIdx } = useUI();
  if (!dialog) return null;
  switch (dialog.kind) {
    case 'tile': return <TileEditor key={dialog.tile?.id || 'new'} tile={dialog.tile} viewIdx={dialog.viewIdx} close={close} />;
    case 'view': {
      const v = config.sections[sectionIdx].views[dialog.viewIdx];
      return <RenameDialog title="Vista" value={v.name} close={close} onSave={(name) => update((c) => { c.sections[sectionIdx].views[dialog.viewIdx].name = name; })} />;
    }
    case 'section': return <SectionDialog i={dialog.sectionIdx} close={close} onSection={onSection} />;
    case 'settings': return <SettingsDialog close={close} replaceConfig={replaceConfig} />;
    case 'alarm': return <AlarmDialog tile={dialog.tile} close={close} />;
    case 'camera': return <CameraDialog tile={dialog.tile} close={close} />;
    case 'confirm': return <Confirm key={dialog.message} message={dialog.message} onOk={dialog.onOk} close={close} />;
  }
}

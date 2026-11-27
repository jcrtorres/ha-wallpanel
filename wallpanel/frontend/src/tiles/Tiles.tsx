import { useEffect, useState, type ReactNode } from 'react';
import type { Tile } from '../types';
import { useEntity, useEntities, useHass } from '../ha/hooks';
import { condES, domainOf, fmt, friendly, hvacES, isActive, num, stateText } from '../ha/format';
import { runAction } from '../ha/actions';
import { DOMAIN_ICON, ICONS, Icon, WEATHER_ICONS, } from '../icons';
import { useUI } from '../ui';

const ACCENT: Record<string, string> = {
  copper: 'bg-copper text-[#1e1a18]',
  teal: 'bg-teal text-white',
};

/** Contenedor con el estilo base de una tarjeta. */
export function Frame({ tile, active, plain, children, onTap, className = '' }:
  { tile: Tile; active?: boolean; plain?: boolean; children: ReactNode; onTap?: (e: React.MouseEvent) => void; className?: string }) {
  const { editing } = useUI();
  const accent = tile.accent && ACCENT[tile.accent];
  const bg = accent ? accent
    : active && tile.accent !== 'none' ? ACCENT.copper
    : plain ? 'bg-transparent' : 'bg-tile';
  return (
    <div
      onClick={editing ? undefined : onTap}
      className={`relative h-full w-full overflow-hidden rounded-[4px] p-3.5 flex flex-col transition-colors duration-200
        ${bg} ${onTap && !editing ? 'cursor-pointer active:scale-[.98] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

const Muted = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <span className={`opacity-60 ${className}`}>{children}</span>;

// ---------- Temperatura grande ----------
function ClimateBig({ tile }: { tile: Tile }) {
  const s = useEntity(tile.entity);
  const hum = useEntity(tile.humidity);
  const ex = useEntity(tile.extra);
  const temp = domainOf(tile.entity) === 'climate' ? s?.attributes.current_temperature : s?.state;
  return (
    <Frame tile={tile} plain>
      <div className="font-extralight leading-[.9] tracking-tight text-[clamp(60px,11vw,150px)]">
        {fmt(temp)}<sup className="text-[.45em] align-top ml-0.5">°</sup>
        {hum && <span className="text-[.17em] tracking-normal text-muted ml-1">/ {fmt(hum.state)}%</span>}
      </div>
      {ex && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[15px] text-muted">
          <span>{tile.label || friendly(ex)}</span>
          <span className="text-ink font-medium inline-flex items-center gap-1">
            <Icon path={ICONS.smile} size={16} /> {ex.state}{ex.attributes.unit_of_measurement || ''}
          </span>
        </div>
      )}
      <div className="mt-auto h-px w-10 bg-muted" />
    </Frame>
  );
}

// ---------- Clima exterior ----------
function Weather({ tile }: { tile: Tile }) {
  const s = useEntity(tile.entity);
  const a = s?.attributes || {};
  return (
    <Frame tile={tile} plain>
      <div className="mt-auto">
        <div className="flex items-center gap-3">
          <Icon path={WEATHER_ICONS[s?.state || ''] || WEATHER_ICONS.sunny} size={46} />
          <span className="font-extralight text-[clamp(34px,5vw,60px)]">{fmt(a.temperature)}°</span>
          <span className="text-xs leading-relaxed text-muted">{condES(s?.state)}<br />Humedad {fmt(a.humidity)}%</span>
        </div>
        {tile.label && <div className="mt-2.5 text-sm text-muted">{tile.label}</div>}
      </div>
    </Frame>
  );
}

// ---------- Barras de consumo ----------
function Bars({ tile }: { tile: Tile }) {
  const list = tile.entities || [];
  const states = useEntities(list.map((e) => e.entity));
  const rows = list.map((e, i) => ({
    label: e.label || friendly(states[i], e.entity),
    v: num(states[i]?.state),
    p: tile.compareAttr ? num(states[i]?.attributes?.[tile.compareAttr]) : 0,
  }));
  const max = Math.max(1, ...rows.flatMap((r) => [r.v, r.p])) * 1.15;
  return (
    <Frame tile={tile} plain className="!bg-bg2">
      <span className="absolute left-0 top-0 border-solid border-t-[12px] border-r-[12px] border-t-copper border-r-transparent" />
      <span className="absolute right-0 top-0 border-solid border-b-[12px] border-r-[12px] border-b-transparent border-r-copper" />
      <div className="flex justify-between text-sm mt-1 mb-2.5">
        <span>{new Date().toLocaleDateString('es')} · {tile.label}</span>
        {tile.compareAttr && <span className="text-[11px] text-muted"><span className="text-copper">▬</span> actual &nbsp;<span className="text-[#4c5678]">▬</span> anterior</span>}
      </div>
      <div className="flex-1 flex flex-col justify-around gap-1">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[90px_1fr] items-center gap-2.5 text-xs text-muted">
            <span className="truncate">{r.label}</span>
            <div className="relative h-[18px]">
              <div className="absolute left-0 top-1 h-[3px] rounded bg-copper transition-[width] duration-700" style={{ width: `${(r.v / max) * 100}%` }} />
              {r.p > 0 && <div className="absolute left-0 top-2.5 h-[3px] rounded bg-[#4c5678]" style={{ width: `${(r.p / max) * 100}%` }} />}
              <span className="absolute -top-1 translate-x-1.5 text-[11px] text-copper" style={{ left: `${(r.v / max) * 100}%` }}>{fmt(r.v)}</span>
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// ---------- Número con ▲▼ y acción (ascensor) ----------
function NumberTile({ tile }: { tile: Tile }) {
  const hass = useHass();
  const s = useEntity(tile.entity);
  const step = (dir: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = s?.attributes || {};
    const v = Math.min(a.max ?? 1e9, Math.max(a.min ?? -1e9, num(s?.state) + dir * (a.step || 1)));
    hass.callService(domainOf(tile.entity), 'set_value', { entity_id: tile.entity, value: v });
  };
  return (
    <Frame tile={tile} onTap={tile.action ? () => runAction(hass, tile.action!) : undefined}>
      <div className="text-sm">{tile.label || friendly(s)}</div>
      <div className="flex-1 grid place-items-center">
        <div className="flex items-center">
          <div className="flex flex-col gap-1.5 mr-3 text-lg opacity-70">
            <button className="p-1" onClick={step(1)}>▲</button>
            <button className="p-1" onClick={step(-1)}>▼</button>
          </div>
          <span className="font-light leading-none text-[clamp(34px,6vw,72px)]">{fmt(s?.state)}<small className="text-[.4em] opacity-70 ml-1">{tile.unit}</small></span>
        </div>
      </div>
      {tile.action && <div className="text-center pt-2">{tile.cta || 'Ejecutar'}</div>}
    </Frame>
  );
}

// ---------- Cámara ----------
function Camera({ tile }: { tile: Tile }) {
  const hass = useHass();
  const { openDialog } = useUI();
  const s = useEntity(tile.entity);
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 10000); return () => clearInterval(t); }, []);
  const src = tile.entity ? hass.cameraUrl(tile.entity) : null;
  return (
    <Frame tile={tile} className="!p-0" onTap={() => openDialog({ kind: 'camera', tile })}>
      {src ? <img key={tick} src={src} alt="" className="h-full w-full object-cover" />
        : <div className="flex-1 grid place-items-center text-muted"><div className="flex flex-col items-center gap-2"><Icon path={ICONS.cctv} size={48} />Sin imagen (demo)</div></div>}
      <span className="absolute left-3 bottom-2 text-sm [text-shadow:0_1px_3px_#000]">{tile.label || friendly(s)}</span>
    </Frame>
  );
}

// ---------- Termostato ----------
function Thermostat({ tile }: { tile: Tile }) {
  const hass = useHass();
  const s = useEntity(tile.entity);
  const a = s?.attributes || {};
  const set = (d: number) => () => hass.callService('climate', 'set_temperature', { entity_id: tile.entity, temperature: num(a.temperature) + d });
  return (
    <Frame tile={tile}>
      <div className="text-sm">{tile.label || friendly(s)} <Muted>· {hvacES(s?.state)}</Muted></div>
      <div className="flex-1 grid place-items-center text-center">
        <div>
          <div className="font-extralight leading-[.9] text-[clamp(50px,8vw,110px)]">{fmt(a.current_temperature, 1)}<sup className="text-[.45em] align-top">°</sup></div>
          <div className="mt-4 flex items-center justify-center gap-5">
            <button onClick={set(-0.5)} className="h-11 w-11 rounded-full border border-line text-xl">−</button>
            <span>Objetivo <b>{fmt(a.temperature, 1)}°</b></span>
            <button onClick={set(0.5)} className="h-11 w-11 rounded-full border border-line text-xl">+</button>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ---------- Entidad genérica ----------
function EntityTile({ tile }: { tile: Tile }) {
  const hass = useHass();
  const { openDialog } = useUI();
  const s = useEntity(tile.entity);
  const d = domainOf(tile.entity);
  if (d === 'camera' && tile.mode !== 'icon') return <Camera tile={tile} />;
  if (d === 'climate') return <Thermostat tile={tile} />;

  const icon = ICONS[tile.icon || ''] || ICONS[DOMAIN_ICON[d]] || ICONS.power;
  const isValue = ['sensor', 'input_number', 'number'].includes(d) && !tile.icon;
  const big = tile.w > 1 || tile.h > 1;
  const textOnly = ['switch', 'input_boolean', 'lock', 'cover', 'alarm_control_panel', 'sensor', 'binary_sensor'].includes(d);
  const triggered = d === 'alarm_control_panel' && s?.state === 'triggered';
  const onTap = () => {
    if (!tile.entity) return;
    if (d === 'alarm_control_panel') return openDialog({ kind: 'alarm', tile });
    if (d === 'camera') return openDialog({ kind: 'camera', tile });
    runAction(hass, tile.entity);
  };
  return (
    <Frame tile={tile} active={isActive(s)} onTap={onTap}>
      <div className="text-sm leading-tight">{tile.label || friendly(s, tile.entity)}</div>
      {isValue ? (
        <div className="mt-auto font-light text-[clamp(20px,3.2vw,38px)]">{s?.state ?? '--'}<small className="text-[.5em] ml-1">{s?.attributes?.unit_of_measurement}</small></div>
      ) : triggered ? (
        <div className="m-auto mb-1.5 h-[18px] w-[18px] rounded-full bg-alert shadow-[0_0_0_5px_rgba(226,74,74,.25)] animate-pulse" />
      ) : big ? (
        <>
          <div className="mt-auto"><Icon path={icon} size={34} /></div>
          <div className="mt-1.5 text-xl font-light uppercase">{stateText(s, d)}</div>
        </>
      ) : textOnly ? (
        <div className="mt-auto truncate font-light uppercase text-[clamp(16px,2.4vw,32px)]">{stateText(s, d)}</div>
      ) : (
        <div className="mt-auto"><Icon path={icon} size={30} /></div>
      )}
    </Frame>
  );
}

export function TileView({ tile }: { tile: Tile }) {
  switch (tile.type) {
    case 'climate-big': return <ClimateBig tile={tile} />;
    case 'weather': return <Weather tile={tile} />;
    case 'bars': return <Bars tile={tile} />;
    case 'number': return <NumberTile tile={tile} />;
    default: return <EntityTile tile={tile} />;
  }
}

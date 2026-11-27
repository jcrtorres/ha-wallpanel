import { useEffect, useState } from 'react';
import { Icon, UI_ICONS } from '../icons';
import { useConnStatus, useHass } from '../ha/hooks';
import { useUI } from '../ui';
import { uid } from '../defaultConfig';

const DOT: Record<string, string> = { ok: 'bg-emerald-400', demo: 'bg-copper', error: 'bg-alert', connecting: 'bg-muted animate-pulse' };

export function TopBar({ onSection, onToggleEdit }: { onSection: (i: number) => void; onToggleEdit: () => void }) {
  const { config, sectionIdx, editing, openDialog, update } = useUI();
  const status = useConnStatus();
  const hass = useHass();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 10000); return () => clearInterval(t); }, []);

  const btn = 'grid h-10 w-10 place-items-center rounded-full active:bg-tile';
  return (
    <header className="flex h-14 flex-none items-center gap-3 px-5 pt-3 pb-1.5 max-sm:px-2.5">
      <button className={btn} aria-label="Siguiente sección" onClick={() => onSection((sectionIdx + 1) % config.sections.length)}>
        <Icon path={UI_ICONS.menu} size={24} />
      </button>
      <nav className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
        {config.sections.map((s, i) => (
          <button
            key={s.id}
            onClick={() => (editing && i === sectionIdx ? openDialog({ kind: 'section', sectionIdx: i }) : onSection(i))}
            className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] tracking-wide ${i === sectionIdx ? 'bg-tile text-ink' : 'text-muted'}`}
          >
            {s.name}{editing && i === sectionIdx && <span className="ml-1.5 opacity-60">✎</span>}
          </button>
        ))}
        {editing && (
          <button
            className="whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] text-copper"
            onClick={() => {
              update((c) => c.sections.push({ id: uid(), name: 'Nueva sección', views: [{ id: uid(), name: 'Vista 1', tiles: [] }] }));
              onSection(config.sections.length);
              openDialog({ kind: 'section', sectionIdx: config.sections.length });
            }}
          >+ Sección</button>
        )}
      </nav>
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${DOT[status]}`} title={hass.statusDetail || status} />
        <button className={`${btn} ${editing ? '!bg-copper text-[#1a1a1a]' : ''}`} onClick={onToggleEdit} aria-label="Editar tablero">
          <Icon path={editing ? UI_ICONS.check : UI_ICONS.edit} size={22} />
        </button>
        <button className={btn} onClick={() => openDialog({ kind: 'settings' })} aria-label="Ajustes">
          <Icon path={UI_ICONS.gear} size={22} />
        </button>
        <span className="ml-2.5 text-[26px] font-light tabular-nums max-sm:text-xl">
          {now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </header>
  );
}

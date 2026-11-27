import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DashboardConfig } from './types';
import { UIContext, type DialogState } from './ui';
import { TopBar } from './components/TopBar';
import { Pager } from './components/Pager';
import { Dialogs } from './components/Dialogs';
import { saveConfig, loadConfig } from './storage';
import { useHass } from './ha/hooks';

export function App({ initial }: { initial: DashboardConfig }) {
  const hass = useHass();
  const [config, setConfig] = useState(initial);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [goHome, setGoHome] = useState(0);
  const saveTimer = useRef<number>(undefined);

  const persist = useCallback((c: DashboardConfig) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveConfig(c).catch((e) => console.warn(e)), 400);
  }, []);

  const update = useCallback((fn: (d: DashboardConfig) => void) => {
    setConfig((prev) => {
      const next = structuredClone(prev);
      fn(next);
      next.updatedAt = Date.now();
      persist(next);
      return next;
    });
  }, [persist]);

  const replaceConfig = useCallback((c: DashboardConfig) => {
    const next = { ...c, updatedAt: Date.now() };
    setConfig(next); persist(next); setSectionIdx(0);
  }, [persist]);

  // Otra tablet guardó cambios: recargar (si no estamos editando aquí).
  useEffect(() => {
    hass.onConfigUpdated = async () => {
      const c = await loadConfig();
      if (c) setConfig((prev) => (c.updatedAt > prev.updatedAt ? c : prev));
    };
  }, [hass]);

  // Volver a la vista principal tras inactividad.
  const last = useRef(Date.now());
  useEffect(() => {
    const touch = () => (last.current = Date.now());
    ['pointerdown', 'keydown', 'wheel'].forEach((e) => window.addEventListener(e, touch, { capture: true, passive: true }));
    const t = setInterval(() => {
      const n = config.idleReturnSec;
      if (!n || editing || dialog || Date.now() - last.current < n * 1000) return;
      last.current = Date.now();
      setSectionIdx(0); setGoHome((x) => x + 1);
    }, 5000);
    return () => { clearInterval(t); ['pointerdown', 'keydown', 'wheel'].forEach((e) => window.removeEventListener(e, touch, { capture: true })); };
  }, [config.idleReturnSec, editing, dialog]);

  const safeIdx = Math.min(sectionIdx, config.sections.length - 1);
  const section = config.sections[safeIdx];
  const ctx = useMemo(() => ({ editing, openDialog: setDialog, config, update, sectionIdx: safeIdx }), [editing, config, update, safeIdx]);

  return (
    <UIContext.Provider value={ctx}>
      <div className="flex h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <TopBar onSection={setSectionIdx} onToggleEdit={() => setEditing((e) => !e)} />
        {section && <Pager section={section} goHomeSignal={goHome} />}
      </div>
      <Dialogs dialog={dialog} close={() => setDialog(null)} onSection={setSectionIdx} replaceConfig={replaceConfig} />
    </UIContext.Provider>
  );
}

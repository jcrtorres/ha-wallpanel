import { useEffect, useState } from 'react';
import { DndContext, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tile, View } from '../types';
import { TileView } from '../tiles/Tiles';
import { Icon, UI_ICONS } from '../icons';
import { useUI } from '../ui';

const SIZES: [number, number][] = [[1, 1], [2, 1], [1, 2], [2, 2], [3, 2], [4, 2], [3, 3], [4, 4], [6, 2], [6, 4]];

/** Rejilla según orientación: 6x4 horizontal, 4x6 vertical, 2x6 en móvil. */
export function useGridDims() {
  const get = () => {
    const w = window.innerWidth, h = window.innerHeight;
    if (w < 700) return { cols: 2, rows: 6 };
    return w >= h ? { cols: 6, rows: 4 } : { cols: 4, rows: 6 };
  };
  const [dims, setDims] = useState(get);
  useEffect(() => { const f = () => setDims(get()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return dims;
}

function SortableTile({ tile, viewIdx, cols, rows }: { tile: Tile; viewIdx: number; cols: number; rows: number }) {
  const { editing, openDialog, update, sectionIdx } = useUI();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id, disabled: !editing });
  const mutate = (fn: (tiles: Tile[], i: number) => void) =>
    update((c) => { const tiles = c.sections[sectionIdx].views[viewIdx].tiles; fn(tiles, tiles.findIndex((t) => t.id === tile.id)); });

  const tool = 'grid h-8 w-8 place-items-center rounded-full bg-[#0a0e19]/85 text-white';
  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: `span ${Math.min(tile.w || 1, cols)}`,
        gridRow: `span ${Math.min(tile.h || 1, rows)}`,
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={`relative min-h-0 min-w-0 ${editing ? 'outline outline-1 -outline-offset-1 outline-dashed outline-line touch-none' : ''} ${isDragging ? 'opacity-60' : ''}`}
      {...(editing ? { ...attributes, ...listeners } : {})}
      onClick={editing ? () => openDialog({ kind: 'tile', tile, viewIdx }) : undefined}
    >
      <TileView tile={tile} />
      {editing && (
        <div className="absolute bottom-1.5 right-1.5 z-10 flex gap-1" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <button className={tool} title="Cambiar tamaño" onClick={() => mutate((ts, i) => {
            const k = SIZES.findIndex(([w, h]) => w === ts[i].w && h === ts[i].h);
            [ts[i].w, ts[i].h] = SIZES[(k + 1) % SIZES.length];
          })}><Icon path={UI_ICONS.resize} size={16} /></button>
          <button className={`${tool} text-alert`} title="Borrar" onClick={() =>
            openDialog({ kind: 'confirm', message: '¿Borrar esta tarjeta?', onOk: () => mutate((ts, i) => ts.splice(i, 1)) })
          }><Icon path={UI_ICONS.trash} size={16} /></button>
        </div>
      )}
    </div>
  );
}

export function ViewGrid({ view, viewIdx }: { view: View; viewIdx: number }) {
  const { editing, update, sectionIdx, openDialog } = useUI();
  const { cols, rows } = useGridDims();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    update((c) => {
      const v = c.sections[sectionIdx].views[viewIdx];
      v.tiles = arrayMove(v.tiles, v.tiles.findIndex((t) => t.id === active.id), v.tiles.findIndex((t) => t.id === over.id));
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={view.tiles.map((t) => t.id)} strategy={rectSortingStrategy}>
        <div
          className="grid h-full min-h-0 flex-1 gap-2.5 [grid-auto-flow:dense]"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,1fr))`, gridAutoRows: 'minmax(0,1fr)' }}
        >
          {view.tiles.map((t) => <SortableTile key={t.id} tile={t} viewIdx={viewIdx} cols={cols} rows={rows} />)}
          {editing && (
            <button
              onClick={() => openDialog({ kind: 'tile', tile: null, viewIdx })}
              className="grid place-items-center rounded border-2 border-dashed border-line text-sm text-muted"
            >
              <span className="flex items-center gap-1"><Icon path={UI_ICONS.plus} size={18} /> Añadir tarjeta</span>
            </button>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

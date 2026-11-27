import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Mousewheel } from 'swiper/modules';
import type { Swiper as SwiperT } from 'swiper';
import 'swiper/css';
import type { Section } from '../types';
import { ViewGrid } from './ViewGrid';
import { useUI } from '../ui';
import { uid } from '../defaultConfig';

/** Vistas de una sección: cada una ocupa la pantalla y se cambian deslizando. */
export function Pager({ section, goHomeSignal }: { section: Section; goHomeSignal: number }) {
  const { editing, update, sectionIdx, openDialog } = useUI();
  const swiperRef = useRef<SwiperT | null>(null);
  const [active, setActive] = useState(0);
  const n = section.views.length;

  useEffect(() => { swiperRef.current?.slideTo(0); }, [goHomeSignal]);
  useEffect(() => { if (swiperRef.current) swiperRef.current.allowTouchMove = !editing; }, [editing]);
  useEffect(() => { if (active > n - 1) swiperRef.current?.slideTo(n - 1, 0); }, [n, active]);

  const chip = 'rounded-full border border-line bg-tile px-3 py-1.5 text-[13px]';
  const moveView = (i: number, dir: number) => {
    update((c) => { const vs = c.sections[sectionIdx].views; [vs[i], vs[i + dir]] = [vs[i + dir], vs[i]]; });
    setTimeout(() => swiperRef.current?.slideTo(i + dir), 0);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
        <Swiper
          key={section.id}
          modules={[Keyboard, Mousewheel]}
          keyboard={{ enabled: true }}
          mousewheel={{ forceToAxis: true }}
          allowTouchMove={!editing}
          resistanceRatio={0.4}
          speed={380}
          onSwiper={(s) => { swiperRef.current = s; setActive(s.activeIndex); }}
          onSlideChange={(s) => setActive(s.activeIndex)}
        >
          {section.views.map((v, vi) => (
            <SwiperSlide key={v.id}>
              <div className="flex h-full flex-col px-5 pb-1 pt-2 max-sm:px-2.5">
                {editing && (
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="flex-1 text-sm uppercase tracking-[.08em] text-muted">Vista {vi + 1}/{n} · {v.name}</span>
                    <button className={chip} onClick={() => openDialog({ kind: 'view', viewIdx: vi })}>Renombrar</button>
                    {vi > 0 && <button className={chip} onClick={() => moveView(vi, -1)}>◀ Mover</button>}
                    {vi < n - 1 && <button className={chip} onClick={() => moveView(vi, 1)}>Mover ▶</button>}
                    <button className={chip} onClick={() => {
                      update((c) => c.sections[sectionIdx].views.splice(vi + 1, 0, { id: uid(), name: `Vista ${n + 1}`, tiles: [] }));
                      setTimeout(() => swiperRef.current?.slideTo(vi + 1), 0);
                    }}>+ Vista</button>
                    {n > 1 && <button className={`${chip} text-alert`} onClick={() => openDialog({
                      kind: 'confirm', message: `¿Borrar la vista «${v.name}» y sus tarjetas?`,
                      onOk: () => update((c) => { c.sections[sectionIdx].views.splice(vi, 1); }),
                    })}>Borrar vista</button>}
                  </div>
                )}
                <ViewGrid view={v} viewIdx={vi} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <footer className="flex h-7 flex-none items-center justify-center gap-2">
        {n > 1 && section.views.map((v, i) => (
          <button
            key={v.id}
            aria-label={v.name}
            onClick={() => swiperRef.current?.slideTo(i)}
            className={`h-[7px] rounded-full transition-all duration-200 ${i === active ? 'w-[22px] bg-copper' : 'w-[7px] bg-line'}`}
          />
        ))}
      </footer>
    </div>
  );
}

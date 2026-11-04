import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Cone, Vinyl, VuMeter, Wave } from './Art.jsx';

export default function VisionBoard({ t }) {
  const [flipped, setFlipped] = useState({});
  const tile = 'rounded-xl border border-edge overflow-hidden';

  return (
    <>
      <h2 className="font-display text-6xl uppercase sm:text-8xl">{t.title}</h2>
      <p className="mt-4 max-w-2xl text-lg text-mute">{t.intro}</p>

      <div className="mt-10 grid auto-rows-[170px] grid-cols-2 gap-4 md:grid-cols-4">
        <div className={`${tile} brushed col-span-2 row-span-2 flex flex-col justify-end p-6`}>
          <Wave className="mb-auto h-20 w-full text-amber" />
          <p className="metal font-display text-4xl uppercase leading-none sm:text-6xl">{t.quote}</p>
          <p className="mt-3 font-mono text-xs uppercase tracking-widest text-mute">{t.quoteSub}</p>
        </div>

        <div className={`${tile} group flex items-center justify-center bg-panel p-4 text-bone`}>
          <VuMeter className="w-full" />
        </div>
        <div className={`${tile} group flex items-center justify-center bg-ink p-4`}>
          <Vinyl className="h-full animate-[spin_6s_linear_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running]" />
        </div>

        <div className={`${tile} col-span-2 flex flex-col justify-center bg-amber p-6 text-ink`}>
          <p className="font-display text-5xl leading-none sm:text-6xl">{t.range}</p>
          <p className="mt-2 font-mono text-xs uppercase tracking-widest">{t.rangeSub}</p>
        </div>

      </div>

      <h3 className="mb-4 mt-12 font-mono text-xs uppercase tracking-[.3em] text-mute">— {t.targets}</h3>
      <div className="grid auto-rows-[170px] grid-cols-2 gap-4 md:grid-cols-4">
        {t.brands.map((b, i) => {
          const on = !!flipped[b.name];
          return (
            <button
              key={b.name}
              type="button"
              aria-pressed={on}
              onClick={() => setFlipped((f) => ({ ...f, [b.name]: !f[b.name] }))}
              className={`${tile} group relative text-left [perspective:900px] ${i === 0 ? 'md:col-span-2' : ''}`}
            >
              <div className={`relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] ${on ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="brushed absolute inset-0 flex flex-col justify-between p-5 [backface-visibility:hidden]">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-mute">{b.country}</span>
                  <span className="metal font-display text-3xl uppercase leading-none sm:text-4xl">{b.name}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber opacity-70 group-hover:opacity-100">
                    <RotateCw className="size-3" aria-hidden="true" /> {t.flip}
                  </span>
                </div>
                <div className="absolute inset-0 flex flex-col justify-between bg-amber p-5 text-ink [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={!on}>
                  <span className="font-display text-4xl leading-none">{b.year}</span>
                  <span className="text-sm font-medium leading-snug">{b.note}</span>
                </div>
              </div>
            </button>
          );
        })}

        <div className={`${tile} col-span-2 flex items-center justify-center bg-panel p-4 text-bone/70 md:col-span-1`}>
          <Cone className="h-full" />
        </div>
      </div>
    </>
  );
}

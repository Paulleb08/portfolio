import { GraduationCap } from 'lucide-react';

const SEGMENTS = 5;

export default function Skills({ t }) {
  const s = t.school;
  return (
    <>
      <h2 className="font-display text-6xl uppercase sm:text-8xl">{t.title}</h2>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <article className="brushed rounded-xl border border-edge p-6">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-amber">
            <GraduationCap className="size-4" aria-hidden="true" /> {s.label} · {s.period}
          </p>
          <h3 className="mt-4 font-display text-3xl uppercase leading-tight">{s.name}</h3>
          <p className="mt-2 text-mute">{s.org}</p>
          <ul className="mt-6 space-y-2">
            {s.modules.map((m, i) => (
              <li key={m} className="flex items-center gap-3 border-t border-edge pt-2">
                <span className="font-mono text-xs text-amber">0{i + 1}</span> {m}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-edge bg-panel p-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-mute">{t.matrixTitle}</h3>
          <ul className="mt-4 divide-y divide-edge">
            {t.items.map((it) => (
              <li key={it.name} className="grid gap-2 py-4 sm:grid-cols-[180px_1fr] sm:items-center">
                <p className="font-semibold">{it.name}</p>
                <div>
                  {/* Vumètre à 5 segments : segments allumés = niveau */}
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1" role="img" aria-label={`${it.level}/${SEGMENTS} — ${t.levelNames[it.level - 1]}`}>
                      {Array.from({ length: SEGMENTS }, (_, i) => (
                        <span key={i} className={`h-3 w-7 rounded-sm sm:w-9 ${i < it.level ? 'led-on' : 'bg-edge'}`} />
                      ))}
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-amber">{t.levelNames[it.level - 1]}</span>
                  </div>
                  <p className="mt-2 text-sm text-mute">{it.tools}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </>
  );
}

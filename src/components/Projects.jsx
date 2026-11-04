import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { projectArt } from './Art.jsx';

export default function Projects({ t }) {
  const [open, setOpen] = useState(null);
  const dialog = useRef(null);
  const p = t.items.find((x) => x.id === open);
  const Art = p && projectArt[p.id];

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  return (
    <>
      <h2 className="font-display text-6xl uppercase sm:text-8xl">{t.title}</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {t.items.map((item, i) => {
          const A = projectArt[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpen(item.id)}
              className="group flex flex-col overflow-hidden rounded-xl border border-edge bg-panel text-left transition duration-300 hover:-translate-y-1 hover:border-amber"
            >
              <div className="brushed relative flex aspect-[16/10] items-center justify-center p-6 text-bone/80 transition-colors group-hover:text-bone">
                <span className="absolute left-4 top-4 font-mono text-xs text-mute">0{i + 1}</span>
                <A className="w-full max-w-[280px] transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="font-display text-2xl uppercase leading-tight">{item.name}</h3>
                <p className="text-sm text-mute">{item.tagline}</p>
                <ul className="mt-auto flex flex-wrap gap-2 pt-2">
                  {item.tags.map((tag) => (
                    <li key={tag} className="rounded-full border border-edge px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-mute">{tag}</li>
                  ))}
                </ul>
                <span className="flex items-center gap-1 text-sm font-semibold text-amber">
                  {t.open} <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        aria-labelledby="project-title"
        className="m-auto w-[min(860px,calc(100vw-2rem))] max-h-[90vh] overflow-y-auto rounded-2xl border border-edge bg-panel p-0 text-bone"
      >
        {p && (
          <div>
            <div className="brushed relative flex items-center justify-center p-6 text-bone">
              <Art className="h-44 w-full max-w-sm sm:h-52" />
              <button type="button" onClick={() => dialog.current.close()} aria-label={t.close} className="absolute right-4 top-4 rounded-full border border-edge bg-ink/70 p-2 hover:border-amber hover:text-amber">
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-7 p-6 sm:p-8">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-amber">{p.tags.join(' · ')}</p>
                <h3 id="project-title" className="mt-2 font-display text-4xl uppercase leading-none sm:text-5xl">{p.name}</h3>
              </div>
              <Block label={t.labels.context}><p className="leading-relaxed text-mute">{p.context}</p></Block>
              <Block label={t.labels.solution}>
                <ul className="space-y-2">
                  {p.solution.map((s) => (
                    <li key={s} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber" />{s}</li>
                  ))}
                </ul>
              </Block>
              <Block label={t.labels.chain}>
                <ol className="flex flex-wrap items-center gap-2">
                  {p.chain.map((c, i) => (
                    <li key={c} className="flex items-center gap-2 text-sm">
                      <span className="rounded-md border border-edge bg-ink px-3 py-1.5">{c}</span>
                      {i < p.chain.length - 1 && <span className="text-amber" aria-hidden="true">→</span>}
                    </li>
                  ))}
                </ol>
              </Block>
              <Block label={t.labels.skills}>
                <ul className="flex flex-wrap gap-2">
                  {p.skills.map((s) => <li key={s} className="rounded-full bg-amber/10 px-3 py-1 text-sm text-amber">{s}</li>)}
                </ul>
              </Block>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

function Block({ label, children }) {
  return (
    <section>
      <h4 className="mb-3 border-b border-edge pb-2 font-mono text-xs uppercase tracking-widest text-mute">{label}</h4>
      {children}
    </section>
  );
}

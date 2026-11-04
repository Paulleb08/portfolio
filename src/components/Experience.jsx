export default function Experience({ t }) {
  const cols = ['period', 'role', 'org', 'missions', 'skills'];
  return (
    <>
      <h2 className="font-display text-6xl uppercase sm:text-8xl">{t.title}</h2>
      <div className="mt-10 overflow-x-auto rounded-xl border border-edge" tabIndex={0} role="region" aria-label={t.title}>
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead>
            <tr className="brushed">
              <th scope="col" className="w-12 border-b-2 border-amber px-3 py-3 font-mono text-[11px] text-mute">#</th>
              {cols.map((c) => (
                <th key={c} scope="col" className="border-b-2 border-l border-amber border-l-edge px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-bone">
                  {t.cols[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={r.role} className="transition-colors odd:bg-panel hover:bg-amber/5">
                <td className="border-t border-edge px-3 py-4 align-top font-mono text-xs text-mute">{String(i + 1).padStart(2, '0')}</td>
                <td className="whitespace-nowrap border-l border-t border-edge px-4 py-4 align-top font-mono text-amber">{r.period}</td>
                <td className="border-l border-t border-edge px-4 py-4 align-top font-semibold">{r.role}</td>
                <td className="border-l border-t border-edge px-4 py-4 align-top text-mute">{r.org}</td>
                <td className="border-l border-t border-edge px-4 py-4 align-top">{r.missions}</td>
                <td className="border-l border-t border-edge px-4 py-4 align-top text-mute">{r.skills}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

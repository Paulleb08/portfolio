import { useLayoutEffect, useRef, useState } from 'react';
import { BriefcaseBusiness, Disc3, FolderOpen, GraduationCap } from 'lucide-react';

export const TABS = [
  { id: 'projects', icon: FolderOpen },
  { id: 'experience', icon: BriefcaseBusiness },
  { id: 'skills', icon: GraduationCap },
  { id: 'vision', icon: Disc3 },
];

export default function Tabs({ labels, active, onChange }) {
  const refs = useRef({});
  const [pill, setPill] = useState(null);

  // La pastille ambre glisse sous l'onglet actif (largeurs variables selon la langue)
  useLayoutEffect(() => {
    const place = () => {
      const el = refs.current[active];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [active, labels]);

  const onKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const i = (TABS.findIndex((x) => x.id === active) + step + TABS.length) % TABS.length;
    onChange(TABS[i].id);
    refs.current[TABS[i].id]?.focus();
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pt-8 sm:mx-0 sm:px-0">
      <div role="tablist" onKeyDown={onKeyDown} className="relative flex w-max gap-2">
        {pill && (
          <span aria-hidden="true" className="absolute inset-y-0 rounded-full bg-amber transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]" style={pill} />
        )}
        {TABS.map(({ id, icon: Icon }) => {
          const on = id === active;
          return (
            <button
              key={id}
              ref={(el) => (refs.current[id] = el)}
              id={`tab-${id}`}
              role="tab"
              aria-selected={on}
              aria-controls={`panel-${id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(id)}
              className={`relative flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${on ? 'border-amber text-ink' : 'border-edge text-bone hover:border-mute'}`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {labels[id]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

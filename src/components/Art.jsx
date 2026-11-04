// Illustrations au trait (SVG) et logos sociaux absents de Lucide.
const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

// Tuyère convergente-divergente, flux et aspiration latérale
function Venturi(props) {
  return (
    <svg viewBox="0 0 320 180" {...line} {...props} aria-hidden="true">
      <path d="M20 40 L130 75 H190 L300 30" /><path d="M20 140 L130 105 H190 L300 150" />
      <path d="M160 105 V165 M150 165 h20" /><path d="M160 160 v-40" strokeDasharray="4 5" className="text-amber" stroke="currentColor" />
      <g className="text-amber" stroke="currentColor"><path d="M30 90 H110 M100 82 l10 8 -10 8" /><path d="M210 90 H290 M280 82 l10 8 -10 8" /></g>
      <path d="M130 75 V105 M190 75 V105" strokeDasharray="3 4" opacity=".5" />
      <path d="M232 52 q6 -6 12 0 t12 0 M238 128 q6 6 12 0 t12 0" opacity=".6" />
    </svg>
  );
}

// Enceinte sur support pan / tilt suivant l'auditeur
function Tracker(props) {
  return (
    <svg viewBox="0 0 320 180" {...line} {...props} aria-hidden="true">
      <rect x="56" y="34" width="60" height="86" rx="6" /><circle cx="86" cy="58" r="8" /><circle cx="86" cy="94" r="17" />
      <path d="M86 120 V146 M60 156 H112 M86 146 v10" /><path d="M58 140 a34 14 0 0 0 56 0" className="text-amber" stroke="currentColor" />
      <path d="M126 50 a30 30 0 0 1 0 46" className="text-amber" stroke="currentColor" />
      <g className="text-amber" stroke="currentColor"><path d="M130 77 L238 96" strokeDasharray="5 6" /></g>
      <circle cx="256" cy="84" r="12" /><path d="M236 140 q20 -36 40 0" />
      <path d="M150 66 q8 11 0 22 M164 60 q12 17 0 34" opacity=".6" />
    </svg>
  );
}

// Manivelle, train d'engrenages, génératrice et USB
function Dynamo(props) {
  return (
    <svg viewBox="0 0 320 180" {...line} {...props} aria-hidden="true">
      <circle cx="70" cy="96" r="40" /><circle cx="70" cy="96" r="5" /><path d="M70 96 L40 56 M40 56 h-14" />
      <circle cx="140" cy="96" r="22" /><circle cx="140" cy="96" r="4" />
      <circle cx="186" cy="96" r="13" /><circle cx="186" cy="96" r="3" />
      <rect x="208" y="74" width="48" height="44" rx="6" /><path d="M222 88 h20 M222 96 h20 M222 104 h20" opacity=".6" />
      <g className="text-amber" stroke="currentColor"><path d="M256 96 H290" /><rect x="290" y="88" width="16" height="16" rx="2" /><path d="M276 70 l-8 14 h10 l-8 14" /></g>
    </svg>
  );
}

export const projectArt = { venturi: Venturi, tracker: Tracker, dynamo: Dynamo };

export function Cone(props) {
  return (
    <svg viewBox="0 0 200 200" {...line} {...props} aria-hidden="true">
      <circle cx="100" cy="100" r="86" /><circle cx="100" cy="100" r="74" opacity=".5" /><circle cx="100" cy="100" r="44" />
      <circle cx="100" cy="100" r="18" className="text-amber" stroke="currentColor" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={100 + 80 * Math.cos((a * Math.PI) / 180)} cy={100 + 80 * Math.sin((a * Math.PI) / 180)} r="3" />
      ))}
    </svg>
  );
}

export function VuMeter(props) {
  return (
    <svg viewBox="0 0 220 130" {...line} {...props} aria-hidden="true">
      <path d="M30 100 A85 85 0 0 1 190 100" opacity=".5" />
      {[-60, -40, -20, 0, 20, 40, 60].map((a, i) => {
        const r = (a - 90) * (Math.PI / 180);
        return <path key={a} d={`M${110 + 72 * Math.cos(r)} ${112 + 72 * Math.sin(r)} L${110 + 84 * Math.cos(r)} ${112 + 84 * Math.sin(r)}`} className={i > 4 ? 'text-amber' : ''} stroke="currentColor" />;
      })}
      <path d="M110 112 L150 52" className="origin-[110px_112px] text-amber transition-transform duration-700 group-hover:rotate-[25deg]" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="110" cy="112" r="5" fill="currentColor" />
    </svg>
  );
}

export function Vinyl(props) {
  return (
    <svg viewBox="0 0 200 200" {...props} aria-hidden="true">
      <circle cx="100" cy="100" r="92" fill="#111" stroke="#333" />
      {[80, 70, 60, 50].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#2a2a2a" />)}
      <circle cx="100" cy="100" r="30" fill="currentColor" className="text-amber" /><circle cx="100" cy="100" r="4" fill="#111" />
      <path d="M40 60 A70 70 0 0 1 80 34" fill="none" stroke="rgb(255 255 255 / .18)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export function Wave(props) {
  const d = Array.from({ length: 121 }, (_, i) => {
    const x = i * 5;
    const y = 50 + 38 * Math.sin(i / 2.2) * Math.exp(-Math.pow((i - 60) / 34, 2));
    return `${i ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 600 100" preserveAspectRatio="none" {...props} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

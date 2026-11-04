import { Download, Globe, Mail } from 'lucide-react';
import { profile } from '../content.js';
import { GithubIcon, LinkedinIcon } from './Art.jsx';

function LangKnob({ lang, setLang, label }) {
  const next = lang === 'fr' ? 'en' : 'fr';
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      {['fr', 'en'].map((l, i) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest ${i ? 'order-3' : ''} ${lang === l ? 'text-amber' : 'text-mute hover:text-bone'}`}
        >
          <span className={`size-1.5 rounded-full ${lang === l ? 'led-on' : 'bg-edge'}`} />
          {l.toUpperCase()}
        </button>
      ))}
      {/* Bouton rotatif : un clic bascule la langue, l'index pointe la langue active */}
      <button
        type="button"
        onClick={() => setLang(next)}
        aria-label={`${label} : ${next.toUpperCase()}`}
        className="knob relative order-2 size-11 rounded-full transition-transform duration-500 ease-out"
        style={{ transform: `rotate(${lang === 'fr' ? -45 : 45}deg)` }}
      >
        <span className="absolute left-1/2 top-1.5 h-3 w-0.5 -translate-x-1/2 rounded bg-amber" />
      </button>
    </div>
  );
}

export default function Header({ t, lang, setLang }) {
  const links = [
    { href: `mailto:${profile.email}`, label: profile.email, icon: Mail },
    { href: profile.github, label: 'GitHub', icon: GithubIcon },
    profile.linkedin && { href: profile.linkedin, label: 'LinkedIn', icon: LinkedinIcon },
  ].filter(Boolean);

  return (
    <header>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-8 sm:pt-12">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <p className="font-mono text-xs uppercase tracking-[.25em] text-mute">{t.kicker}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {links.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener" className="flex items-center gap-2 underline-offset-4 hover:text-amber hover:underline">
                  <Icon className="size-4" aria-hidden="true" /> {label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <h1 className="metal mt-6 font-display text-[clamp(4rem,15vw,12.5rem)] uppercase leading-[.85] tracking-tight">Paul Signe</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div className="max-w-2xl space-y-4">
            <p className="text-lg font-semibold text-bone">{t.role}</p>
            <p className="text-lg leading-relaxed text-mute">{t.pitch}</p>
          </div>

          {/* Façade de l'ampli : statut, CV, langue, domaine */}
          <div className="brushed rounded-xl border border-edge p-5 shadow-2xl shadow-black/60">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-bone">
                <span className="led-on size-2 animate-pulse rounded-full" /> {t.status}
              </p>
              <LangKnob lang={lang} setLang={setLang} label={t.langLabel} />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <a href={profile.cv} download className="inline-flex items-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-semibold text-ink transition hover:bg-bone">
                <Download className="size-4" aria-hidden="true" /> {t.cv}
              </a>
              <span className="font-mono text-xs text-mute">{t.cvHint}</span>
            </div>
            <p className="mt-5 flex items-center gap-2 border-t border-edge pt-4 font-mono text-xs uppercase tracking-[.3em] text-mute">
              <Globe className="size-3.5 text-amber" aria-hidden="true" /> {profile.domain}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-12 h-1 bg-amber" />
    </header>
  );
}

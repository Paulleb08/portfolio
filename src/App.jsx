import { useEffect, useState } from 'react';
import { content } from './content.js';
import Header from './components/Header.jsx';
import Tabs, { TABS } from './components/Tabs.jsx';
import Projects from './components/Projects.jsx';
import Experience from './components/Experience.jsx';
import Skills from './components/Skills.jsx';
import VisionBoard from './components/VisionBoard.jsx';

function initialLang() {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {}
  return navigator.language?.startsWith('fr') ? 'fr' : 'en';
}

const PANELS = { projects: Projects, experience: Experience, skills: Skills, vision: VisionBoard };

export default function App() {
  const [lang, setLang] = useState(initialLang);
  const [tab, setTab] = useState(TABS[0].id);
  const t = content[lang];
  const Panel = PANELS[tab];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.meta.title;
    try { localStorage.setItem('lang', lang); } catch {}
  }, [lang, t]);

  return (
    <>
      <Header t={t.header} lang={lang} setLang={setLang} />
      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-8">
        <Tabs labels={t.tabs} active={tab} onChange={setTab} />
        <section key={tab} id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="animate-rise pt-10">
          <Panel t={t[tab]} />
        </section>
      </main>
      <footer className="border-t-4 border-amber">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 py-12 sm:px-8">
          <p className="metal font-display text-6xl uppercase leading-none sm:text-8xl">Paul Signe</p>
          <div className="font-mono text-xs uppercase tracking-widest text-mute">
            <p>{t.footer.made} · paul-signe.fr · © {new Date().getFullYear()}</p>
            <a className="mt-2 inline-block underline underline-offset-4 hover:text-amber" href="recrutement/">{t.footer.school}</a>
          </div>
        </div>
      </footer>
    </>
  );
}

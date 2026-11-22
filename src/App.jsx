import { useCallback, useEffect, useRef, useState } from 'react';
import { COPY } from './copy.js';
import { Showcase, hasWebGL } from './showcase.js';
import { setupStory } from './story.js';
import HotspotLayer from './components/HotspotLayer.jsx';
import Hud from './components/Hud.jsx';
import SpecDrawer from './components/SpecDrawer.jsx';
import { Hero, Design, Anatomy, Technology, InPlace, Explore, RequestForm, Footer } from './components/Sections.jsx';

function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const storyRef = useRef(null);
  const hotspotRef = useRef(null);
  const specBtnRef = useRef(null);

  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const coarse = useMedia('(pointer: coarse)');
  const [webgl] = useState(() => hasWebGL());
  const [engineFailed, setEngineFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const [active, setActive] = useState('hero');
  const [navDark, setNavDark] = useState(true);
  const [navDarkFooter, setNavDarkFooter] = useState(false);
  const [explore, setExplore] = useState(false);
  const [env, setEnv] = useState('studio');
  const [finish, setFinish] = useState('bronze');
  const [sun, setSun] = useState(17.5);
  const [preset, setPreset] = useState('overview');
  const [specOpen, setSpecOpen] = useState(false);
  const [rotating, setRotating] = useState(false);

  const show3d = webgl && !engineFailed;

  useEffect(() => {
    document.documentElement.classList.toggle('motion', !reduced);
  }, [reduced]);

  // Engine lifecycle
  useEffect(() => {
    if (!show3d) {
      setReady(true);
      return undefined;
    }
    const engine = new Showcase(canvasRef.current, { reducedMotion: reduced });
    engineRef.current = engine;
    engine.onFrame = (e) => hotspotRef.current?.update(e);
    engine.onUserOrbit = () => setPreset(null);
    let cancelled = false;
    engine
      .init()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        console.error('AMCE: 3D view failed to start.', err);
        if (!cancelled) setEngineFailed(true);
      });
    return () => {
      cancelled = true;
      engine.dispose();
      engineRef.current = null;
      setReady(false);
    };
  }, [show3d, reduced]);

  // Scroll story
  useEffect(() => {
    if (!ready) return undefined;
    const story = setupStory({
      engine: engineRef.current,
      reduced,
      ui: {
        setActive,
        setNavDark,
        setNavDarkFooter,
        setExplore,
        setEnv,
        setSun,
        hotspots: hotspotRef,
      },
    });
    storyRef.current = story;
    story.intro();
    return () => {
      story.destroy();
      storyRef.current = null;
    };
  }, [ready, reduced]);

  // Explore mode toggles orbit controls
  useEffect(() => {
    const e = engineRef.current;
    if (!e || !ready) return;
    e.setExplore(explore, { coarse });
    if (!explore) {
      setRotating(false);
      setSpecOpen(false);
    } else {
      setPreset('overview');
    }
  }, [explore, coarse, ready]);

  const onEnv = useCallback((value) => {
    setEnv(value);
    engineRef.current?.set('envMix', value === 'terrace' ? 1 : 0);
  }, []);

  const onFinish = useCallback((id) => {
    setFinish(id);
    engineRef.current?.setFinish(id);
  }, []);

  const onPreset = useCallback((id) => {
    setPreset(id);
    engineRef.current?.goTo(id, 1.1);
  }, []);

  const onSun = useCallback((h) => {
    setSun(h);
    engineRef.current?.set('sun', h);
  }, []);

  const onRotate = useCallback(() => {
    setRotating((r) => {
      const next = !r;
      engineRef.current?.setInteractive(next);
      return next;
    });
  }, []);

  const scrollTo = (id) => storyRef.current?.scrollTo(`#${id}`);
  const dark = navDark || navDarkFooter;

  return (
    <>
      {show3d ? (
        <canvas ref={canvasRef} className="stage" aria-label="Interactive 3D view of the AMCE solar charging chair" role="img" />
      ) : (
        <div className="stage stage-fallback" role="img" aria-label={COPY.fallback.title}>
          <div className="fallback-card">
            <p className="fallback-mark" aria-hidden="true">{COPY.brand}</p>
            <p className="fallback-title">{COPY.fallback.title}</p>
            <p className="fallback-body">{COPY.fallback.body}</p>
          </div>
        </div>
      )}

      <HotspotLayer ref={hotspotRef} />

      <header className={`topbar ${dark ? 'is-dark' : ''} ${explore ? 'is-explore' : ''}`}>
        <button type="button" className="mark" onClick={() => scrollTo('hero')} aria-label="AMCE back to top">
          <span className="mark-word">{COPY.brand}</span>
          <span className="mark-sub">{COPY.brandSub}</span>
        </button>
        <div className="topbar-right">
          {explore && (
            <>
              <div className="seg" role="group" aria-label="Environment">
                {['studio', 'terrace'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={env === v ? 'is-active' : ''}
                    aria-pressed={env === v}
                    onClick={() => onEnv(v)}
                  >
                    {COPY.explore.env[v]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="chip-btn"
                ref={specBtnRef}
                aria-haspopup="dialog"
                aria-expanded={specOpen}
                onClick={() => setSpecOpen(true)}
              >
                <span className="label-long">{COPY.explore.specTrigger}</span>
                <span className="label-short">{COPY.explore.specShort}</span>
              </button>
            </>
          )}
        </div>
      </header>

      <nav className={`rail ${dark ? 'is-dark' : ''} ${explore || active === 'request' || navDarkFooter ? 'is-hidden' : ''}`} aria-label="Sections">
        {COPY.rail.map((r, i) => (
          <button
            key={r.id}
            type="button"
            className={active === r.id ? 'is-active' : ''}
            aria-current={active === r.id ? 'true' : undefined}
            onClick={() => scrollTo(r.id)}
          >
            <span className="rail-n">{String(i + 1).padStart(2, '0')}</span>
            <span className="rail-label">{r.label}</span>
          </button>
        ))}
      </nav>

      <main className="content">
        <Hero onScrollCue={() => scrollTo('design')} />
        <Design />
        <Anatomy />
        <Technology />
        <InPlace />
        <Explore />
        <RequestForm />
      </main>
      <Footer />

      <Hud
        visible={explore}
        finish={finish}
        onFinish={onFinish}
        preset={preset}
        onPreset={onPreset}
        sun={sun}
        onSun={onSun}
        coarse={coarse}
        rotating={rotating}
        onRotate={onRotate}
      />
      <SpecDrawer open={specOpen} onClose={() => setSpecOpen(false)} sun={sun} returnFocusRef={specBtnRef} />
    </>
  );
}

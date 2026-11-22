import { useState } from 'react';
import { COPY } from '../copy.js';
import SplitWords from './SplitWords.jsx';

function ArrowDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M7 1.5 V12 M2.5 7.5 L7 12 L11.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Hero({ onScrollCue }) {
  const H = COPY.hero;
  return (
    <section id="hero" className="section hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <p className="eyebrow" data-hero-fade>{H.eyebrow}</p>
        <SplitWords as="h1" className="hero-title" text={H.title} />
        <p className="hero-body" data-hero-fade>{H.body}</p>
        <button type="button" className="scroll-cue" data-hero-fade onClick={onScrollCue}>
          <span className="scroll-cue-icon"><ArrowDown /></span>
          {H.cue}
        </button>
      </div>
    </section>
  );
}

function CardHead({ eyebrow, count }) {
  return (
    <div className="card-head">
      <p className="eyebrow">{eyebrow}</p>
      {count ? <p className="counter" aria-hidden="true">{count}</p> : null}
    </div>
  );
}

export function Design() {
  const D = COPY.design;
  const total = String(D.steps.length).padStart(2, '0');
  return (
    <section id="design" className="section design" aria-label="Design">
      {D.steps.map((s, i) => (
        <div className="design-step" key={s.view} data-design-step={i} data-view={s.view}>
          <div className={`caption ${i % 2 ? 'caption-right' : ''}`}>
            <CardHead eyebrow={D.eyebrow} count={`${String(i + 1).padStart(2, '0')} of ${total}`} />
            <SplitWords as="h2" className="caption-title" text={s.title} />
            <p className="caption-body" data-reveal="fade">{s.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function Anatomy() {
  const A = COPY.anatomy;
  return (
    <section id="anatomy" className="section tall anatomy" aria-labelledby="anatomy-title">
      <div className="sticky">
        <div className="caption caption-left">
          <CardHead eyebrow={A.eyebrow} />
          <h2 id="anatomy-title" className="sr-only">{A.title}</h2>
          <SplitWords as="p" className="caption-title" text={A.title} />
          <p className="caption-body" data-reveal="fade">{A.body}</p>
          <ol className="parts" data-anatomy-list data-step="-1">
            {A.parts.map((p, i) => (
              <li key={p} data-i={i}>
                <span className="parts-n">{String(i + 1).padStart(2, '0')}</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function Technology() {
  const T = COPY.tech;
  return (
    <section id="technology" className="section tall technology" aria-labelledby="tech-title">
      <div className="sticky">
        <div className="caption caption-left">
          <CardHead eyebrow={T.eyebrow} />
          <h2 id="tech-title" className="sr-only">{T.title}</h2>
          <SplitWords as="p" className="caption-title" text={T.title} />
          <p className="caption-body" data-reveal="fade">{T.body}</p>
          <ul className="sr-only">
            {Object.values(T.hotspots).map((h) => (
              <li key={h.label}>{h.label}. {h.sub}.</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function InPlace() {
  const P = COPY.inplace;
  return (
    <section id="inplace" className="section tall inplace" aria-labelledby="inplace-title">
      <div className="sticky">
        <div className="caption caption-right">
          <CardHead eyebrow={P.eyebrow} />
          <h2 id="inplace-title" className="sr-only">{P.title}</h2>
          <SplitWords as="p" className="caption-title" text={P.title} />
          <p className="caption-body" data-reveal="fade">{P.body}</p>
          <div className="clock">
            <span className="hud-label">{P.clockLabel}</span>
            <span className="clock-value" data-clock>11:00</span>
          </div>
          <p className="dusk" data-dusk>
            <span className="dusk-dot" aria-hidden="true" />
            {P.dusk}
          </p>
        </div>
      </div>
    </section>
  );
}

export function Explore() {
  return (
    <section id="explore" className="section explore" aria-label={COPY.explore.title}>
      <h2 className="sr-only">{COPY.explore.title}</h2>
    </section>
  );
}

export function RequestForm() {
  const R = COPY.request;
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = [
      `${R.fields.name}: ${fd.get('name') || ''}`,
      `${R.fields.company}: ${fd.get('company') || ''}`,
      `${R.fields.role}: ${fd.get('role') || ''}`,
      `${R.fields.email}: ${fd.get('email') || ''}`,
      '',
      fd.get('message') || '',
    ].join('\n');
    const href = `mailto:${R.email}?subject=${encodeURIComponent(R.subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    window.location.href = href;
  };

  return (
    <section id="request" className="section request" aria-labelledby="request-title">
      <div className="request-inner">
        <div className="request-intro">
          <p className="eyebrow">{R.eyebrow}</p>
          <h2 id="request-title" className="sr-only">{R.title}</h2>
          <SplitWords as="p" className="request-title" text={R.title} />
          <p className="caption-body" data-reveal="fade">{R.body}</p>
          <p className="request-note" data-reveal="fade">
            {R.fallback} <a href={`mailto:${R.email}`}>{R.email}</a>
          </p>
        </div>
        <form className="form" onSubmit={onSubmit} data-reveal="fade">
          <div className="field">
            <label htmlFor="f-name">{R.fields.name}</label>
            <input id="f-name" name="name" type="text" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="f-company">{R.fields.company}</label>
            <input id="f-company" name="company" type="text" autoComplete="organization" />
          </div>
          <div className="field">
            <label htmlFor="f-role">{R.fields.role}</label>
            <select id="f-role" name="role" defaultValue={R.roles[0]}>
              {R.roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-email">{R.fields.email}</label>
            <input id="f-email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field field-wide">
            <label htmlFor="f-message">{R.fields.message}</label>
            <textarea id="f-message" name="message" rows="4" />
          </div>
          <div className="form-foot field-wide">
            <button type="submit" className="btn">{R.submit}</button>
            <p className="form-note" role="status">{sent ? `${R.fallback} ${R.email}` : R.note}</p>
          </div>
        </form>
      </div>
    </section>
  );
}

export function Footer() {
  const F = COPY.footer;
  return (
    <footer id="footer" className="footer">
      <div className="footer-inner">
        <p className="footer-mark">{COPY.brand}</p>
        <div className="footer-row">
          <p>{F.line}</p>
          <p>{F.tbc}</p>
        </div>
      </div>
    </footer>
  );
}

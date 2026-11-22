import { useEffect, useRef } from 'react';
import { COPY } from '../copy.js';
import { solarExposure } from '../showcase.js';
import { formatHours } from '../story.js';

const S = COPY.spec;

export default function SpecDrawer({ open, onClose, sun, returnFocusRef }) {
  const panel = useRef(null);
  const closeBtn = useRef(null);
  const exposure = Math.round(solarExposure(sun) * 100);

  useEffect(() => {
    if (!open) return undefined;
    const prev = returnFocusRef?.current;
    closeBtn.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <div className={`drawer-wrap ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={open ? undefined : ''}>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spec-title"
        ref={panel}
        data-lenis-prevent
      >
        <div className="drawer-head">
          <h2 id="spec-title" className="drawer-title">{S.title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} ref={closeBtn} aria-label={S.close}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 2 L14 14 M14 2 L2 14" stroke="currentColor" strokeWidth="1" />
            </svg>
          </button>
        </div>

        <div className="exposure">
          <div className="exposure-head">
            <span className="hud-label">{S.exposureLabel}</span>
            <span className="tag">{S.illustrative}</span>
          </div>
          <div className="exposure-meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={exposure} aria-label={`${S.exposureLabel} ${S.illustrative}`}>
            <span style={{ transform: `scaleX(${exposure / 100})` }} />
          </div>
          <div className="exposure-foot">
            <span>{formatHours(sun)}</span>
            <span>{exposure} of 100 relative</span>
          </div>
          <p className="exposure-note">{S.exposureNote}</p>
        </div>

        <dl className="spec-list">
          {S.rows.map((r) => (
            <div className="spec-row" key={r}>
              <dt>{r}</dt>
              <dd>{S.tbc}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}

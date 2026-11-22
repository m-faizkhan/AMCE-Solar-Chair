import { useState } from 'react';
import { CHAIR_CONFIG } from '../chair.js';
import { COPY } from '../copy.js';
import { formatHours } from '../story.js';

const C = COPY.explore;

export default function Hud({ visible, finish, onFinish, preset, onPreset, sun, onSun, coarse, rotating, onRotate }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pct = ((sun - 9) / (17.5 - 9)) * 100;

  return (
    <div className={`hud ${visible ? 'is-visible' : ''} ${sheetOpen ? 'sheet-open' : ''}`} aria-hidden={!visible} inert={visible ? undefined : ''}>
      <div className="hud-panel hud-left">
        <p className="eyebrow">{C.eyebrow}</p>
        <h2 className="hud-title">{C.title}</h2>
        <p className="hud-statement">
          {C.lines[0]}
          <br />
          {C.lines[1]}
        </p>
        <div className="hud-group">
          <p className="hud-label" id="finish-label">{C.finishLabel}</p>
          <div className="swatches" role="radiogroup" aria-labelledby="finish-label">
            {Object.entries(CHAIR_CONFIG.finishes).map(([id, f]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={finish === id}
                className={`swatch ${finish === id ? 'is-active' : ''}`}
                onClick={() => onFinish(id)}
              >
                <span className="swatch-chip" aria-hidden="true">
                  <span style={{ background: f.swatch[0] }} />
                  <span style={{ background: f.swatch[1] }} />
                </span>
                <span className="swatch-name">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hud-panel hud-bottom">
        <button
          type="button"
          className="sheet-toggle"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen((v) => !v)}
        >
          {sheetOpen ? C.sheetClose : C.sheetOpen}
          <svg className="sheet-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 7.5 L6 4 L9.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="pills" role="group" aria-label="Camera presets">
          {C.presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`pill ${preset === p.id ? 'is-active' : ''}`}
              aria-pressed={preset === p.id}
              onClick={() => onPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
          {coarse && (
            <button
              type="button"
              className={`pill pill-rotate ${rotating ? 'is-active' : ''}`}
              aria-pressed={rotating}
              onClick={onRotate}
            >
              {rotating ? C.rotateOn : C.rotate}
            </button>
          )}
        </div>

        <div className="sun">
          <div className="sun-head">
            <label htmlFor="sun-range" className="hud-label">{C.sunLabel}</label>
            <span className="sun-value" aria-hidden="true">{formatHours(sun)}</span>
          </div>
          <input
            id="sun-range"
            type="range"
            min="9"
            max="17.5"
            step="0.25"
            value={sun}
            style={{ '--pct': `${pct}%` }}
            aria-valuetext={formatHours(sun)}
            onChange={(e) => onSun(Number(e.target.value))}
          />
          <div className="sun-ticks" aria-hidden="true">
            <span>09:00</span>
            <span>13:00</span>
            <span>17:30</span>
          </div>
        </div>
      </div>
    </div>
  );
}

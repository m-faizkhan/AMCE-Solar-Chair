import { forwardRef, useImperativeHandle, useRef } from 'react';
import { CHAIR_CONFIG } from '../chair.js';
import { COPY } from '../copy.js';

const IDS = ['solar', 'wireless', 'usb', 'battery'];

// Thin 1px leader lines from 3D anchors to labels. Lines draw in with stroke-dashoffset.
const HotspotLayer = forwardRef(function HotspotLayer(_props, ref) {
  const root = useRef(null);
  const paths = useRef({});
  const dots = useRef({});
  const labels = useRef({});
  const progress = useRef([0, 0, 0, 0]);
  const visible = useRef(false);
  const pt = useRef({ x: 0, y: 0, visible: false });

  useImperativeHandle(ref, () => ({
    setVisible(v) {
      visible.current = v;
      if (root.current) root.current.classList.toggle('is-visible', v);
    },
    setProgress(arr) {
      progress.current = arr;
    },
    update(engine) {
      if (!visible.current || !root.current) return;
      const w = engine.width;
      const small = w < 760;
      const reach = small ? 22 : 42;
      const run = small ? 26 : 64;
      const labelW = small ? 130 : 250;
      IDS.forEach((id, i) => {
        const p = engine.projectAnchor(id, pt.current);
        const path = paths.current[id];
        const dot = dots.current[id];
        const label = labels.current[id];
        if (!p || !path || !dot || !label) return;
        const pr = progress.current[i] || 0;
        let [dx, dy] = CHAIR_CONFIG.anchors[id].dir;
        const len0 = Math.hypot(dx, dy) || 1;
        dx /= len0;
        dy /= len0;
        let ex = p.x + dx * reach;
        const ey = p.y + dy * reach;
        let side = Math.sign(dx) || 1;
        if (side > 0 && ex + run + labelW > w - 12) side = -1;
        if (side < 0 && ex - run - labelW < 12) side = 1;
        if (Math.sign(dx) !== side) ex = p.x - dx * reach;
        const fx = ex + side * run;
        const length = reach + run;
        path.setAttribute('d', `M${p.x.toFixed(1)} ${p.y.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)} L${fx.toFixed(1)} ${ey.toFixed(1)}`);
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${(length * (1 - pr)).toFixed(2)}`;
        const show = p.visible && pr > 0;
        dot.setAttribute('cx', p.x.toFixed(1));
        dot.setAttribute('cy', p.y.toFixed(1));
        dot.style.opacity = show ? '1' : '0';
        path.style.opacity = p.visible ? '1' : '0';
        const lp = Math.min(1, Math.max(0, (pr - 0.65) / 0.35));
        const tx = side > 0 ? fx + 8 : fx - 8 - labelW;
        label.style.width = `${labelW}px`;
        label.style.textAlign = side > 0 ? 'left' : 'right';
        label.style.transform = `translate3d(${tx.toFixed(1)}px, ${(ey - 10 + (1 - lp) * 6).toFixed(1)}px, 0)`;
        label.style.opacity = p.visible ? lp.toFixed(3) : '0';
      });
    },
  }));

  return (
    <div className="hotspots" ref={root} aria-hidden="true">
      <svg className="hotspots-svg" width="100%" height="100%">
        {IDS.map((id) => (
          <g key={id}>
            <path ref={(el) => (paths.current[id] = el)} className="hs-line" fill="none" />
            <circle ref={(el) => (dots.current[id] = el)} className="hs-dot" r="3" />
          </g>
        ))}
      </svg>
      {IDS.map((id) => (
        <div className="hs-label" key={id} ref={(el) => (labels.current[id] = el)}>
          <span className="hs-name">{COPY.tech.hotspots[id].label}</span>
          <span className="hs-sub">{COPY.tech.hotspots[id].sub}</span>
        </div>
      ))}
    </div>
  );
});

export default HotspotLayer;

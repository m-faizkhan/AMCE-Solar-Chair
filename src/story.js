// Scroll story: smooth scrolling, section triggers and DOM reveals.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function formatHours(h) {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const noopEngine = new Proxy({}, { get: () => () => {} });

/**
 * @param {object} o
 * @param {import('./showcase.js').Showcase|null} o.engine
 * @param {boolean} o.reduced
 * @param {object} o.ui callbacks into React
 */
export function setupStory({ engine, reduced, ui }) {
  const E = engine || noopEngine;
  const motion = !reduced;
  let lenis = null;
  let tick = null;

  if (motion) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  }

  const q = (sel) => document.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const ctx = gsap.context(() => {
    // Active section for the side rail
    for (const id of ['hero', 'design', 'anatomy', 'technology', 'inplace', 'explore', 'request']) {
      const el = q(`#${id}`);
      if (!el) continue;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => self.isActive && ui.setActive(id),
      });
    }

    // 1. Hero: dark studio, slow turntable, lights come up as you leave
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        const d = 1 - smoothstep(0.3, 0.95, self.progress);
        E.set('dark', d);
        ui.setNavDark(d > 0.5);
      },
      onEnterBack: () => {
        E.setSection('hero');
        E.goTo('hero');
        E.setTurntable(true);
      },
      onLeave: () => E.setTurntable(false),
    });

    // 2. Design: four camera stops
    qa('[data-design-step]').forEach((step) => {
      const view = step.getAttribute('data-view');
      ScrollTrigger.create({
        trigger: step,
        start: 'top 60%',
        end: 'bottom 60%',
        onToggle: (self) => {
          if (!self.isActive) return;
          E.setTurntable(false);
          E.setSection('design');
          E.goTo(view, 1.1);
        },
      });
    });

    // 3. Anatomy: explode then reassemble
    const anatomyList = q('[data-anatomy-list]');
    ScrollTrigger.create({
      trigger: '#anatomy',
      start: 'top top',
      end: 'bottom bottom',
      onToggle: (self) => {
        if (!self.isActive) return;
        E.setSection('anatomy');
        E.goTo('anatomy', 1.2);
      },
      onUpdate: (self) => {
        const p = self.progress;
        let k;
        if (!motion) k = p > 0.1 && p < 0.9 ? 1 : 0;
        else k = smoothstep(0.06, 0.4, p) * (1 - smoothstep(0.62, 0.94, p));
        E.set('explode', k);
        if (anatomyList) anatomyList.dataset.step = String(Math.min(4, Math.floor(clamp01((p - 0.08) / 0.5) * 5)));
      },
      onLeave: () => E.set('explode', 0),
      onLeaveBack: () => E.set('explode', 0),
    });

    // 4. Technology: hotspot lines draw in with scroll
    ScrollTrigger.create({
      trigger: '#technology',
      start: 'top top',
      end: 'bottom bottom',
      onToggle: (self) => {
        ui.hotspots.current?.setVisible(self.isActive);
        if (!self.isActive) return;
        E.setSection('tech');
        E.goTo('tech', 1.1);
      },
      onUpdate: (self) => {
        const p = self.progress;
        const prog = [0, 1, 2, 3].map((i) => (motion ? clamp01((p - 0.06 - i * 0.19) / 0.16) : 1));
        ui.hotspots.current?.setProgress(prog);
      },
    });

    // 5. In place: crossfade to terrace, sun from day to dusk
    const clock = q('[data-clock]');
    const duskLine = q('[data-dusk]');
    ScrollTrigger.create({
      trigger: '#inplace',
      start: 'top top',
      end: 'bottom bottom',
      onToggle: (self) => {
        if (!self.isActive) return;
        E.setSection('inplace');
        E.goTo('inplace', 1.2);
      },
      onUpdate: (self) => {
        const p = self.progress;
        let hours;
        if (motion) {
          E.set('envMix', smoothstep(0.0, 0.2, p));
          hours = 11 + 8.4 * clamp01((p - 0.16) / 0.78);
        } else {
          E.set('envMix', p > 0 ? 1 : 0);
          hours = p < 0.5 ? 13 : 19.25;
        }
        E.set('sun', hours);
        if (clock) clock.textContent = formatHours(hours);
        if (duskLine) duskLine.classList.toggle('is-on', hours > 18.6);
        ui.setEnv(p > 0.1 ? 'terrace' : 'studio');
      },
      onLeaveBack: () => {
        E.set('envMix', 0);
        E.set('sun', 11);
        ui.setEnv('studio');
      },
    });

    // 6. Explore: HUD and orbit controls
    ScrollTrigger.create({
      trigger: '#explore',
      start: 'top 55%',
      end: 'bottom 45%',
      onToggle: (self) => {
        ui.setExplore(self.isActive);
        if (self.isActive) {
          E.setSection('explore');
          E.goTo('overview', 1.1);
          E.set('sun', 17.5);
          ui.setSun(17.5);
        } else if (self.direction < 0) {
          E.setSection('inplace');
          E.goTo('inplace', 1.1);
        }
      },
    });

    // Pause rendering once the opaque request section covers the canvas
    ScrollTrigger.create({
      trigger: '#request',
      start: 'top top',
      end: 'max',
      onToggle: (self) => {
        if (engine) engine.paused = self.isActive;
      },
    });

    // Footer turns the nav light again
    ScrollTrigger.create({
      trigger: '#footer',
      start: 'top 64px',
      end: 'bottom top',
      onToggle: (self) => ui.setNavDarkFooter(self.isActive),
    });

    // DOM reveals
    if (motion) {
      qa('[data-reveal="words"]').forEach((el) => {
        if (el.closest('#hero')) return; // hero has its own intro
        gsap.fromTo(
          el.querySelectorAll('.wi'),
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1.1,
            ease: 'power3.out',
            stagger: 0.05,
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
          },
        );
      });
      qa('[data-reveal="fade"]').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' },
          },
        );
      });
      qa('.caption').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 48 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' },
          },
        );
      });
    }
  });

  // Hero intro
  function intro() {
    E.setSection('hero');
    E.setTurntable(true);
    E.fadeIn();
    if (!motion) return;
    const tl = gsap.timeline({ delay: 0.35 });
    tl.fromTo('#hero .wi', { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.3, ease: 'power3.out', stagger: 0.07 })
      .fromTo('#hero [data-hero-fade]', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, ease: 'power2.out', stagger: 0.12 }, '-=0.8');
  }

  requestAnimationFrame(() => ScrollTrigger.refresh());

  return {
    intro,
    scrollTo(target) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (!el) return;
      if (lenis) lenis.scrollTo(el, { duration: 1.6 });
      else el.scrollIntoView({ behavior: 'auto' });
    },
    destroy() {
      ctx.revert();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      if (lenis) {
        gsap.ticker.remove(tick);
        lenis.destroy();
      }
    },
  };
}

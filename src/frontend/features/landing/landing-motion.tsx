'use client';

// Landing interactions: rotating captions, scroll-driven pipeline, before/after showcase.
import { useEffect } from 'react';
import { reducedMotion } from '@/lib/format';

export function LandingMotion() {
  useEffect(() => {
    const reduce = reducedMotion();
    const cleanups: (() => void)[] = [];

    /* rotating captions — the motion's three beats */
    const caps = Array.from(document.querySelectorAll('#captions p'));
    if (!reduce && caps.length) {
      let i = 0, t: ReturnType<typeof setTimeout>;
      const loop = () => { caps[i].removeAttribute('data-on'); i = (i + 1) % caps.length; caps[i].setAttribute('data-on', ''); t = setTimeout(loop, i === 2 ? 6000 : 4600); };
      t = setTimeout(loop, 6200);
      cleanups.push(() => clearTimeout(t));
    }

    /* pipeline: the CV travels down step by step as you scroll */
    const pipe = document.getElementById('pipe');
    if (pipe) {
      const nodes = Array.from(pipe.querySelectorAll<HTMLElement>('[data-pn]'));
      const track = pipe.querySelector<HTMLElement>('[data-pipe-track]')!;
      let trackH = 0, ticking = false;
      const measure = () => { const last = nodes[nodes.length - 1]; trackH = Math.max(0, last.offsetTop - nodes[0].offsetTop); track.style.top = (nodes[0].offsetTop + 27) + 'px'; pipe.style.setProperty('--track', trackH + 'px'); };
      const update = () => {
        ticking = false;
        if (reduce) { pipe.style.setProperty('--p', '1'); nodes.forEach(n => n.setAttribute('data-on', '')); return; }
        const line = innerHeight * 0.62, top = track.getBoundingClientRect().top;
        const p = trackH ? Math.max(0, Math.min(1, (line - top) / trackH)) : 0;
        pipe.style.setProperty('--p', p.toFixed(4));
        const headY = top + p * trackH;
        nodes.forEach(n => n.toggleAttribute('data-on', n.querySelector('[data-pn-node]')!.getBoundingClientRect().top <= headY + 2 || p >= 1));
      };
      const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      const onResize = () => { measure(); req(); };
      measure(); update();
      addEventListener('scroll', req, { passive: true });
      addEventListener('resize', onResize);
      document.fonts?.ready.then(() => { measure(); update(); });
      cleanups.push(() => { removeEventListener('scroll', req); removeEventListener('resize', onResize); });
    }

    /* evidence showcase: before / after */
    const stage = document.getElementById('scStage');
    if (stage) {
      const btns = Array.from(stage.querySelectorAll<HTMLElement>('[data-sc]'));
      let auto: ReturnType<typeof setInterval> | null = null, t0: ReturnType<typeof setTimeout>;
      const set = (v: string) => { stage.dataset.state = v; btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sc === v))); };
      const handlers = btns.map(b => { const h = () => { if (auto) clearInterval(auto); auto = null; set(b.dataset.sc!); }; b.addEventListener('click', h); return () => b.removeEventListener('click', h); });
      cleanups.push(...handlers);
      if (!reduce && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver(es => {
          if (es[0].isIntersecting && auto === null) {
            io.disconnect();
            t0 = setTimeout(() => set('after'), 900);
            auto = setInterval(() => set(stage.dataset.state === 'after' ? 'before' : 'after'), 5200);
          }
        }, { threshold: .5 });
        io.observe(stage);
        cleanups.push(() => { io.disconnect(); clearTimeout(t0); if (auto) clearInterval(auto); });
      }
    }
    return () => cleanups.forEach(c => c());
  }, []);
  return null;
}

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
  maxLife: number;
};

const COLORS = ["#f472b6", "#fcd34d", "#c4b5fd", "#fb7185", "#f9a8d4", "#fde047", "#86efac"];

function spawn(width: number, height: number, count: number): Particle[] {
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.35,
      vx: (Math.random() - 0.5) * 6,
      vy: 2 + Math.random() * 5,
      g: 0.12 + Math.random() * 0.08,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.25,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      color: COLORS[(Math.random() * COLORS.length) | 0]!,
      life: 0,
      maxLife: 120 + Math.random() * 100,
    });
  }
  return out;
}

/** Remount with a new `key` from parent to fire another burst. */
export function ConfettiCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    particles.current = spawn(W, H, 95);
    window.addEventListener("resize", resize);

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      const list = particles.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i]!;
        p.life += 1;
        if (p.life > p.maxLife) {
          list.splice(i, 1);
          continue;
        }
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha * 0.95;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return <canvas ref={ref} className="confetti-canvas" aria-hidden />;
}

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CELEBRATION_DATE_DISPLAY, CELEBRATION_DATE_ISO } from "../mediaConfig";

type Props = { paths: string[] };

function ringRadiusPx(n: number): number {
  if (n < 2) return 0;
  const v = 120 / Math.sin(Math.PI / n);
  return Math.round(Math.min(360, Math.max(205, v)));
}

/** Which photo index sits closest to the front (camera) for current rotor angle. */
function frontCardIndex(thetaDeg: number, n: number, step: number): number {
  const t = (((-thetaDeg) % 360) + 360) % 360;
  return Math.floor((t + step / 2) / step) % n;
}

function PolaroidFigure({ src }: { src: string }) {
  return (
    <figure className="polaroid">
      <div className="polaroid__shine" aria-hidden />
      <img src={src} alt="" loading="lazy" decoding="async" draggable={false} />
      <figcaption className="polaroid__cap">♥</figcaption>
    </figure>
  );
}

export function MemoryWall({ paths }: Props) {
  const n = paths.length;
  const stageRef = useRef<HTMLElement | null>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const dragRef = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastFrontRef = useRef<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const R = useMemo(() => ringRadiusPx(n), [n]);
  const step = 360 / Math.max(n, 1);

  useEffect(() => {
    if (reduceMotion || n < 2) return;
    const el = rotorRef.current;
    if (!el) return;
    lastFrontRef.current = null;
    let id = 0;
    const triggerSpin = (index: number) => {
      const layer = el.querySelector(
        `.photo-spin-layer[data-i="${String(index)}"]`
      ) as HTMLElement | null;
      if (!layer) return;
      layer.classList.remove("photo-spin-layer--spin");
      void layer.offsetWidth;
      layer.classList.add("photo-spin-layer--spin");
    };

    const tick = () => {
      angleRef.current += 0.1;
      const theta = angleRef.current + dragRef.current;
      el.style.transform = `rotateY(${theta}deg)`;

      const fi = frontCardIndex(theta, n, step);
      const prev = lastFrontRef.current;
      if (prev !== null && prev !== fi) {
        triggerSpin(fi);
      }
      lastFrontRef.current = fi;

      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [n, reduceMotion, paths.join("|"), step]);

  const setTilt = useCallback((clientX: number, clientY: number) => {
    const s = stageRef.current;
    if (!s) return;
    const r = s.getBoundingClientRect();
    const mx = ((clientX - r.left) / r.width - 0.5) * 2;
    const my = ((clientY - r.top) / r.height - 0.5) * 2;
    s.style.setProperty("--tilt-x", mx.toFixed(4));
    s.style.setProperty("--tilt-y", my.toFixed(4));
  }, []);

  const resetTilt = useCallback(() => {
    const s = stageRef.current;
    if (!s) return;
    s.style.setProperty("--tilt-x", "0");
    s.style.setProperty("--tilt-y", "0");
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (reduceMotion || n < 2) return;
      dragging.current = true;
      lastX.current = e.clientX;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [reduceMotion, n]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      setTilt(e.clientX, e.clientY);
      if (!dragging.current || reduceMotion || n < 2) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      dragRef.current += dx * 0.42;
      const rotor = rotorRef.current;
      if (rotor) {
        const theta = angleRef.current + dragRef.current;
        rotor.style.transform = `rotateY(${theta}deg)`;
        const fi = frontCardIndex(theta, n, step);
        const prev = lastFrontRef.current;
        if (prev !== null && prev !== fi) {
          const layer = rotor.querySelector(
            `.photo-spin-layer[data-i="${String(fi)}"]`
          ) as HTMLElement | null;
          if (layer) {
            layer.classList.remove("photo-spin-layer--spin");
            void layer.offsetWidth;
            layer.classList.add("photo-spin-layer--spin");
          }
        }
        lastFrontRef.current = fi;
      }
    },
    [reduceMotion, n, setTilt, step]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => setTilt(e.clientX, e.clientY),
    [setTilt]
  );

  if (n === 0) return null;

  if (reduceMotion) {
    return (
      <section className="photo-grid-flat" aria-label="Photo memories">
        {paths.map((src, i) => (
          <div key={src} className="polaroid-wrap polaroid-wrap--flat">
            <PolaroidFigure src={src} />
          </div>
        ))}
      </section>
    );
  }

  if (n === 1) {
    const src = paths[0]!;
    return (
      <section
        ref={stageRef}
        className="photo-stage photo-stage--single"
        aria-label="Photo memories"
        onMouseMove={onMouseMove}
        onMouseLeave={resetTilt}
      >
        <div className="photo-stage__ring" aria-hidden />
        <p className="photo-stage__hint photo-stage__hint--date">
          <time dateTime={CELEBRATION_DATE_ISO}>{CELEBRATION_DATE_DISPLAY}</time>
        </p>
        <div className="photo-single-3d">
          <PolaroidFigure src={src} />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={stageRef}
      className="photo-stage"
      aria-label="Photo memories — 3D carousel; drag sideways to spin, move mouse for depth"
      onMouseMove={onMouseMove}
      onMouseLeave={resetTilt}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="photo-stage__ring" aria-hidden />
      <p className="photo-stage__hint photo-stage__hint--date">
        <time dateTime={CELEBRATION_DATE_ISO}>{CELEBRATION_DATE_DISPLAY}</time>
      </p>
      <div className="photo-skew">
        <div className="photo-pivot-inner">
          <div ref={rotorRef} className="photo-rotor">
            {paths.map((src, i) => {
              const deg = i * step;
              return (
                <div
                  key={src}
                  className="photo-cell"
                  style={{
                    transform: `translate(-50%, -50%) rotateY(${deg}deg) translateZ(${R}px)`,
                  }}
                >
                  <div
                    className="photo-face"
                    style={{ transform: `rotateY(${-deg}deg)` }}
                  >
                    <div
                      className="photo-spin-layer"
                      data-i={i}
                      onAnimationEnd={(e) =>
                        e.currentTarget.classList.remove("photo-spin-layer--spin")
                      }
                    >
                      <PolaroidFigure src={src} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { ConfettiCanvas } from "./components/ConfettiCanvas";
import { FloatingDecor } from "./components/FloatingDecor";
import { MemoryWall } from "./components/MemoryWall";
import { BIRTHDAY_AUDIO_PATH, photoManifestUrl } from "./mediaConfig";
import "./App.css";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function AudioHint({ error }: { error: boolean }) {
  if (!error) return null;
  return (
    <p className="hint hint--warn">
      Track missing — add <code>public/audio/song.mp3</code> or change{" "}
      <code>BIRTHDAY_AUDIO_PATH</code> in <code>src/mediaConfig.ts</code>.
    </p>
  );
}

type Manifest = { photos?: string[] };

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [photoPaths, setPhotoPaths] = useState<string[] | null>(null);
  const [manifestError, setManifestError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [confettiBurst, setConfettiBurst] = useState(0);
  const lastConfetti = useRef(0);

  const fireConfetti = useCallback(() => {
    const now = Date.now();
    if (now - lastConfetti.current < 900) return;
    lastConfetti.current = now;
    setConfettiBurst((n) => n + 1);
  }, []);

  useEffect(() => {
    const url = photoManifestUrl();
    const bust = import.meta.env.DEV ? `?t=${Date.now()}` : "";
    fetch(`${url}${bust}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<Manifest>;
      })
      .then((d) => setPhotoPaths(Array.isArray(d.photos) ? d.photos : []))
      .catch(() => {
        setManifestError(true);
        setPhotoPaths([]);
      });
  }, []);

  useEffect(() => {
    fireConfetti();
  }, [fireConfetti]);

  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    const bar = progressBarRef.current;
    if (!el || !bar || !Number.isFinite(el.duration) || el.duration <= 0) return;
    const rect = bar.getBoundingClientRect();
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    el.currentTime = (x / rect.width) * el.duration;
    setCurrentTime(el.currentTime);
  }, []);

  const toggle = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (el.paused) {
        await el.play();
        setPlaying(true);
        setLoadError(false);
        fireConfetti();
      } else {
        el.pause();
        setPlaying(false);
      }
    } catch {
      setLoadError(true);
      setPlaying(false);
    }
  }, [fireConfetti]);

  const onTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
  }, []);

  const onMeta = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setDuration(el.duration || 0);
  }, []);

  return (
    <div className="page">
      <div className="page__bg" aria-hidden />
      <FloatingDecor />
      {confettiBurst > 0 ? <ConfettiCanvas key={confettiBurst} /> : null}

      {photoPaths === null ? (
        <div className="page-loading">
          <p>Loading memories…</p>
        </div>
      ) : null}

      <div className="page__inner">
        <header className="hero">
          <p className="hero__eyebrow">It’s your day</p>
          <h1 className="hero__title">
            Happy <span className="hero__gradient">Birthday</span>
          </h1>
          <p className="hero__sub">
            Cake, confetti, chaos — and every frame below is a little piece of you.
          </p>
        </header>

        {photoPaths !== null && photoPaths.length > 0 ? (
          <MemoryWall paths={photoPaths} />
        ) : null}

        <section className="player-card" aria-label="Birthday song">
          <button type="button" className="btn btn--primary" onClick={toggle} aria-pressed={playing}>
            <span className="btn__icon" aria-hidden>
              {playing ? "❚❚" : "▶"}
            </span>
            {playing ? "Pause the vibe" : "Play birthday song"}
          </button>

          <div
            ref={progressBarRef}
            className="progress"
            role="slider"
            aria-valuemin={0}
            aria-valuemax={Number.isFinite(duration) && duration > 0 ? duration : 100}
            aria-valuenow={currentTime}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            aria-label="Playback position"
            tabIndex={0}
            onClick={seek}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              const el = audioRef.current;
              if (!el || !el.duration) return;
              const step = e.key === "ArrowLeft" ? -5 : 5;
              el.currentTime = Math.max(0, Math.min(el.duration, el.currentTime + step));
              setCurrentTime(el.currentTime);
            }}
          >
            <div className="progress__track">
              <div className="progress__fill" style={{ width: `${pct}%` }} />
              <div className="progress__glow" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="player-card__time">
            <span>{formatTime(currentTime)}</span>
            <span className="player-card__sep">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </section>

        <AudioHint error={loadError} />
        {manifestError ? (
          <p className="hint hint--warn">
            Could not load <code>photo-manifest.json</code>. Run <code>npm run dev</code> or{" "}
            <code>npm run build</code> once.
          </p>
        ) : null}
        {photoPaths !== null && photoPaths.length === 0 ? (
          <p className="hint hint--warn">
            No photos yet — add images to <code>public/photos/</code> (jpg, png, webp, svg).
          </p>
        ) : (
          <p className="hint">
            Photos auto-load from <code>public/photos/</code>. Replace placeholders with your real
            pictures anytime.
          </p>
        )}

        <footer className="footer">
          <p>
            Deploy on <strong>Vercel</strong> — Vite build → <code>dist</code>.
          </p>
        </footer>
      </div>

      <audio
        ref={audioRef}
        src={BIRTHDAY_AUDIO_PATH}
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setLoadError(true)}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onMeta}
        onDurationChange={onMeta}
      />
    </div>
  );
}

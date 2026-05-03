export function FloatingDecor() {
  return (
    <div className="floating-decor" aria-hidden>
      <div className="glow-orb glow-orb--1" />
      <div className="glow-orb glow-orb--2" />
      <div className="glow-orb glow-orb--3" />
      <span className="twinkle twinkle--1">✦</span>
      <span className="twinkle twinkle--2">✧</span>
      <span className="twinkle twinkle--3">✦</span>
      <span className="twinkle twinkle--4">✧</span>
      <div className="balloon balloon--1">
        <div className="balloon__body" />
        <div className="balloon__knot" />
        <div className="balloon__string" />
      </div>
      <div className="balloon balloon--2">
        <div className="balloon__body balloon__body--alt" />
        <div className="balloon__knot" />
        <div className="balloon__string" />
      </div>
      <div className="balloon balloon--3">
        <div className="balloon__body" />
        <div className="balloon__knot" />
        <div className="balloon__string" />
      </div>
      <svg className="cake-float" viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="cf" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fce7f3" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <ellipse cx="32" cy="52" rx="22" ry="6" fill="rgba(0,0,0,0.25)" />
        <rect x="12" y="28" width="40" height="22" rx="4" fill="url(#cf)" />
        <rect x="18" y="18" width="28" height="14" rx="3" fill="#fdf2f8" />
        <rect x="22" y="10" width="20" height="12" rx="2" fill="#fbcfe8" />
        <rect x="30" y="4" width="4" height="8" rx="1" fill="#fcd34d" className="cake-float__candle" />
        <circle cx="32" cy="4" r="3" fill="#fef08a" className="cake-float__flame" />
      </svg>
    </div>
  );
}

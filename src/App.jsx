import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/* ─── Hooks ─────────────────────────────────────────────────────────── */

function useInView(options = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsInView(true); obs.unobserve(el); } },
      { threshold: 0.15, ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, isInView];
}

function useCountUp(target, duration = 2000) {
  const [value, setValue] = useState(0);
  const [ref, isInView] = useInView();
  useEffect(() => {
    if (!isInView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target, duration]);
  return [ref, value];
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return y;
}

function useMouse() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h, { passive: true });
    return () => window.removeEventListener('mousemove', h);
  }, []);
  return pos;
}

function use3DTilt(ref) {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ rotateX: -y * 12, rotateY: x * 12 });
    };
    const handleLeave = () => setTilt({ rotateX: 0, rotateY: 0 });
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => { el.removeEventListener('mousemove', handleMove); el.removeEventListener('mouseleave', handleLeave); };
  }, [ref]);
  return tilt;
}

/* ─── Animation helpers ─────────────────────────────────────────────── */

const ease = 'cubic-bezier(.16,1,.3,1)';

function revealStyle(isInView, delay = 0, direction = 'up') {
  const transforms = {
    up: 'translateY(60px) rotateX(8deg)',
    down: 'translateY(-60px) rotateX(-8deg)',
    left: 'translateX(60px) rotateY(-8deg)',
    right: 'translateX(-60px) rotateY(8deg)',
    scale: 'scale(0.85) rotateX(5deg)',
  };
  return {
    opacity: isInView ? 1 : 0,
    transform: isInView ? 'translate(0) rotateX(0) rotateY(0) scale(1)' : transforms[direction],
    transition: `opacity 0.9s ${ease} ${delay}s, transform 0.9s ${ease} ${delay}s`,
  };
}

const neonGlow = {
  textShadow: '0 0 7px rgba(56, 200, 120, 0.6), 0 0 20px rgba(56, 200, 120, 0.4), 0 0 40px rgba(56, 200, 120, 0.2)',
};

/* ─── Preloader ─────────────────────────────────────────────────────── */

function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let frame;
    let current = 0;
    const animate = () => {
      current += (100 - current) * 0.035;
      if (current > 99.5) {
        setProgress(100);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(onComplete, 600);
        }, 400);
        return;
      }
      setProgress(Math.floor(current));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#0a0a0f',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut ? 0 : 1, transition: 'opacity 0.6s ease',
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(56,200,120,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56,200,120,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        animation: 'gridPulse 3s ease infinite',
      }} />

      {/* 3D spinning hexagon */}
      <div style={{ perspective: '600px', marginBottom: '48px' }}>
        <div style={{
          width: '100px', height: '100px',
          animation: 'preloaderSpin 3s ease-in-out infinite, preloaderPulse 2s ease infinite',
          transformStyle: 'preserve-3d',
        }}>
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5"
              stroke="#38c878" strokeWidth="1.5" fill="none" opacity="0.8" />
            <polygon points="50,20 78,35 78,65 50,80 22,65 22,35"
              stroke="#38c878" strokeWidth="1" fill="rgba(56,200,120,0.05)" opacity="0.6" />
            <circle cx="50" cy="50" r="12" stroke="#38c878" strokeWidth="1.5" fill="rgba(56,200,120,0.1)" />
            <circle cx="50" cy="50" r="4" fill="#38c878" />
          </svg>
        </div>
      </div>

      {/* Brand */}
      <h1 style={{
        fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 700,
        color: '#38c878', letterSpacing: '4px', textTransform: 'uppercase',
        marginBottom: '40px', ...neonGlow,
      }}>
        SOLUTION AI PRO
      </h1>

      {/* Progress bar */}
      <div style={{ width: '240px', height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${progress}%`, height: '100%', borderRadius: '1px',
          background: 'linear-gradient(90deg, #38c878, #2ebd6e, #38c878)',
          backgroundSize: '200% 100%',
          animation: 'progressGlow 1.5s linear infinite',
          boxShadow: '0 0 12px rgba(56,200,120,0.6)',
          transition: 'width 0.1s ease',
        }} />
      </div>

      {/* Progress text */}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#5a5a6a',
        marginTop: '16px', letterSpacing: '2px',
      }}>
        INITIALIZING {progress}%
      </span>
    </div>
  );
}

/* ─── Particle Canvas (enhanced with mouse interaction) ────────────── */

function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    const PARTICLE_COUNT = 100;
    const MAX_DIST = 160;
    const MOUSE_RADIUS = 200;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', handleMouse);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2.5 + 0.5,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.pulse += 0.02;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Mouse repulsion
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < MOUSE_RADIUS && mDist > 0) {
          const force = (MOUSE_RADIUS - mDist) / MOUSE_RADIUS * 0.8;
          p.x += (mdx / mDist) * force;
          p.y += (mdy / mDist) * force;
        }

        const pulseR = p.r * (1 + Math.sin(p.pulse) * 0.3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 200, 120, ${0.4 + Math.sin(p.pulse) * 0.2})`;
        ctx.fill();

        // Glow effect on larger particles
        if (p.r > 1.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseR * 3, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseR * 3);
          grad.addColorStop(0, 'rgba(56, 200, 120, 0.1)');
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fill();
        }

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(56, 200, 120, ${0.12 * (1 - dist / MAX_DIST)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Lines to mouse
        if (mDist < MOUSE_RADIUS * 1.5) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(56, 200, 120, ${0.06 * (1 - mDist / (MOUSE_RADIUS * 1.5))})`;
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', handleMouse); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
  );
}

/* ─── Floating 3D Orbs (parallax depth layers) ─────────────────────── */

function FloatingOrbs({ scrollY }) {
  const orbs = useMemo(() => [
    { x: '10%', y: '20%', size: 300, speed: 0.05, opacity: 0.04 },
    { x: '80%', y: '40%', size: 400, speed: 0.08, opacity: 0.03 },
    { x: '50%', y: '70%', size: 250, speed: 0.03, opacity: 0.05 },
    { x: '25%', y: '85%', size: 350, speed: 0.06, opacity: 0.03 },
    { x: '70%', y: '15%', size: 200, speed: 0.1, opacity: 0.04 },
  ], []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {orbs.map((o, i) => (
        <div key={i} style={{
          position: 'absolute', left: o.x, top: o.y, width: o.size, height: o.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(56,200,120,${o.opacity}) 0%, transparent 70%)`,
          transform: `translateY(${scrollY * o.speed}px)`,
          filter: 'blur(40px)',
        }} />
      ))}
    </div>
  );
}

/* ─── 3D Tilt Card Wrapper ─────────────────────────────────────────── */

function TiltCard({ children, style = {}, className = '', onMouseEnter, onMouseLeave }) {
  const ref = useRef(null);
  const tilt = use3DTilt(ref);

  return (
    <div ref={ref} className={className} style={{
      ...style,
      transform: `${style.transform || ''} perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
      transition: style.transition || 'transform 0.15s ease-out',
    }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

/* ─── SVG Icons ────────────────────────────────────────────────────── */

const icons = {
  agentic: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" stroke="#38c878" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="24" r="6" stroke="#38c878" strokeWidth="1.5" />
      <path d="M24 18V4M24 44V30M30 24H42M6 24H18" stroke="#38c878" strokeWidth="1" opacity="0.5" />
    </svg>
  ),
  product: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="8" width="32" height="32" rx="4" stroke="#38c878" strokeWidth="1.5" fill="none" />
      <path d="M16 20H32M16 28H26" stroke="#38c878" strokeWidth="1.5" />
      <circle cx="36" cy="28" r="3" stroke="#38c878" strokeWidth="1.5" />
    </svg>
  ),
  modernization: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path d="M12 36L24 12L36 36" stroke="#38c878" strokeWidth="1.5" fill="none" />
      <path d="M18 28H30" stroke="#38c878" strokeWidth="1.5" />
      <circle cx="24" cy="12" r="3" stroke="#38c878" strokeWidth="1.5" />
      <circle cx="12" cy="36" r="3" stroke="#38c878" strokeWidth="1.5" />
      <circle cx="36" cy="36" r="3" stroke="#38c878" strokeWidth="1.5" />
    </svg>
  ),
  managed: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="16" width="36" height="20" rx="3" stroke="#38c878" strokeWidth="1.5" fill="none" />
      <path d="M14 12H34M18 8H30" stroke="#38c878" strokeWidth="1.5" opacity="0.5" />
      <circle cx="24" cy="26" r="4" stroke="#38c878" strokeWidth="1.5" />
      <path d="M24 22V18" stroke="#38c878" strokeWidth="1.5" />
    </svg>
  ),
};

/* ─── Section Components ────────────────────────────────────────────── */

function Navbar({ activeSection, scrollY }) {
  const links = [
    { label: 'Solutions', id: 'transform' },
    { label: 'How It Works', id: 'blueprints' },
    { label: 'Capabilities', id: 'talent' },
    { label: 'Platform', id: 'tools' },
    { label: 'Results', id: 'insights' },
  ];
  const scrolled = scrollY > 80;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 clamp(16px, 4vw, 48px)',
      height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(10, 10, 15, 0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(56,200,120,0.08)' : '1px solid transparent',
      transition: 'all 0.4s ease',
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '16px', color: '#38c878',
        letterSpacing: '2px', textTransform: 'uppercase', ...neonGlow,
      }}>
        Solution AI Pro
      </span>

      {/* Desktop links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
        {links.map(l => (
          <a key={l.id} href={`#${l.id}`}
            onClick={e => { e.preventDefault(); document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '12px', textDecoration: 'none', letterSpacing: '1px',
              color: activeSection === l.id ? '#38c878' : '#5a5a6a',
              textTransform: 'uppercase',
              textShadow: activeSection === l.id ? '0 0 10px rgba(56,200,120,0.5)' : 'none',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { if (activeSection !== l.id) e.target.style.color = '#8a8a9a'; }}
            onMouseLeave={e => { if (activeSection !== l.id) e.target.style.color = '#5a5a6a'; }}
          >{l.label}</a>
        ))}
        <a href="#contact"
          onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '10px 28px',
            background: 'transparent', color: '#38c878', borderRadius: '4px', textDecoration: 'none',
            fontWeight: 600, transition: 'all 0.3s ease', letterSpacing: '1px', textTransform: 'uppercase',
            border: '1px solid rgba(56,200,120,0.4)',
            boxShadow: '0 0 15px rgba(56,200,120,0.1), inset 0 0 15px rgba(56,200,120,0.05)',
          }}
          onMouseEnter={e => {
            e.target.style.background = 'rgba(56,200,120,0.1)';
            e.target.style.boxShadow = '0 0 30px rgba(56,200,120,0.3), inset 0 0 20px rgba(56,200,120,0.1)';
            e.target.style.borderColor = '#38c878';
          }}
          onMouseLeave={e => {
            e.target.style.background = 'transparent';
            e.target.style.boxShadow = '0 0 15px rgba(56,200,120,0.1), inset 0 0 15px rgba(56,200,120,0.05)';
            e.target.style.borderColor = 'rgba(56,200,120,0.4)';
          }}
        >Contact Us</a>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ background: 'none', border: 'none', color: '#38c878', fontSize: '24px', cursor: 'pointer' }}
      >
        {mobileOpen ? '\u2715' : '\u2630'}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '72px', left: 0, right: 0, background: 'rgba(10,10,15,0.95)',
          backdropFilter: 'blur(24px)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
          borderBottom: '1px solid rgba(56,200,120,0.1)',
        }}>
          {links.map(l => (
            <a key={l.id} href={`#${l.id}`}
              onClick={e => { e.preventDefault(); setMobileOpen(false); document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '13px', textDecoration: 'none', letterSpacing: '1px',
                color: activeSection === l.id ? '#38c878' : '#5a5a6a', textTransform: 'uppercase',
              }}
            >{l.label}</a>
          ))}
          <a href="#contact"
            onClick={e => { e.preventDefault(); setMobileOpen(false); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '12px 24px', textAlign: 'center',
              border: '1px solid rgba(56,200,120,0.4)', color: '#38c878', borderRadius: '4px',
              textDecoration: 'none', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase',
            }}
          >Contact Us</a>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const [revealed, setRevealed] = useState(0);
  const words = 'Custom AI Bots Built for Law Firms That Actually Work'.split(' ');

  useEffect(() => {
    const timers = words.map((_, i) => setTimeout(() => setRevealed(i + 1), 600 + i * 120));
    return () => timers.forEach(clearTimeout);
  }, []);

  const [subtitleRef, subtitleVisible] = useInView();

  return (
    <section className="scanline-overlay" style={{
      position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      <ParticleCanvas />

      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(56,200,120,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(56,200,120,0.02) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: '1000px',
        perspective: '1000px',
      }}>
        {/* Tag */}
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#38c878', letterSpacing: '3px',
          textTransform: 'uppercase', marginBottom: '24px',
          opacity: revealed > 0 ? 1 : 0, transition: `opacity 0.6s ${ease}`,
          ...neonGlow,
        }}>
          [ AI-Powered Legal Solutions ]
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)', fontWeight: 800,
          fontSize: 'clamp(28px, 5vw, 58px)', lineHeight: 1.15, letterSpacing: '1px',
          color: '#fff', marginBottom: '28px', textTransform: 'uppercase',
        }}>
          {words.map((w, i) => (
            <span key={i} style={{
              display: 'inline-block', marginRight: '0.25em',
              opacity: i < revealed ? 1 : 0,
              transform: i < revealed ? 'translateY(0) rotateX(0)' : 'translateY(30px) rotateX(40deg)',
              transition: `opacity 0.6s ${ease}, transform 0.6s ${ease}`,
              textShadow: i < revealed ? '0 0 30px rgba(56,200,120,0.15)' : 'none',
            }}>{w}</span>
          ))}
        </h1>

        <p ref={subtitleRef} style={{
          fontFamily: 'var(--font-body)', fontSize: 'clamp(15px, 1.8vw, 19px)', color: '#8a8a9a',
          maxWidth: '680px', margin: '0 auto', lineHeight: 1.7,
          opacity: subtitleVisible ? 1 : 0,
          transform: subtitleVisible ? 'translateY(0) rotateX(0)' : 'translateY(20px) rotateX(5deg)',
          transition: `opacity 0.9s ${ease} 0.3s, transform 0.9s ${ease} 0.3s`,
        }}>
          Affordable, secure AI solutions for lawyers, legal professionals, and small law firms.
          We build custom bots that manage clinical data with enterprise-grade security — powered by
          15+ years of cloud excellence on AWS, GCP, and Azure.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px',
          opacity: subtitleVisible ? 1 : 0,
          transform: subtitleVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: `opacity 0.9s ${ease} 0.5s, transform 0.9s ${ease} 0.5s`,
        }}>
          <a href="#contact"
            onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '14px 36px',
              background: 'rgba(56,200,120,0.1)', color: '#38c878', borderRadius: '4px',
              textDecoration: 'none', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase',
              border: '1px solid rgba(56,200,120,0.4)', cursor: 'pointer',
              boxShadow: '0 0 20px rgba(56,200,120,0.15), inset 0 0 20px rgba(56,200,120,0.05)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.target.style.boxShadow = '0 0 40px rgba(56,200,120,0.4), inset 0 0 30px rgba(56,200,120,0.1)';
              e.target.style.background = 'rgba(56,200,120,0.15)';
            }}
            onMouseLeave={e => {
              e.target.style.boxShadow = '0 0 20px rgba(56,200,120,0.15), inset 0 0 20px rgba(56,200,120,0.05)';
              e.target.style.background = 'rgba(56,200,120,0.1)';
            }}
          >Get Started</a>
          <a href="#transform"
            onClick={e => { e.preventDefault(); document.getElementById('transform')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '14px 36px',
              background: 'transparent', color: '#5a5a6a', borderRadius: '4px',
              textDecoration: 'none', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => { e.target.style.color = '#8a8a9a'; e.target.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.target.style.color = '#5a5a6a'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >Learn More</a>
        </div>
      </div>

      {/* Bouncing chevron */}
      <div style={{
        position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
        animation: 'bounce 2s infinite',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="#38c878" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
      </div>
    </section>
  );
}

function AnchorTabs({ activeSection }) {
  const tabs = [
    { label: 'Solutions', id: 'transform' },
    { label: 'How It Works', id: 'blueprints' },
    { label: 'Capabilities', id: 'talent' },
    { label: 'Platform', id: 'tools' },
  ];

  return (
    <div style={{
      position: 'sticky', top: '72px', zIndex: 90, background: 'rgba(10, 10, 15, 0.92)',
      backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(56,200,120,0.06)',
      display: 'flex', justifyContent: 'center', gap: 'clamp(8px, 2vw, 24px)', padding: '14px 24px',
    }}>
      {tabs.map(t => (
        <button key={t.id}
          onClick={() => document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 'clamp(10px, 1.3vw, 12px)', padding: '8px 20px',
            background: activeSection === t.id ? 'rgba(56,200,120,0.08)' : 'transparent',
            color: activeSection === t.id ? '#38c878' : '#5a5a6a',
            border: activeSection === t.id ? '1px solid rgba(56,200,120,0.2)' : '1px solid transparent',
            borderRadius: '4px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase',
            boxShadow: activeSection === t.id ? '0 0 15px rgba(56,200,120,0.08)' : 'none',
            transition: 'all 0.3s ease',
          }}
        >{t.label}</button>
      ))}
    </div>
  );
}

function TransformSection() {
  const [ref, inView] = useInView();
  const cards = [
    { num: '01', title: 'Custom Legal AI Bots', desc: 'Purpose-built AI assistants for case research, contract review, document drafting, and client intake — tailored to your firm\'s workflows and priced for small practices.' },
    { num: '02', title: 'Secure Clinical Data Management', desc: 'HIPAA-aligned AI and ML pipelines that securely manage sensitive client and clinical data across AWS, GCP, and Azure — with encryption at rest and in transit.' },
  ];

  return (
    <section id="transform" style={{ padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 48px)', maxWidth: '1200px', margin: '0 auto', perspective: '1200px' }} ref={ref}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 36px)', fontWeight: 700,
        color: '#fff', marginBottom: '56px', letterSpacing: '1px', textTransform: 'uppercase',
        ...revealStyle(inView),
      }}>
        <span style={{ color: '#38c878', ...neonGlow }}>Solutions:</span>{' '}
        AI That Lawyers Can Actually Afford
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '32px' }}>
        {cards.map((c, i) => (
          <TiltCard key={i} style={{
            padding: '44px', borderRadius: '8px', position: 'relative',
            background: 'linear-gradient(135deg, rgba(18,18,26,0.95), rgba(26,26,37,0.6))',
            border: '1px solid rgba(56,200,120,0.1)',
            ...revealStyle(inView, 0.15 * (i + 1)),
            backdropFilter: 'blur(12px)',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(56,200,120,0.4)';
              e.currentTarget.style.boxShadow = '0 8px 40px rgba(56,200,120,0.12), inset 0 0 30px rgba(56,200,120,0.03)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(56,200,120,0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '52px', height: '52px', borderRadius: '8px',
              background: 'rgba(56,200,120,0.08)', border: '1px solid rgba(56,200,120,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: '#38c878',
              marginBottom: '24px', boxShadow: '0 0 20px rgba(56,200,120,0.08)',
            }}>{c.num}</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '14px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{c.title}</h3>
            <p style={{ color: '#8a8a9a', lineHeight: 1.7, fontSize: '15px' }}>{c.desc}</p>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function CaseStudies() {
  const [ref, inView] = useInView();
  const cases = [
    { tag: 'Law Firm \u00B7 AWS', title: 'AI-Powered Case Research Assistant', desc: 'Custom bot that searches case law, summarizes precedents, and drafts research memos \u2014 cutting research time by 70% for a 12-attorney firm.' },
    { tag: 'Legal Practice \u00B7 Azure', title: 'Secure Client Intake Automation', desc: 'AI-driven intake system that collects, validates, and routes client data with end-to-end encryption, processing 200+ new matters monthly.' },
    { tag: 'Solo Attorney \u00B7 GCP', title: 'Contract Review & Risk Scoring', desc: 'ML model trained on 50,000+ contracts to flag risk clauses, missing terms, and compliance gaps in under 30 seconds.' },
    { tag: 'Clinical Data \u00B7 Multi-Cloud', title: 'HIPAA-Compliant Data Pipeline', desc: 'Secure clinical data management system across AWS and Azure, handling 10,000+ patient records with zero compliance violations.' },
  ];

  return (
    <section style={{ padding: 'clamp(48px, 8vw, 96px) 0', overflow: 'hidden' }} ref={ref}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 36px)', fontWeight: 700,
        color: '#fff', marginBottom: '48px', padding: '0 clamp(16px, 4vw, 48px)',
        letterSpacing: '1px', textTransform: 'uppercase', ...revealStyle(inView),
      }}>
        <span style={{ color: '#38c878', ...neonGlow }}>Case Studies:</span> AI in Action
      </h2>
      <div style={{
        display: 'flex', gap: '24px', overflowX: 'auto', scrollSnapType: 'x mandatory',
        padding: '8px clamp(16px, 4vw, 48px) 24px', WebkitOverflowScrolling: 'touch',
      }}>
        {cases.map((c, i) => (
          <TiltCard key={i} style={{
            minWidth: 'clamp(280px, 35vw, 360px)', scrollSnapAlign: 'start', padding: '36px',
            borderRadius: '8px', background: 'rgba(18, 18, 26, 0.7)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(56,200,120,0.06)', flexShrink: 0,
            ...revealStyle(inView, 0.12 * i, 'right'),
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(56,200,120,0.35)';
              e.currentTarget.style.boxShadow = '0 12px 48px rgba(56,200,120,0.12), inset 0 0 30px rgba(56,200,120,0.03)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(56,200,120,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38c878',
              textTransform: 'uppercase', letterSpacing: '2px',
              textShadow: '0 0 8px rgba(56,200,120,0.4)',
            }}>{c.tag}</span>
            <h3 style={{
              fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff',
              margin: '16px 0 12px', lineHeight: 1.35, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>{c.title}</h3>
            <p style={{ color: '#8a8a9a', lineHeight: 1.7, fontSize: '14px' }}>{c.desc}</p>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function StepperColumn({ title, steps, delayBase = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ flex: 1, minWidth: 'min(100%, 380px)' }}>
      <h3 style={{
        fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: 700, color: '#fff',
        marginBottom: '36px', letterSpacing: '1px', textTransform: 'uppercase',
        ...revealStyle(inView, delayBase),
      }}>{title}</h3>
      <div style={{ position: 'relative', paddingLeft: '36px' }}>
        <div style={{
          position: 'absolute', left: '9px', top: '8px', bottom: '8px', width: '1px',
          background: 'linear-gradient(to bottom, #38c878, rgba(56,200,120,0.1))',
          boxShadow: '0 0 8px rgba(56,200,120,0.2)',
        }} />
        {steps.map((s, i) => (
          <div key={i} style={{
            marginBottom: '32px', position: 'relative',
            ...revealStyle(inView, delayBase + 0.12 * (i + 1), 'left'),
          }}>
            <div style={{
              position: 'absolute', left: '-31px', top: '4px', width: '14px', height: '14px',
              borderRadius: '50%',
              background: inView ? '#38c878' : 'rgba(56,200,120,0.15)',
              transition: `all 0.5s ${ease} ${delayBase + 0.12 * (i + 1)}s`,
              boxShadow: inView ? '0 0 12px rgba(56,200,120,0.5), 0 0 24px rgba(56,200,120,0.2)' : 'none',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38c878',
              letterSpacing: '2px',
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <p style={{ color: '#e8e8ed', fontSize: '15px', marginTop: '6px', lineHeight: 1.6 }}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlueprintsSection() {
  const [ref, inView] = useInView();
  return (
    <section id="blueprints" style={{
      padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 48px)',
      maxWidth: '1200px', margin: '0 auto',
    }} ref={ref}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 36px)', fontWeight: 700,
        color: '#fff', marginBottom: '56px', letterSpacing: '1px', textTransform: 'uppercase',
        ...revealStyle(inView),
      }}>
        <span style={{ color: '#38c878', ...neonGlow }}>How It Works:</span>{' '}
        Consultation to Deployed AI
      </h2>
      <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
        <StepperColumn
          title="Your Custom Bot Journey"
          steps={[
            'Discovery Call \u2014 We learn your firm\'s workflows, pain points, and data requirements',
            'Architecture & Security \u2014 We design your solution on AWS, GCP, or Azure with compliance built in',
            'Build & Train \u2014 Custom AI models trained on your domain, integrated with your existing tools',
            'Deploy & Support \u2014 Go live with ongoing monitoring, updates, and dedicated support',
          ]}
          delayBase={0.15}
        />
        <StepperColumn
          title="Our Security Framework"
          steps={[
            'Data Encryption \u2014 AES-256 at rest, TLS 1.3 in transit across all cloud environments',
            'Access Controls \u2014 Role-based permissions, MFA, and audit logging for every interaction',
            'Compliance \u2014 HIPAA-aligned processes for clinical data, SOC 2 security standards',
            'Continuous Monitoring \u2014 24/7 threat detection and automated vulnerability scanning',
          ]}
          delayBase={0.3}
        />
      </div>
    </section>
  );
}

function TalentSection() {
  const [ref, inView] = useInView();
  const cards = [
    { icon: 'agentic', title: 'Legal Research Bots', desc: 'AI assistants that search case law, analyze statutes, summarize depositions, and draft research memos \u2014 trained on your firm\'s practice areas.' },
    { icon: 'product', title: 'Document Automation', desc: 'Intelligent contract generation, review, and redlining. Auto-populate templates, flag risk clauses, and ensure compliance in seconds.' },
    { icon: 'modernization', title: 'Secure Data Pipelines', desc: 'Clinical and client data management built on AWS, GCP, and Azure. HIPAA-aligned encryption, access controls, and audit trails.' },
    { icon: 'managed', title: 'Managed AI Operations', desc: '24/7 monitoring, model retraining, and cloud infrastructure management. We handle the tech so you can focus on practicing law.' },
  ];

  return (
    <section id="talent" style={{ padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 48px)', maxWidth: '1200px', margin: '0 auto' }} ref={ref}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 36px)', fontWeight: 700,
        color: '#fff', marginBottom: '56px', letterSpacing: '1px', textTransform: 'uppercase',
        ...revealStyle(inView),
      }}>
        <span style={{ color: '#38c878', ...neonGlow }}>Capabilities:</span>{' '}
        What We Build
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px', perspective: '1200px' }}>
        {cards.map((c, i) => (
          <TiltCard key={i} style={{
            padding: '40px', borderRadius: '8px',
            background: 'rgba(18, 18, 26, 0.7)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56,200,120,0.06)',
            ...revealStyle(inView, 0.1 * (i + 1), 'scale'),
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56,200,120,0.05), rgba(18,18,26,0.8))';
              e.currentTarget.style.borderColor = 'rgba(56,200,120,0.35)';
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(56,200,120,0.12), inset 0 0 30px rgba(56,200,120,0.03)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(18, 18, 26, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(56,200,120,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              marginBottom: '20px', filter: 'drop-shadow(0 0 8px rgba(56,200,120,0.3))',
            }}>{icons[c.icon]}</div>
            <h3 style={{
              fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 700, color: '#fff',
              marginBottom: '12px', lineHeight: 1.4, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>{c.title}</h3>
            <p style={{ color: '#8a8a9a', lineHeight: 1.7, fontSize: '14px' }}>{c.desc}</p>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function ToolsSection() {
  const [active, setActive] = useState(0);
  const [ref, inView] = useInView();
  const intervalRef = useRef(null);

  const tools = [
    { title: 'CaseMind', desc: 'AI-powered legal research engine that searches millions of cases, statutes, and regulations \u2014 delivering relevant precedents and summaries in plain language, built for attorneys who bill by the hour.' },
    { title: 'ContractGuard', desc: 'Automated contract analysis that reads, compares, and scores risk across thousands of clauses. Flags missing provisions, non-standard terms, and compliance gaps before they become problems.' },
    { title: 'SecureVault', desc: 'Multi-cloud clinical data platform on AWS, GCP, and Azure. End-to-end encrypted storage with HIPAA-aligned access controls, automated backups, and real-time audit logging.' },
    { title: 'IntakeFlow', desc: 'Intelligent client intake automation that collects information, verifies documents, performs conflict checks, and routes new matters to the right attorney \u2014 available 24/7.' },
  ];

  const startInterval = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setActive(p => (p + 1) % tools.length), 5000);
  }, []);

  useEffect(() => { startInterval(); return () => clearInterval(intervalRef.current); }, [startInterval]);

  const goTo = (idx) => { setActive(idx); startInterval(); };

  return (
    <section id="tools" style={{ padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 48px)', maxWidth: '1200px', margin: '0 auto' }} ref={ref}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 36px)', fontWeight: 700,
        color: '#fff', marginBottom: '56px', letterSpacing: '1px', textTransform: 'uppercase',
        ...revealStyle(inView),
      }}>
        <span style={{ color: '#38c878', ...neonGlow }}>Platform:</span>{' '}
        Legal AI Tools
      </h2>
      <div style={{
        background: 'rgba(18,18,26,0.7)', borderRadius: '8px',
        border: '1px solid rgba(56,200,120,0.08)', backdropFilter: 'blur(16px)',
        padding: 'clamp(32px, 5vw, 56px)',
        boxShadow: '0 0 60px rgba(56,200,120,0.03)',
        ...revealStyle(inView, 0.15),
      }}>
        {/* Counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <span style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700,
            color: '#fff', letterSpacing: '2px',
          }}>
            {String(active + 1).padStart(2, '0')} <span style={{ color: '#2a2a3a' }}>/ {String(tools.length).padStart(2, '0')}</span>
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { label: '\u2190', onClick: () => goTo((active - 1 + tools.length) % tools.length) },
              { label: '\u2192', onClick: () => goTo((active + 1) % tools.length) },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick}
                style={{
                  width: '44px', height: '44px', borderRadius: '4px',
                  border: '1px solid rgba(56,200,120,0.15)', background: 'transparent',
                  color: '#8a8a9a', fontSize: '18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#38c878';
                  e.currentTarget.style.color = '#38c878';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(56,200,120,0.15)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(56,200,120,0.15)';
                  e.currentTarget.style.color = '#8a8a9a';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >{btn.label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ minHeight: '120px' }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(18px, 2.5vw, 28px)', fontWeight: 700,
            color: '#38c878', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase',
            transition: 'all 0.4s ease', ...neonGlow,
          }}>
            {tools[active].title}
          </h3>
          <p style={{
            color: '#8a8a9a', lineHeight: 1.7, fontSize: 'clamp(14px, 1.6vw, 17px)',
            maxWidth: '640px', transition: 'all 0.4s ease',
          }}>
            {tools[active].desc}
          </p>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '36px' }}>
          {tools.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              style={{
                width: active === i ? '40px' : '10px', height: '3px', border: 'none',
                background: active === i ? '#38c878' : 'rgba(255,255,255,0.1)', cursor: 'pointer',
                borderRadius: '2px', transition: 'all 0.4s ease',
                boxShadow: active === i ? '0 0 10px rgba(56,200,120,0.4)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const [ref1, val1] = useCountUp(15, 2000);
  const [ref2, val2] = useCountUp(70, 2000);
  const [ref3, val3] = useCountUp(99, 2000);
  const [sectionRef, inView] = useInView();

  const stats = [
    { ref: ref1, value: `${val1}+`, label: 'years of cloud engineering excellence across AWS, GCP, and Azure' },
    { ref: ref2, value: `${val2}%`, label: 'reduction in legal research time with our custom AI bots' },
    { ref: ref3, value: `${val3}.9%`, label: 'uptime across all managed cloud deployments' },
  ];

  const insights = [
    { tag: 'Legal AI', title: 'Why Small Law Firms Need Custom AI Now', desc: 'Off-the-shelf tools weren\'t built for your practice. Custom bots trained on your workflows deliver 10x the value at a fraction of enterprise cost.' },
    { tag: 'Security', title: 'Managing Clinical Data in the Cloud Securely', desc: 'How we architect HIPAA-aligned data pipelines across multi-cloud environments without sacrificing performance or accessibility.' },
    { tag: 'Industry Trends', title: 'The $200B Legal Tech Opportunity', desc: 'AI is transforming how law firms operate. Firms that adopt now will outpace competitors still buried in manual processes.' },
  ];

  return (
    <section id="insights" style={{ padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 48px)', maxWidth: '1200px', margin: '0 auto' }} ref={sectionRef}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(20px, 3vw, 36px)', fontWeight: 700,
        color: '#fff', marginBottom: '56px', letterSpacing: '1px', textTransform: 'uppercase',
        ...revealStyle(inView),
      }}>
        <span style={{ color: '#38c878', ...neonGlow }}>Results:</span> Our Impact
      </h2>

      {/* Stat counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '24px', marginBottom: '80px' }}>
        {stats.map((s, i) => (
          <TiltCard key={i} style={{
            textAlign: 'center', padding: '36px', borderRadius: '8px',
            background: 'rgba(18,18,26,0.7)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56,200,120,0.08)',
            ...revealStyle(inView, 0.15 * (i + 1)),
          }}>
            <div ref={s.ref} style={{
              fontFamily: 'var(--font-heading)', fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 800, color: '#38c878', letterSpacing: '2px', lineHeight: 1,
              ...neonGlow,
            }}>
              {s.value}
            </div>
            <p style={{ color: '#8a8a9a', fontSize: '13px', lineHeight: 1.6, marginTop: '14px' }}>{s.label}</p>
          </TiltCard>
        ))}
      </div>

      {/* Insight cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
        {insights.map((ins, i) => (
          <TiltCard key={i} style={{
            padding: '32px', borderRadius: '8px', background: 'rgba(18,18,26,0.5)',
            backdropFilter: 'blur(8px)', border: '1px solid rgba(56,200,120,0.06)',
            ...revealStyle(inView, 0.3 + 0.1 * i),
            cursor: 'pointer',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(56,200,120,0.25)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(56,200,120,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(56,200,120,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#38c878',
              textTransform: 'uppercase', letterSpacing: '2px',
              textShadow: '0 0 8px rgba(56,200,120,0.4)',
            }}>{ins.tag}</span>
            <h3 style={{
              fontFamily: 'var(--font-heading)', fontSize: '14px', fontWeight: 700, color: '#fff',
              margin: '14px 0 10px', lineHeight: 1.4, letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>{ins.title}</h3>
            <p style={{ color: '#8a8a9a', fontSize: '14px', lineHeight: 1.7 }}>{ins.desc}</p>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  const [ref, inView] = useInView();
  return (
    <section id="contact" style={{
      padding: 'clamp(80px, 12vw, 160px) clamp(16px, 4vw, 48px)', textAlign: 'center',
      position: 'relative', overflow: 'hidden',
    }} ref={ref}>
      {/* Background orb */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', width: '700px', height: '700px',
        transform: 'translate(-50%, -50%)', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,200,120,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', animation: 'glowPulse 4s ease infinite',
      }} />

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(56,200,120,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(56,200,120,0.015) 1px, transparent 1px)',
        backgroundSize: '60px 60px', pointerEvents: 'none',
      }} />

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38c878', letterSpacing: '3px',
        textTransform: 'uppercase', marginBottom: '24px', position: 'relative',
        ...revealStyle(inView), ...neonGlow,
      }}>
        [ Get Started Today ]
      </div>

      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 4vw, 46px)', fontWeight: 800,
        color: '#fff', marginBottom: '40px', letterSpacing: '1px', position: 'relative',
        lineHeight: 1.2, textTransform: 'uppercase', ...revealStyle(inView, 0.1),
      }}>
        Ready to build an AI bot<br />your firm can trust?
      </h2>

      <a href="#contact"
        style={{
          display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600,
          padding: '18px 52px', background: 'rgba(56,200,120,0.1)', color: '#38c878',
          borderRadius: '4px', textDecoration: 'none', position: 'relative', letterSpacing: '2px',
          textTransform: 'uppercase',
          border: '1px solid rgba(56,200,120,0.4)',
          boxShadow: '0 0 30px rgba(56,200,120,0.15), inset 0 0 30px rgba(56,200,120,0.05)',
          transition: 'all 0.4s ease',
          ...revealStyle(inView, 0.2),
        }}
        onMouseEnter={e => {
          e.target.style.boxShadow = '0 0 60px rgba(56,200,120,0.4), inset 0 0 40px rgba(56,200,120,0.1)';
          e.target.style.background = 'rgba(56,200,120,0.15)';
          e.target.style.borderColor = '#38c878';
        }}
        onMouseLeave={e => {
          e.target.style.boxShadow = '0 0 30px rgba(56,200,120,0.15), inset 0 0 30px rgba(56,200,120,0.05)';
          e.target.style.background = 'rgba(56,200,120,0.1)';
          e.target.style.borderColor = 'rgba(56,200,120,0.4)';
        }}
      >
        Contact Us
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      padding: '32px clamp(16px, 4vw, 48px)',
      borderTop: '1px solid rgba(56,200,120,0.06)',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', maxWidth: '1200px', margin: '0 auto', width: '100%',
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)', fontSize: '11px', color: '#38c878',
        letterSpacing: '2px', textTransform: 'uppercase',
      }}>
        &copy; 2026 Solution AI Pro
      </span>
      <div style={{ display: 'flex', gap: '24px' }}>
        {['LinkedIn', 'Twitter', 'GitHub'].map(s => (
          <a key={s} href="#" style={{
            fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#3a3a4a',
            textDecoration: 'none', transition: 'all 0.3s ease', letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
            onMouseEnter={e => { e.target.style.color = '#38c878'; e.target.style.textShadow = '0 0 8px rgba(56,200,120,0.4)'; }}
            onMouseLeave={e => { e.target.style.color = '#3a3a4a'; e.target.style.textShadow = 'none'; }}
          >{s}</a>
        ))}
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#3a3a4a' }}>
        AI solutions small businesses can afford and trust
      </span>
    </footer>
  );
}

/* ─── App ───────────────────────────────────────────────────────────── */

export default function App() {
  const scrollY = useScrollY();
  const [activeSection, setActiveSection] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sections = ['transform', 'blueprints', 'talent', 'tools', 'insights', 'contact'];
    const observers = sections.map(id => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.3, rootMargin: '-72px 0px -40% 0px' }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(obs => obs?.disconnect());
  }, [loaded]);

  if (!loaded) {
    return <Preloader onComplete={() => setLoaded(true)} />;
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <FloatingOrbs scrollY={scrollY} />
      <Navbar activeSection={activeSection} scrollY={scrollY} />
      <Hero />
      <AnchorTabs activeSection={activeSection} />
      <TransformSection />
      <CaseStudies />
      <BlueprintsSection />
      <TalentSection />
      <ToolsSection />
      <StatsSection />
      <CTASection />
      <Footer />
    </div>
  );
}

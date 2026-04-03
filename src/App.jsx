import { useState, useEffect, useRef, useCallback } from 'react';

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

/* ─── Animation helpers ─────────────────────────────────────────────── */

const ease = 'cubic-bezier(.16,1,.3,1)';

function revealStyle(isInView, delay = 0, direction = 'up') {
  const transforms = { up: 'translateY(40px)', down: 'translateY(-40px)', left: 'translateX(40px)', right: 'translateX(-40px)', scale: 'scale(0.95)' };
  return {
    opacity: isInView ? 1 : 0,
    transform: isInView ? 'translate(0) scale(1)' : transforms[direction],
    transition: `opacity 0.8s ${ease} ${delay}s, transform 0.8s ${ease} ${delay}s`,
  };
}

/* ─── Particle Canvas ───────────────────────────────────────────────── */

function ParticleCanvas() {
  const canvasRef = useRef(null);
  const scrollY = useScrollY();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    const PARTICLE_COUNT = 80;
    const MAX_DIST = 180;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 200, 120, 0.6)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(56, 200, 120, ${0.15 * (1 - dist / MAX_DIST)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        transform: `translateY(${scrollY * 0.15}px)`, pointerEvents: 'none',
      }}
    />
  );
}

/* ─── SVG Icons for AI/Talent cards ─────────────────────────────────── */

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
      background: scrolled ? 'rgba(10, 10, 15, 0.82)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      transition: 'all 0.4s ease',
    }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', color: '#fff', letterSpacing: '-0.3px' }}>
        Solution AI Pro
      </span>

      {/* Desktop links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="hidden md:flex">
        {links.map(l => (
          <a key={l.id} href={`#${l.id}`}
            onClick={e => { e.preventDefault(); document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '13px', textDecoration: 'none', letterSpacing: '0.5px',
              color: activeSection === l.id ? '#38c878' : '#8a8a9a',
              transition: 'color 0.3s ease',
            }}
          >{l.label}</a>
        ))}
        <a href="#contact"
          onClick={e => { e.preventDefault(); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '13px', padding: '10px 24px',
            background: '#38c878', color: '#0a0a0f', borderRadius: '999px', textDecoration: 'none',
            fontWeight: 600, transition: 'all 0.3s ease', letterSpacing: '0.5px',
          }}
          onMouseEnter={e => { e.target.style.background = '#2ebd6e'; e.target.style.boxShadow = '0 0 24px rgba(56,200,120,0.35)'; }}
          onMouseLeave={e => { e.target.style.background = '#38c878'; e.target.style.boxShadow = 'none'; }}
        >Contact Us</a>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          position: 'absolute', top: '72px', left: 0, right: 0, background: 'rgba(10,10,15,0.95)',
          backdropFilter: 'blur(20px)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {links.map(l => (
            <a key={l.id} href={`#${l.id}`}
              onClick={e => { e.preventDefault(); setMobileOpen(false); document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', textDecoration: 'none', color: activeSection === l.id ? '#38c878' : '#8a8a9a' }}
            >{l.label}</a>
          ))}
          <a href="#contact"
            onClick={e => { e.preventDefault(); setMobileOpen(false); document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', padding: '12px 24px', background: '#38c878', color: '#0a0a0f', borderRadius: '999px', textDecoration: 'none', fontWeight: 600, textAlign: 'center' }}
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
    const timers = words.map((_, i) => setTimeout(() => setRevealed(i + 1), 300 + i * 150));
    return () => timers.forEach(clearTimeout);
  }, []);

  const [subtitleRef, subtitleVisible] = useInView();

  return (
    <section style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <ParticleCanvas />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 24px', maxWidth: '900px' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(32px, 5.5vw, 64px)', lineHeight: 1.1, letterSpacing: '-1.5px', color: '#fff', marginBottom: '24px' }}>
          {words.map((w, i) => (
            <span key={i} style={{
              display: 'inline-block', marginRight: '0.3em',
              opacity: i < revealed ? 1 : 0,
              transform: i < revealed ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s ${ease}, transform 0.5s ${ease}`,
            }}>{w}</span>
          ))}
        </h1>
        <p ref={subtitleRef} style={{
          fontFamily: 'var(--font-body)', fontSize: 'clamp(16px, 2vw, 20px)', color: '#8a8a9a',
          maxWidth: '640px', margin: '0 auto', lineHeight: 1.6,
          opacity: subtitleVisible ? 1 : 0, transform: subtitleVisible ? 'translateY(0)' : 'translateY(16px)',
          transition: `opacity 0.8s ${ease} 0.3s, transform 0.8s ${ease} 0.3s`,
        }}>
          Affordable, secure AI solutions for lawyers, legal professionals, and small law firms. We build custom bots that manage clinical data with enterprise-grade security — powered by 15+ years of cloud excellence on AWS, GCP, and Azure.
        </p>
      </div>
      <div style={{
        position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
        animation: 'bounce 2s infinite',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="#38c878" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <style>{`@keyframes bounce { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(10px); } }`}</style>
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
      position: 'sticky', top: '72px', zIndex: 90, background: 'rgba(10, 10, 15, 0.9)',
      backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', justifyContent: 'center', gap: 'clamp(8px, 2vw, 24px)', padding: '16px 24px',
    }}>
      {tabs.map(t => (
        <button key={t.id}
          onClick={() => document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 'clamp(11px, 1.4vw, 14px)', padding: '8px 20px',
            background: activeSection === t.id ? 'rgba(56,200,120,0.1)' : 'transparent',
            color: activeSection === t.id ? '#38c878' : '#8a8a9a',
            border: 'none', borderRadius: '999px', cursor: 'pointer',
            borderBottom: activeSection === t.id ? '2px solid #38c878' : '2px solid transparent',
            transition: 'all 0.3s ease', letterSpacing: '0.5px',
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
    <section id="transform" style={{ padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 48px)', maxWidth: '1200px', margin: '0 auto' }} ref={ref}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 700,
        color: '#fff', marginBottom: '56px', letterSpacing: '-0.5px', ...revealStyle(inView),
      }}>
        <span style={{ fontStyle: 'italic', color: '#38c878' }}>Solutions:</span> AI That Lawyers Can Actually Afford and Trust
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '32px' }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            padding: '40px', borderRadius: '16px', position: 'relative',
            background: 'linear-gradient(135deg, rgba(18,18,26,0.9), rgba(26,26,37,0.6))',
            border: '1px solid rgba(56,200,120,0.12)',
            ...revealStyle(inView, 0.15 * (i + 1)),
            transition: `opacity 0.8s ${ease} ${0.15 * (i + 1)}s, transform 0.8s ${ease} ${0.15 * (i + 1)}s, box-shadow 0.3s ease, border-color 0.3s ease`,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,200,120,0.35)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(56,200,120,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(56,200,120,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(56,200,120,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: '#38c878', marginBottom: '20px',
            }}>{c.num}</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>{c.title}</h3>
            <p style={{ color: '#8a8a9a', lineHeight: 1.6, fontSize: '15px' }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CaseStudies() {
  const [ref, inView] = useInView();
  const cases = [
    { tag: 'Law Firm · AWS', title: 'AI-Powered Case Research Assistant', desc: 'Custom bot that searches case law, summarizes precedents, and drafts research memos — cutting research time by 70% for a 12-attorney firm.' },
    { tag: 'Legal Practice · Azure', title: 'Secure Client Intake Automation', desc: 'AI-driven intake system that collects, validates, and routes client data with end-to-end encryption, processing 200+ new matters monthly.' },
    { tag: 'Solo Attorney · GCP', title: 'Contract Review & Risk Scoring', desc: 'ML model trained on 50,000+ contracts to flag risk clauses, missing terms, and compliance gaps in under 30 seconds.' },
    { tag: 'Clinical Data · Multi-Cloud', title: 'HIPAA-Compliant Data Pipeline', desc: 'Secure clinical data management system across AWS and Azure, handling 10,000+ patient records with zero compliance violations.' },
  ];

  return (
    <section style={{ padding: 'clamp(48px, 8vw, 96px) 0', overflow: 'hidden' }} ref={ref}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 700,
        color: '#fff', marginBottom: '48px', padding: '0 clamp(16px, 4vw, 48px)', letterSpacing: '-0.5px',
        ...revealStyle(inView),
      }}>
        <span style={{ color: '#38c878' }}>Real Results:</span> AI in Action Across Legal Practices
      </h2>
      <div style={{
        display: 'flex', gap: '24px', overflowX: 'auto', scrollSnapType: 'x mandatory',
        padding: '8px clamp(16px, 4vw, 48px) 24px', WebkitOverflowScrolling: 'touch',
      }}>
        {cases.map((c, i) => (
          <div key={i} style={{
            minWidth: 'clamp(280px, 35vw, 360px)', scrollSnapAlign: 'start', padding: '32px',
            borderRadius: '16px', background: 'rgba(18, 18, 26, 0.6)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
            ...revealStyle(inView, 0.15 * i, 'right'),
            transition: `opacity 0.8s ${ease} ${0.15 * i}s, transform 0.4s ${ease}, box-shadow 0.4s ease, border-color 0.4s ease`,
            cursor: 'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(56,200,120,0.3)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(56,200,120,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38c878', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{c.tag}</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: '#fff', margin: '16px 0 12px', lineHeight: 1.3 }}>{c.title}</h3>
            <p style={{ color: '#8a8a9a', lineHeight: 1.6, fontSize: '14px' }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StepperColumn({ title, steps, delayBase = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ flex: 1, minWidth: 'min(100%, 380px)' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '32px', ...revealStyle(inView, delayBase) }}>{title}</h3>
      <div style={{ position: 'relative', paddingLeft: '32px' }}>
        <div style={{ position: 'absolute', left: '8px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(56,200,120,0.2)' }} />
        {steps.map((s, i) => (
          <div key={i} style={{ marginBottom: '28px', position: 'relative', ...revealStyle(inView, delayBase + 0.15 * (i + 1), 'left') }}>
            <div style={{
              position: 'absolute', left: '-28px', top: '4px', width: '14px', height: '14px',
              borderRadius: '50%', background: inView ? '#38c878' : 'rgba(56,200,120,0.2)',
              transition: `background 0.5s ${ease} ${delayBase + 0.15 * (i + 1)}s`,
              boxShadow: inView ? '0 0 10px rgba(56,200,120,0.3)' : 'none',
            }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#38c878', letterSpacing: '1px' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <p style={{ color: '#e8e8ed', fontSize: '16px', marginTop: '4px', lineHeight: 1.5 }}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlueprintsSection() {
  const [ref, inView] = useInView();
  return (
    <section id="blueprints" style={{ padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 48px)', maxWidth: '1200px', margin: '0 auto' }} ref={ref}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 700,
        color: '#fff', marginBottom: '56px', letterSpacing: '-0.5px', ...revealStyle(inView),
      }}>
        <span style={{ fontStyle: 'italic', color: '#38c878' }}>How It Works:</span> From Consultation to Deployed AI in Weeks
      </h2>
      <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
        <StepperColumn
          title="Your Custom Bot Journey"
          steps={['Discovery Call — We learn your firm\'s workflows, pain points, and data requirements', 'Architecture & Security — We design your solution on AWS, GCP, or Azure with compliance built in', 'Build & Train — Custom AI models trained on your domain, integrated with your existing tools', 'Deploy & Support — Go live with ongoing monitoring, updates, and dedicated support']}
          delayBase={0.15}
        />
        <StepperColumn
          title="Our Security Framework"
          steps={['Data Encryption — AES-256 at rest, TLS 1.3 in transit across all cloud environments', 'Access Controls — Role-based permissions, MFA, and audit logging for every interaction', 'Compliance — HIPAA-aligned processes for clinical data, SOC 2 security standards', 'Continuous Monitoring — 24/7 threat detection and automated vulnerability scanning']}
          delayBase={0.3}
        />
      </div>
    </section>
  );
}

function TalentSection() {
  const [ref, inView] = useInView();
  const cards = [
    { icon: 'agentic', title: 'Legal Research Bots', desc: 'AI assistants that search case law, analyze statutes, summarize depositions, and draft research memos — trained on your firm\'s practice areas.' },
    { icon: 'product', title: 'Document Automation', desc: 'Intelligent contract generation, review, and redlining. Auto-populate templates, flag risk clauses, and ensure compliance in seconds.' },
    { icon: 'modernization', title: 'Secure Data Pipelines', desc: 'Clinical and client data management built on AWS, GCP, and Azure. HIPAA-aligned encryption, access controls, and audit trails.' },
    { icon: 'managed', title: 'Managed AI Operations', desc: '24/7 monitoring, model retraining, and cloud infrastructure management. We handle the tech so you can focus on practicing law.' },
  ];

  return (
    <section id="talent" style={{ padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 48px)', maxWidth: '1200px', margin: '0 auto' }} ref={ref}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 700,
        color: '#fff', marginBottom: '56px', letterSpacing: '-0.5px', ...revealStyle(inView),
      }}>
        <span style={{ fontStyle: 'italic', color: '#38c878' }}>Capabilities:</span> What We Build for Legal Professionals
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            padding: '36px', borderRadius: '16px',
            background: 'rgba(18, 18, 26, 0.6)', border: '1px solid rgba(255,255,255,0.06)',
            ...revealStyle(inView, 0.1 * (i + 1), 'scale'),
            transition: `opacity 0.8s ${ease} ${0.1 * (i + 1)}s, transform 0.4s ${ease}, background 0.4s ease, border-color 0.4s ease`,
            cursor: 'default',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56,200,120,0.06), rgba(18,18,26,0.8))'; e.currentTarget.style.borderColor = '#38c878'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(18, 18, 26, 0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div style={{ marginBottom: '20px' }}>{icons[c.icon]}</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '12px', lineHeight: 1.3 }}>{c.title}</h3>
            <p style={{ color: '#8a8a9a', lineHeight: 1.6, fontSize: '15px' }}>{c.desc}</p>
          </div>
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
    { title: 'CaseMind', desc: 'AI-powered legal research engine that searches millions of cases, statutes, and regulations — delivering relevant precedents and summaries in plain language, built for attorneys who bill by the hour.' },
    { title: 'ContractGuard', desc: 'Automated contract analysis that reads, compares, and scores risk across thousands of clauses. Flags missing provisions, non-standard terms, and compliance gaps before they become problems.' },
    { title: 'SecureVault', desc: 'Multi-cloud clinical data platform on AWS, GCP, and Azure. End-to-end encrypted storage with HIPAA-aligned access controls, automated backups, and real-time audit logging.' },
    { title: 'IntakeFlow', desc: 'Intelligent client intake automation that collects information, verifies documents, performs conflict checks, and routes new matters to the right attorney — available 24/7.' },
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
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 700,
        color: '#fff', marginBottom: '56px', letterSpacing: '-0.5px', ...revealStyle(inView),
      }}>
        <span style={{ fontStyle: 'italic', color: '#38c878' }}>Platform:</span> Purpose-Built Legal AI Tools
      </h2>
      <div style={{
        background: 'rgba(18,18,26,0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)',
        padding: 'clamp(32px, 5vw, 56px)', ...revealStyle(inView, 0.15),
      }}>
        {/* Counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, color: '#fff', letterSpacing: '-2px' }}>
            {String(active + 1).padStart(2, '0')} <span style={{ color: '#5a5a6a' }}>/ {String(tools.length).padStart(2, '0')}</span>
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => goTo((active - 1 + tools.length) % tools.length)}
              style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#e8e8ed', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#38c878'; e.currentTarget.style.color = '#38c878'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#e8e8ed'; }}
            >←</button>
            <button onClick={() => goTo((active + 1) % tools.length)}
              style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#e8e8ed', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#38c878'; e.currentTarget.style.color = '#38c878'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#e8e8ed'; }}
            >→</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ minHeight: '120px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 700, color: '#38c878', marginBottom: '16px', transition: 'all 0.4s ease' }}>
            {tools[active].title}
          </h3>
          <p style={{ color: '#8a8a9a', lineHeight: 1.7, fontSize: 'clamp(15px, 1.8vw, 18px)', maxWidth: '640px', transition: 'all 0.4s ease' }}>
            {tools[active].desc}
          </p>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '32px' }}>
          {tools.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              style={{
                width: active === i ? '32px' : '10px', height: '10px', borderRadius: '5px', border: 'none',
                background: active === i ? '#38c878' : 'rgba(255,255,255,0.15)', cursor: 'pointer',
                transition: 'all 0.4s ease',
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
    { ref: ref3, value: `${val3}.9%`, label: 'uptime across all managed cloud deployments — your data is always available' },
  ];

  const insights = [
    { tag: 'Legal AI', title: 'Why Small Law Firms Need Custom AI Now', desc: 'Off-the-shelf tools weren\'t built for your practice. Custom bots trained on your workflows deliver 10x the value at a fraction of enterprise cost.' },
    { tag: 'Security', title: 'Managing Clinical Data in the Cloud Securely', desc: 'How we architect HIPAA-aligned data pipelines across multi-cloud environments without sacrificing performance or accessibility.' },
    { tag: 'Industry Trends', title: 'The $200B Legal Tech Opportunity', desc: 'AI is transforming how law firms operate. Firms that adopt now will outpace competitors still buried in manual processes.' },
  ];

  return (
    <section id="insights" style={{ padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 48px)', maxWidth: '1200px', margin: '0 auto' }} ref={sectionRef}>
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 3.5vw, 42px)', fontWeight: 700,
        color: '#fff', marginBottom: '56px', letterSpacing: '-0.5px', ...revealStyle(inView),
      }}>Our AI Insights</h2>

      {/* Stat counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '32px', marginBottom: '80px' }}>
        {stats.map((s, i) => (
          <div key={i} ref={s.ref} style={{
            textAlign: 'center', padding: '32px', borderRadius: '16px',
            background: 'rgba(18,18,26,0.6)', border: '1px solid rgba(56,200,120,0.1)',
            ...revealStyle(inView, 0.15 * (i + 1)),
          }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 800, color: '#38c878', letterSpacing: '-2px', lineHeight: 1 }}>
              {s.value}
            </div>
            <p style={{ color: '#8a8a9a', fontSize: '14px', lineHeight: 1.6, marginTop: '12px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Insight cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
        {insights.map((ins, i) => (
          <div key={i} style={{
            padding: '28px', borderRadius: '12px', background: 'rgba(18,18,26,0.4)',
            border: '1px solid rgba(255,255,255,0.06)', ...revealStyle(inView, 0.3 + 0.1 * i),
            transition: `opacity 0.8s ${ease} ${0.3 + 0.1 * i}s, transform 0.3s ease, border-color 0.3s ease`,
            cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,200,120,0.2)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38c878', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{ins.tag}</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: '#fff', margin: '12px 0 8px', lineHeight: 1.3 }}>{ins.title}</h3>
            <p style={{ color: '#8a8a9a', fontSize: '14px', lineHeight: 1.6 }}>{ins.desc}</p>
          </div>
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
        position: 'absolute', top: '50%', left: '50%', width: '600px', height: '600px',
        transform: 'translate(-50%, -50%)', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,200,120,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: 800,
        color: '#fff', marginBottom: '40px', letterSpacing: '-1px', position: 'relative',
        lineHeight: 1.15, ...revealStyle(inView),
      }}>
        Ready to build an AI bot<br />your firm can trust?
      </h2>
      <a href="#contact"
        style={{
          display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600,
          padding: '18px 48px', background: '#38c878', color: '#0a0a0f', borderRadius: '999px',
          textDecoration: 'none', position: 'relative', letterSpacing: '0.5px',
          boxShadow: '0 0 40px rgba(56,200,120,0.2)', transition: 'all 0.4s ease',
          ...revealStyle(inView, 0.2),
        }}
        onMouseEnter={e => { e.target.style.boxShadow = '0 0 60px rgba(56,200,120,0.4)'; e.target.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.target.style.boxShadow = '0 0 40px rgba(56,200,120,0.2)'; e.target.style.transform = 'translateY(0)'; }}
      >
        Contact Us
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      padding: '32px clamp(16px, 4vw, 48px)', borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', maxWidth: '1200px', margin: '0 auto', width: '100%',
    }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '14px', color: '#5a5a6a' }}>
        © 2026 Solution AI Pro
      </span>
      <div style={{ display: 'flex', gap: '24px' }}>
        {['LinkedIn', 'Twitter', 'GitHub'].map(s => (
          <a key={s} href="#" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#5a5a6a', textDecoration: 'none', transition: 'color 0.3s ease', letterSpacing: '0.5px' }}
            onMouseEnter={e => e.target.style.color = '#38c878'}
            onMouseLeave={e => e.target.style.color = '#5a5a6a'}
          >{s}</a>
        ))}
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#5a5a6a' }}>
        AI solutions small businesses can afford and trust
      </span>
    </footer>
  );
}

/* ─── App ───────────────────────────────────────────────────────────── */

export default function App() {
  const scrollY = useScrollY();
  const [activeSection, setActiveSection] = useState('');

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
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
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

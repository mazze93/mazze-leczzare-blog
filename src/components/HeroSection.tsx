import { useState, useEffect } from 'react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
}

export default function HeroSection({ title, subtitle, ctaLabel, ctaHref }: HeroSectionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="hero"
      aria-label="Hero section"
      style={{
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        background: 'linear-gradient(160deg, #0f1219 0%, #1a1040 50%, #0d0d1a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(108,99,255,0.25) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '15%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(224,64,251,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 7vw, 5rem)',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.1,
            margin: '0 0 1rem',
            letterSpacing: '-0.03em',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
            color: 'rgba(255,255,255,0.75)',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s',
          }}
        >
          {subtitle}
        </p>
        <a
          href={ctaHref}
          style={{
            display: 'inline-block',
            padding: '0.9em 2.2em',
            background: 'linear-gradient(135deg, #6c63ff 0%, #e040fb 100%)',
            color: '#fff',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s, box-shadow 0.25s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.boxShadow = '0 8px 32px rgba(108,99,255,0.6)';
            el.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            el.style.boxShadow = '0 4px 20px rgba(108,99,255,0.4)';
            el.style.transform = visible ? 'translateY(0)' : 'translateY(16px)';
          }}
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';

interface HeroSectionProps {
  /** Main headline — use \n to break lines */
  headline: string;
  /** Eyebrow label shown above the headline */
  eyebrow?: string;
  /** Tagline paragraph below the headline */
  tagline: string;
  /** Primary CTA label */
  ctaLabel: string;
  /** Primary CTA href */
  ctaHref: string;
  /** Secondary link label */
  secondaryLabel?: string;
  /** Secondary link href */
  secondaryHref?: string;
  /** Artwork src — defaults to hero-signal-grid.svg */
  artworkSrc?: string;
  /** Artwork caption */
  artworkCaption?: string;
  /** Discipline tags shown in bottom bar */
  disciplines?: string[];
}

export default function HeroSection({
  headline,
  eyebrow = 'Field Notes',
  tagline,
  ctaLabel,
  ctaHref,
  secondaryLabel = 'About',
  secondaryHref = '/about/',
  artworkSrc = '/hero-signal-grid.svg',
  artworkCaption = 'Working studio',
  disciplines = ['Science', 'Brand', 'Cybersecurity', 'Story'],
}: HeroSectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small rAF delay so first paint is fully committed before animation starts
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Split headline into lines then words for staggered entrance
  const lines = headline.split('\n');
  let wordIndex = 0;
  const wordDelay = (n: number) => `${0.5 + n * 0.07}s`;

  return (
    <section
      aria-label="Introduction"
      className={`editorial-hero${mounted ? ' hero-mounted' : ''}`}
      style={{
        minHeight: 'calc(100dvh - 56px)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--home-bg)',
        padding: '0 1.5rem',
      }}
    >
      {/* ── Top rule ───────────────────────────────────────────────── */}
      <div
        className="hero-rule"
        aria-hidden="true"
        style={{
          height: '1px',
          background: 'var(--home-rule)',
          marginTop: '2.5rem',
        }}
      />

      {/* ── Label row ──────────────────────────────────────────────── */}
      <div
        className="hero-label-row"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginTop: '1.25rem',
          marginBottom: '3.5rem',
          maxWidth: '1120px',
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-home-sans)',
            fontSize: '0.72rem',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--home-text-faint)',
          }}
        >
          {eyebrow}
        </span>
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-home-sans)',
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
            color: 'var(--home-text-faint)',
          }}
        >
          2026
        </span>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(240px, 0.75fr)',
          gap: '3rem',
          alignItems: 'start',
          maxWidth: '1120px',
          width: '100%',
          alignSelf: 'center',
          flex: 1,
        }}
      >
        {/* Left — editorial text */}
        <div>
          {/* Headline */}
          <h1
            style={{
              fontFamily: 'var(--font-home-display)',
              fontWeight: 400,
              color: 'var(--home-text)',
              lineHeight: 1.00,
              letterSpacing: '-0.02em',
              margin: '0 0 2rem',
              fontSize: 'clamp(3rem, 7.5vw, 6.5rem)',
            }}
          >
            {lines.map((line, li) => (
              <span
                key={li}
                style={{ display: 'block' }}
              >
                {line.split(' ').map((word, wi) => {
                  const delay = wordDelay(wordIndex++);
                  return (
                    <span
                      key={wi}
                      className="hero-word"
                      style={
                        { '--word-delay': delay } as React.CSSProperties
                      }
                    >
                      {word}
                      {wi < line.split(' ').length - 1 && '\u00A0'}
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>

          {/* Tagline + CTAs */}
          <div className="hero-body">
            <p
              style={{
                fontFamily: 'var(--font-home-sans)',
                fontSize: 'clamp(0.9rem, 1.8vw, 1.1rem)',
                fontWeight: 300,
                color: 'var(--home-text-dim)',
                lineHeight: 1.75,
                maxWidth: '46ch',
                margin: '0 0 2.5rem',
              }}
            >
              {tagline}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
              <a
                href={ctaHref}
                style={{
                  fontFamily: 'var(--font-home-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--home-text)',
                  textDecoration: 'none',
                  borderBottom: '1px solid var(--home-text)',
                  paddingBottom: '2px',
                  transition: 'color 150ms ease, border-color 150ms ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--home-gold)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--home-gold)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--home-text)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--home-text)';
                }}
              >
                {ctaLabel} ↗
              </a>
              <a
                href={secondaryHref}
                style={{
                  fontFamily: 'var(--font-home-sans)',
                  fontSize: '0.8rem',
                  fontWeight: 400,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--home-text-faint)',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--home-text-dim)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.color = 'var(--home-text-faint)';
                }}
              >
                {secondaryLabel}
              </a>
            </div>
          </div>
        </div>

        {/* Right — artwork panel */}
        <aside
          className="hero-art-panel"
          aria-hidden="true"
          style={{
            border: '1px solid var(--home-rule)',
            background: 'var(--home-surface)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              aspectRatio: '4 / 5',
              overflow: 'hidden',
            }}
          >
            <img
              src={artworkSrc}
              alt=""
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.72,
              }}
            />
          </div>
          <div
            style={{
              padding: '1rem 1.25rem 1.25rem',
              borderTop: '1px solid var(--home-rule)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-home-sans)',
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--home-text-faint)',
                margin: '0 0 0.35rem',
              }}
            >
              {artworkCaption}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-home-display)',
                fontSize: '0.95rem',
                fontStyle: 'italic',
                color: 'var(--home-text-dim)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              mazzeleczzare.com
            </p>
          </div>
        </aside>
      </div>

      {/* ── Bottom rule + disciplines ───────────────────────────────── */}
      <div
        style={{
          maxWidth: '1120px',
          width: '100%',
          alignSelf: 'center',
          marginTop: '3.5rem',
          paddingBottom: '2.5rem',
        }}
      >
        <div
          className="hero-rule hero-rule-bottom"
          aria-hidden="true"
          style={{ height: '1px', background: 'var(--home-rule)', marginBottom: '1.25rem' }}
        />
        <div
          className="hero-disciplines"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          {disciplines.map((d, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-home-sans)',
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--home-text-faint)',
              }}
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

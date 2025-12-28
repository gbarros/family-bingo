'use client';

// New Year background with floating particles/emojis
const PARTICLES = ['✨', '🥂', '🎆', '🍾', '🌟', '💫', '🎇', '2026', 'paz', 'saúde', 'amor'];

interface NewYearBackgroundProps {
  paused?: boolean;
}

export default function NewYearBackground({ paused = false }: NewYearBackgroundProps) {
  const playState = paused ? 'paused' : 'running';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 newyear-starfield" style={{ animationPlayState: playState }} />
      <div className="glow-orb glow-orb-gold -top-24 -left-12 w-[420px] h-[420px]" />
      <div className="glow-orb glow-orb-silver -top-32 right-0 w-[360px] h-[360px]" />
      <div className="glow-orb glow-orb-ice -bottom-40 left-1/2 -translate-x-1/2 w-[620px] h-[320px]" />

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <div key={i} className="firework-particle" style={{ animationPlayState: playState }}>
          {PARTICLES[i % PARTICLES.length]}
        </div>
      ))}
      
      {/* Overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-forest/85 via-transparent to-forest/15 pointer-events-none" />
    </div>
  );
}

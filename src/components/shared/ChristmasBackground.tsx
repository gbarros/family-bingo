'use client';

// Christmas snowfall background (CSS-only)

export default function ChristmasBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Snowflakes */}
      {[...Array(10)].map((_, i) => (
        <div key={i} className="snowflake">
          ❄
        </div>
      ))}
    </div>
  );
}

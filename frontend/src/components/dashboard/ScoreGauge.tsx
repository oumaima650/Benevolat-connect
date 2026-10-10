interface ScoreGaugeProps {
  score: number; // 0–100
  size?: number; // SVG size in px, default 100
}

export function ScoreGauge({ score, size = 100 }: ScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Circle geometry (viewBox 0 0 100 100)
  const cx = 50;
  const cy = 50;
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clampedScore / 100) * circumference;

  // Color based on score
  const strokeColor =
    clampedScore >= 70
      ? 'oklch(0.54 0.14 156)' // emerald
      : clampedScore >= 40
        ? 'oklch(0.83 0.16 91)' // mustard
        : 'oklch(0.7 0.16 355)'; // pink

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Score : ${clampedScore} sur 100`}
    >
      {/* Background circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="oklch(0.96 0.005 90)"
        strokeWidth={10}
      />
      {/* Colored arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {/* Score text */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="20"
        fontWeight="900"
        fontFamily="Bricolage Grotesque, system-ui, sans-serif"
        fill="oklch(0.16 0 0)"
      >
        {clampedScore}
      </text>
    </svg>
  );
}

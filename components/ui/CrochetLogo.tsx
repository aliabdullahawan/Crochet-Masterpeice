import React from "react";
import { cn } from "@/lib/utils";

// Round to 4 decimal places to prevent SSR/client hydration mismatches
const r4 = (n: number) => Math.round(n * 10000) / 10000;

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: "full" | "icon" | "horizontal";
}

/**
 * Crochet Masterpiece Logo — SVG recreated from original design
 * Features: circular frame, yarn balls, crochet hook, flowers, gold accents
 */
export const CrochetLogo = ({
  size = 80,
  showText = true,
  className,
  variant = "full",
}: LogoProps) => {
  if (variant === "horizontal") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <LogoIcon size={size * 0.6} />
        {showText && (
          <div className="flex flex-col leading-none">
            <span
              className="font-display font-semibold text-ink-dark"
              style={{ fontSize: size * 0.18 }}
            >
              Crochet
            </span>
            <span
              className="font-script text-caramel"
              style={{ fontSize: size * 0.16 }}
            >
              Masterpiece
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "icon") {
    return <LogoIcon size={size} className={className} />;
  }

  // Full variant — circular badge
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <LogoIcon size={size} />
      {showText && (
        <p
          className="font-script text-caramel/80 text-center"
          style={{ fontSize: size * 0.12 }}
        >
          Just a girl, who loves crochet 🧶
        </p>
      )}
    </div>
  );
};

/* =============================================
   CORE ICON SVG
   ============================================= */
const LogoIcon = ({
  size = 80,
  className,
}: {
  size?: number;
  className?: string;
}) => {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s * 0.44;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Crochet Masterpiece Logo"
    >
      <defs>
        {/* Pink blush wash */}
        <radialGradient id="blushWash" cx="40%" cy="55%" r="50%">
          <stop offset="0%" stopColor="#F4B8C1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFF8ED" stopOpacity="0" />
        </radialGradient>

        {/* Gold shimmer */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C97A" />
          <stop offset="50%" stopColor="#C8956C" />
          <stop offset="100%" stopColor="#E8C97A" />
        </linearGradient>

        {/* Yarn ball pink */}
        <radialGradient id="yarnPink" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F9D0D8" />
          <stop offset="100%" stopColor="#E8A0A8" />
        </radialGradient>

        {/* Yarn ball teal */}
        <radialGradient id="yarnTeal" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#9EDED8" />
          <stop offset="100%" stopColor="#5BB5AE" />
        </radialGradient>

        {/* Yarn ball cream */}
        <radialGradient id="yarnCream" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="100%" stopColor="#EDE0C4" />
        </radialGradient>
      </defs>

      {/* ── Outer cream circle ── */}
      <circle cx={cx} cy={cy} r={r + s * 0.04} fill="#FFF8ED" />

      {/* ── Blush wash inside ── */}
      <circle cx={cx} cy={cy} r={r} fill="url(#blushWash)" />

      {/* ── Main ring ── */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke="#C8956C"
        strokeWidth={s * 0.018}
        fill="none"
        strokeLinecap="round"
      />

      {/* ── Gold wheat / feather accent (top right) ── */}
      {[...Array(5)].map((_, i) => {
        const angle = -55 + i * 10;
        const rad = (angle * Math.PI) / 180;
        const ox = cx + r * 0.5 * r4(Math.cos(rad));
        const oy = cy - r * 0.7 + i * s * 0.024;
        return (
          <ellipse
            key={i}
            cx={ox + s * 0.12}
            cy={oy}
            rx={s * 0.055}
            ry={s * 0.018}
            fill="url(#goldGrad)"
            transform={`rotate(${-30 + i * 6} ${ox + s * 0.12} ${oy})`}
            opacity={0.9}
          />
        );
      })}

      {/* ── Pink flower (top left) ── */}
      <FlowerSVG
        cx={cx - r * 0.55}
        cy={cy - r * 0.55}
        size={s * 0.22}
        color="#F4B8C1"
        centerColor="#E8C97A"
      />

      {/* ── Leaf / branch under flower ── */}
      <path
        d={`M ${cx - r * 0.55} ${cy - r * 0.3} 
            C ${cx - r * 0.7} ${cy - r * 0.1} ${cx - r * 0.85} ${cy + r * 0.1} ${cx - r * 0.75} ${cy + r * 0.35}`}
        stroke="#9CAF88"
        strokeWidth={s * 0.014}
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaf 1 */}
      <ellipse
        cx={cx - r * 0.71}
        cy={cy - r * 0.02}
        rx={s * 0.065}
        ry={s * 0.032}
        fill="#9CAF88"
        opacity={0.7}
        transform={`rotate(-35 ${cx - r * 0.71} ${cy - r * 0.02})`}
      />
      {/* Leaf 2 */}
      <ellipse
        cx={cx - r * 0.79}
        cy={cy + r * 0.2}
        rx={s * 0.055}
        ry={s * 0.025}
        fill="#9CAF88"
        opacity={0.6}
        transform={`rotate(20 ${cx - r * 0.79} ${cy + r * 0.2})`}
      />

      {/* ── Brand text ── */}
      <text
        x={cx}
        y={cy - s * 0.06}
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="600"
        fontSize={s * 0.12}
        fill="#4A3728"
        letterSpacing="0.5"
      >
        Crochet
      </text>
      <text
        x={cx}
        y={cy + s * 0.07}
        textAnchor="middle"
        fontFamily="'Dancing Script', cursive"
        fontWeight="600"
        fontSize={s * 0.13}
        fill="#C8956C"
      >
        master
      </text>
      <text
        x={cx}
        y={cy + s * 0.2}
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="600"
        fontSize={s * 0.12}
        fill="#4A3728"
      >
        piece
      </text>

      {/* ── Yarn balls cluster (bottom right) ── */}
      {/* Pink yarn */}
      <YarnBallSVG cx={cx + r * 0.52} cy={cy + r * 0.42} r={s * 0.1} fill="url(#yarnPink)" lineColor="#E8A0A8" />
      {/* Teal yarn (behind pink) */}
      <YarnBallSVG cx={cx + r * 0.3} cy={cy + r * 0.55} r={s * 0.09} fill="url(#yarnTeal)" lineColor="#5BB5AE" />
      {/* Cream yarn */}
      <YarnBallSVG cx={cx + r * 0.7} cy={cy + r * 0.6} r={s * 0.08} fill="url(#yarnCream)" lineColor="#C8956C" />

      {/* ── Crochet hook ── */}
      <CrochetHookSVG cx={cx + r * 0.62} cy={cy + r * 0.25} size={s * 0.2} />

      {/* ── Sparkle dots ── */}
      {[
        { x: cx + r * 0.15, y: cy - r * 0.7 },
        { x: cx - r * 0.1, y: cy + r * 0.8 },
        { x: cx + r * 0.85, y: cy - r * 0.1 },
      ].map((dot, i) => (
        <circle
          key={i}
          cx={dot.x}
          cy={dot.y}
          r={s * 0.012}
          fill="#E8C97A"
          opacity={0.7}
        />
      ))}
    </svg>
  );
};

/* ---- Mini components for the logo SVG ---- */

const FlowerSVG = ({
  cx,
  cy,
  size,
  color,
  centerColor,
}: {
  cx: number;
  cy: number;
  size: number;
  color: string;
  centerColor: string;
}) => {
  const petalR = size * 0.35;
  const centerR = size * 0.2;
  return (
    <g>
      {[0, 60, 120, 180, 240, 300].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const px = cx + petalR * r4(Math.cos(rad));
        const py = cy + petalR * r4(Math.sin(rad));
        return (
          <ellipse
            key={angle}
            cx={px}
            cy={py}
            rx={size * 0.22}
            ry={size * 0.13}
            fill={color}
            opacity={0.85}
            transform={`rotate(${angle} ${px} ${py})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={centerR} fill={centerColor} opacity={0.9} />
    </g>
  );
};

const YarnBallSVG = ({
  cx,
  cy,
  r,
  fill,
  lineColor,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  lineColor: string;
}) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={fill} />
    {/* Yarn lines */}
    <path
      d={`M ${cx - r * 0.6} ${cy - r * 0.3} Q ${cx} ${cy - r * 0.8} ${cx + r * 0.6} ${cy - r * 0.1}`}
      stroke={lineColor}
      strokeWidth={r * 0.12}
      fill="none"
      strokeLinecap="round"
      opacity={0.5}
    />
    <path
      d={`M ${cx - r * 0.7} ${cy + r * 0.2} Q ${cx} ${cy + r * 0.6} ${cx + r * 0.5} ${cy + r * 0.1}`}
      stroke={lineColor}
      strokeWidth={r * 0.1}
      fill="none"
      strokeLinecap="round"
      opacity={0.4}
    />
    <circle cx={cx} cy={cy} r={r} fill="none" stroke={lineColor} strokeWidth={r * 0.08} opacity={0.2} />
  </g>
);

const CrochetHookSVG = ({
  cx,
  cy,
  size,
}: {
  cx: number;
  cy: number;
  size: number;
}) => (
  <g transform={`rotate(-35 ${cx} ${cy})`}>
    {/* Handle */}
    <rect
      x={cx - size * 0.07}
      y={cy - size * 0.5}
      width={size * 0.14}
      height={size * 0.7}
      rx={size * 0.07}
      fill="#C8956C"
      opacity={0.8}
    />
    {/* Hook curve */}
    <path
      d={`M ${cx} ${cy + size * 0.2} Q ${cx + size * 0.22} ${cy + size * 0.3} ${cx + size * 0.18} ${cy + size * 0.48}`}
      stroke="#A0724A"
      strokeWidth={size * 0.1}
      fill="none"
      strokeLinecap="round"
      opacity={0.8}
    />
  </g>
);

export default CrochetLogo;

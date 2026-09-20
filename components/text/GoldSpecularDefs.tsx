/** Flat specular reflection and soft glyph glow; no bevel or height lighting. */
export function GoldSpecularDefs({ id, fontSize }: { id: string; fontSize: number }) {
  const unit = fontSize / 120;
  return <>
    <linearGradient id={`${id}-streak`} x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#fff" stopOpacity="0" />
      <stop offset="32%" stopColor="#fff" stopOpacity="0" />
      <stop offset="41%" stopColor="#fff6d7" stopOpacity=".18" />
      <stop offset="49%" stopColor="#fffef5" stopOpacity=".65" />
      <stop offset="57%" stopColor="#fff6d7" stopOpacity=".18" />
      <stop offset="66%" stopColor="#fff" stopOpacity="0" />
      <stop offset="100%" stopColor="#fff" stopOpacity="0" />
    </linearGradient>
    <filter id={`${id}-reflection-soften`} x="-20%" y="-40%" width="140%" height="180%" colorInterpolationFilters="sRGB">
      <feGaussianBlur stdDeviation={fontSize * .035} />
    </filter>
    <filter id={`${id}-lighting`} x="-30%" y="-40%" width="160%" height="180%" colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation={1.1 * unit} result="halo" />
      <feFlood floodColor="#ffcf76" floodOpacity=".25" />
      <feComposite in2="halo" operator="in" result="glow" />
      <feMerge>
        <feMergeNode in="glow" /><feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </>;
}

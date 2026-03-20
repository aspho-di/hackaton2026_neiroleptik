// Crop SVG illustrations — 5 cultures × 3 status variants × weather overlays

const PALETTES = {
  пшеница: {
    normal:  { stem: '#7cb518', head: '#d4a017', grain: '#c8860f' },
    warning: { stem: '#a0a830', head: '#c8a030', grain: '#b08020' },
    anomaly: { stem: '#8a8a6a', head: '#9a8a5a', grain: '#7a7050' },
  },
  подсолнечник: {
    normal:  { stem: '#5a9e10', head: '#f5c518', petal: '#f59e0b', center: '#7c3f00' },
    warning: { stem: '#8aaa20', head: '#d4a830', petal: '#c8902a', center: '#6a3800' },
    anomaly: { stem: '#787858', head: '#8a8060', petal: '#887048', center: '#504030' },
  },
  кукуруза: {
    normal:  { stem: '#4caf50', leaf: '#3a9a40', cob: '#f5c518', kernel: '#d4a010' },
    warning: { stem: '#7aba38', leaf: '#68a030', cob: '#d4a828', kernel: '#b08820' },
    anomaly: { stem: '#788a68', leaf: '#6a7a58', cob: '#8a8058', kernel: '#706840' },
  },
  ячмень: {
    normal:  { stem: '#8bc34a', head: '#cddc39', awn: '#afb42b' },
    warning: { stem: '#a8b840', head: '#c0c838', awn: '#9ca030' },
    anomaly: { stem: '#8a9070', head: '#909870', awn: '#788060' },
  },
  соя: {
    normal:  { stem: '#4caf50', leaf: '#388e3c', pod: '#8bc34a' },
    warning: { stem: '#78b038', leaf: '#5a9028', pod: '#a0b840' },
    anomaly: { stem: '#788860', leaf: '#607050', pod: '#788858' },
  },
}

function SunOverlay() {
  return (
    <g>
      <circle cx="105" cy="13" r="7" fill="#fbbf24" opacity="0.9" />
      {[0,45,90,135,180,225,270,315].map(a => {
        const rad = a * Math.PI / 180
        const x1 = 105 + Math.cos(rad) * 9
        const y1 = 13 + Math.sin(rad) * 9
        const x2 = 105 + Math.cos(rad) * 13
        const y2 = 13 + Math.sin(rad) * 13
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth="1.5" opacity="0.8" />
      })}
    </g>
  )
}

function CrackedEarth() {
  return (
    <g opacity="0.55">
      <polyline points="10,88 20,84 28,88 36,85 44,88" fill="none" stroke="#a0806a" strokeWidth="1.2" />
      <polyline points="50,88 58,85 66,88 74,84 82,88" fill="none" stroke="#a0806a" strokeWidth="1.2" />
      <line x1="22" y1="84" x2="24" y2="90" stroke="#a0806a" strokeWidth="1" />
      <line x1="62" y1="85" x2="60" y2="91" stroke="#a0806a" strokeWidth="1" />
    </g>
  )
}

function RainOverlay() {
  const drops = [
    [15,10],[35,18],[55,8],[75,15],[95,10],
    [25,28],[45,22],[65,30],[85,24],[105,28],
  ]
  return (
    <g opacity="0.6">
      {drops.map(([x, y], i) => (
        <line key={i} x1={x} y1={y} x2={x-3} y2={y+9} stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" />
      ))}
    </g>
  )
}

// ── Wheat ────────────────────────────────────────────────────────────────────
function WheatCrop({ p, drooping }) {
  const stems = [
    { x: 40, grains: [{ dy: -22 }, { dy: -30 }, { dy: -38 }] },
    { x: 58, grains: [{ dy: -24 }, { dy: -32 }, { dy: -40 }, { dy: -48 }] },
    { x: 72, grains: [{ dy: -22 }, { dy: -30 }, { dy: -38 }] },
  ]
  return (
    <g transform={drooping ? 'rotate(-12, 60, 88)' : ''}>
      {stems.map((s, i) => (
        <g key={i}>
          <line x1={s.x} y1={88} x2={s.x} y2={88 - 52} stroke={p.stem} strokeWidth="2" />
          {/* leaves */}
          <path d={`M${s.x},${88-20} Q${s.x+12},${88-28} ${s.x+8},${88-36}`} fill="none" stroke={p.stem} strokeWidth="1.5" />
          {/* grain head */}
          {s.grains.map((g, j) => (
            <ellipse key={j} cx={s.x} cy={88 + g.dy} rx="3.5" ry="5" fill={j % 2 === 0 ? p.head : p.grain} />
          ))}
        </g>
      ))}
    </g>
  )
}

// ── Sunflower ────────────────────────────────────────────────────────────────
function SunflowerCrop({ p, drooping }) {
  const petalAngles = [0,30,60,90,120,150,180,210,240,270,300,330]
  return (
    <g transform={drooping ? 'rotate(-12, 60, 88)' : ''}>
      <line x1="60" y1="88" x2="60" y2="20" stroke={p.stem} strokeWidth="3" />
      <path d="M60,60 Q72,55 68,48" fill="none" stroke={p.stem} strokeWidth="1.8" />
      <path d="M60,65 Q48,60 50,52" fill="none" stroke={p.stem} strokeWidth="1.8" />
      {petalAngles.map(a => {
        const rad = a * Math.PI / 180
        const cx = 60 + Math.cos(rad) * 15
        const cy = 20 + Math.sin(rad) * 15
        return <ellipse key={a} cx={cx} cy={cy} rx="5" ry="3"
          fill={p.petal}
          transform={`rotate(${a},${cx},${cy})`} />
      })}
      <circle cx="60" cy="20" r="10" fill={p.head} />
      <circle cx="60" cy="20" r="7" fill={p.center} />
      {/* seeds pattern */}
      {[0,60,120,180,240,300].map(a => {
        const rad = a * Math.PI / 180
        return <circle key={a} cx={60 + Math.cos(rad)*4} cy={20 + Math.sin(rad)*4} r="1.2" fill={p.head} opacity="0.7" />
      })}
    </g>
  )
}

// ── Corn ─────────────────────────────────────────────────────────────────────
function CornCrop({ p, drooping }) {
  return (
    <g transform={drooping ? 'rotate(-10, 60, 88)' : ''}>
      <line x1="60" y1="88" x2="60" y2="18" stroke={p.stem} strokeWidth="3.5" />
      {/* leaves */}
      <path d="M60,60 Q80,52 76,40" fill="none" stroke={p.leaf} strokeWidth="2.5" />
      <path d="M60,55 Q40,47 44,35" fill="none" stroke={p.leaf} strokeWidth="2.5" />
      <path d="M60,72 Q78,68 75,60" fill="none" stroke={p.leaf} strokeWidth="2" />
      {/* tassel */}
      <line x1="60" y1="18" x2="55" y2="8" stroke={p.stem} strokeWidth="1.5" />
      <line x1="60" y1="18" x2="60" y2="7" stroke={p.stem} strokeWidth="1.5" />
      <line x1="60" y1="18" x2="65" y2="8" stroke={p.stem} strokeWidth="1.5" />
      {/* cob */}
      <rect x="53" y="45" width="14" height="24" rx="4" fill={p.cob} />
      {[48,52,56,60,64,68].map(y => (
        <line key={y} x1="53" y1={y} x2="67" y2={y} stroke={p.kernel} strokeWidth="1" opacity="0.6" />
      ))}
    </g>
  )
}

// ── Barley ───────────────────────────────────────────────────────────────────
function BarleyCrop({ p, drooping }) {
  const stalks = [35, 50, 62, 74, 85]
  return (
    <g transform={drooping ? 'rotate(-10, 60, 88)' : ''}>
      {stalks.map((x, i) => {
        const h = 44 + (i % 2) * 8
        return (
          <g key={x}>
            <line x1={x} y1={88} x2={x} y2={88 - h} stroke={p.stem} strokeWidth="1.8" />
            {/* awns */}
            {[-16,-22,-28,-34].map((dy, j) => (
              <g key={j}>
                <line x1={x} y1={88+dy} x2={x-8} y2={88+dy-6} stroke={p.awn} strokeWidth="1" />
                <line x1={x} y1={88+dy} x2={x+8} y2={88+dy-6} stroke={p.awn} strokeWidth="1" />
                <ellipse cx={x} cy={88+dy} rx="2.5" ry="3.5" fill={p.head} />
              </g>
            ))}
            {/* leaf */}
            <path d={`M${x},${88-20} Q${x + (i%2===0?10:-10)},${88-28} ${x+(i%2===0?7:-7)},${88-36}`}
              fill="none" stroke={p.stem} strokeWidth="1.3" />
          </g>
        )
      })}
    </g>
  )
}

// ── Soy ──────────────────────────────────────────────────────────────────────
function SoyCrop({ p, drooping }) {
  return (
    <g transform={drooping ? 'rotate(-10, 60, 88)' : ''}>
      <line x1="60" y1="88" x2="60" y2="22" stroke={p.stem} strokeWidth="2.5" />
      {/* branches */}
      <line x1="60" y1="60" x2="45" y2="45" stroke={p.stem} strokeWidth="2" />
      <line x1="60" y1="50" x2="75" y2="36" stroke={p.stem} strokeWidth="2" />
      <line x1="60" y1="38" x2="48" y2="26" stroke={p.stem} strokeWidth="1.8" />
      {/* trifoliate leaves */}
      {[[45,45],[75,36],[48,26],[60,22]].map(([bx, by], i) => (
        <g key={i}>
          <ellipse cx={bx} cy={by-4} rx="7" ry="5" fill={p.leaf} opacity="0.9" />
          <ellipse cx={bx-6} cy={by+2} rx="6" ry="4" fill={p.leaf} opacity="0.85" />
          <ellipse cx={bx+6} cy={by+2} rx="6" ry="4" fill={p.leaf} opacity="0.85" />
        </g>
      ))}
      {/* pods */}
      {[[52,72],[65,68],[55,58],[68,50]].map(([px, py], i) => (
        <rect key={i} x={px-3} y={py-6} width="6" height="12" rx="3" fill={p.pod} opacity="0.9" />
      ))}
    </g>
  )
}

const CROP_COMPONENTS = {
  пшеница:      WheatCrop,
  подсолнечник: SunflowerCrop,
  кукуруза:     CornCrop,
  ячмень:       BarleyCrop,
  соя:          SoyCrop,
}

export default function CropSVG({ crop, status, temp = 20, precip = 5 }) {
  const palette = PALETTES[crop] ?? PALETTES['пшеница']
  const p = palette[status] ?? palette['normal']
  const CropComponent = CROP_COMPONENTS[crop] ?? WheatCrop

  const drooping = status === 'anomaly'
  const hot = temp > 30 && precip < 2
  const rainy = precip > 10

  return (
    <svg
      viewBox="0 0 120 100"
      width="110"
      height="90"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Ground line */}
      <line x1="8" y1="88" x2="112" y2="88" stroke="var(--color-border)" strokeWidth="1.5" />

      <CropComponent p={p} drooping={drooping} />

      {hot && <CrackedEarth />}
      {hot && <SunOverlay />}
      {rainy && <RainOverlay />}
    </svg>
  )
}

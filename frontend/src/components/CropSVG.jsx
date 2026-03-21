// CropSVG — 7 crop type groups × 3 status variants × weather overlays

export const CROP_TYPE_MAP = {
  // English keys (from DB / ML service)
  wheat:       'grain',
  corn:        'corn',
  sunflower:   'technical',
  tomato:      'vegetable',
  // Russian fallbacks (legacy / direct display)
  пшеница:     'grain',
  ячмень:      'grain',
  рожь:        'grain',
  овёс:        'grain',
  кукуруза:    'corn',
  соя:         'legume',
  горох:       'legume',
  фасоль:      'legume',
  свёкла:      'root',
  морковь:     'root',
  картофель:   'root',
  подсолнечник:'technical',
  рапс:        'technical',
  лён:         'technical',
  томат:       'vegetable',
  огурец:      'vegetable',
  перец:       'vegetable',
  капуста:     'vegetable',
  яблоня:      'fruit',
  клубника:    'fruit',
  виноград:    'fruit',
  клевер:      'fodder',
  люцерна:     'fodder',
}

const P = {
  grain: {
    normal:  { stem: '#7cb518', head: '#d4a017', grain: '#c8860f', leaf: '#5a9e10' },
    warning: { stem: '#a0a830', head: '#c8a030', grain: '#b08020', leaf: '#889030' },
    anomaly: { stem: '#8a8a6a', head: '#9a8a5a', grain: '#7a7050', leaf: '#787858' },
  },
  corn: {
    normal:  { stem: '#5a9e10', head: '#f0c040', grain: '#e8a020', leaf: '#4a9010' },
    warning: { stem: '#8aaa20', head: '#d4a030', grain: '#c07820', leaf: '#789020' },
    anomaly: { stem: '#787858', head: '#9a8050', grain: '#887040', leaf: '#708060' },
  },
  legume: {
    normal:  { stem: '#4caf50', leaf: '#388e3c', pod: '#8bc34a', vein: '#2e7d32' },
    warning: { stem: '#78b038', leaf: '#5a9028', pod: '#a0b840', vein: '#4a7a20' },
    anomaly: { stem: '#788860', leaf: '#607050', pod: '#788858', vein: '#506048' },
  },
  root: {
    normal:  { stem: '#4caf50', leaf: '#388e3c', root: '#e8622a', tip: '#c04818' },
    warning: { stem: '#88a838', leaf: '#6a8a2a', root: '#c87040', tip: '#a05830' },
    anomaly: { stem: '#789070', leaf: '#607860', root: '#987060', tip: '#786050' },
  },
  technical: {
    normal:  { stem: '#5a9e10', head: '#f5c518', petal: '#f59e0b', center: '#7c3f00' },
    warning: { stem: '#8aaa20', head: '#d4a830', petal: '#c8902a', center: '#6a3800' },
    anomaly: { stem: '#787858', head: '#8a8060', petal: '#887048', center: '#504030' },
  },
  vegetable: {
    normal:  { stem: '#4caf50', leaf: '#388e3c', fruit: '#e53935', shine: '#ef9a9a' },
    warning: { stem: '#78b038', leaf: '#5a8a28', fruit: '#c84030', shine: '#e08080' },
    anomaly: { stem: '#789070', leaf: '#607060', fruit: '#886060', shine: '#a08080' },
  },
  fruit: {
    normal:  { trunk: '#8d6e63', leaf: '#388e3c', fruit: '#e53935', blossom: '#f48fb1' },
    warning: { trunk: '#7a6058', leaf: '#5a8a28', fruit: '#c85030', blossom: '#d4809a' },
    anomaly: { trunk: '#706860', leaf: '#607060', fruit: '#886060', blossom: '#a08090' },
  },
  fodder: {
    normal:  { stem: '#4caf50', leaf: '#66bb6a', flower: '#ab47bc', petal: '#ce93d8' },
    warning: { stem: '#78b038', leaf: '#90a840', flower: '#8e3a9a', petal: '#b07ab8' },
    anomaly: { stem: '#789070', leaf: '#80906a', flower: '#686070', petal: '#907890' },
  },
}

function getTransform(status) {
  if (status === 'warning') return 'rotate(-5, 60, 88)'
  if (status === 'anomaly') return 'rotate(-15, 60, 88)'
  return ''
}

// ── Corn (кукуруза) — отдельный компонент с собственной палитрой ─────────────
function CornCrop({ p, status }) {
  const t = getTransform(status)
  return (
    <g transform={t}>
      {/* Thick main stem */}
      <line x1="60" y1="88" x2="60" y2="12" stroke={p.stem} strokeWidth="4" />
      {/* Upper leaf pair */}
      <path d="M60,38 Q84,32 88,44 Q75,41 60,38" fill={p.leaf} opacity="0.92" />
      <path d="M60,44 Q36,38 32,50 Q45,47 60,44" fill={p.leaf} opacity="0.92" />
      {/* Lower leaf pair */}
      <path d="M60,58 Q86,51 90,64 Q75,60 60,58" fill={p.leaf} opacity="0.85" />
      <path d="M60,64 Q34,57 30,70 Q45,66 60,64" fill={p.leaf} opacity="0.85" />
      {/* Tassel at top */}
      <line x1="60" y1="12" x2="53" y2="3" stroke={p.stem} strokeWidth="1.8" />
      <line x1="60" y1="12" x2="60" y2="2" stroke={p.stem} strokeWidth="1.8" />
      <line x1="60" y1="12" x2="67" y2="3" stroke={p.stem} strokeWidth="1.8" />
      {/* Cob */}
      <rect x="52" y="42" width="16" height="30" rx="6" fill={p.head} />
      <rect x="52" y="42" width="16" height="8" rx="4" fill={p.leaf} opacity="0.35" />
      {[47,53,59,65,71].map(y => (
        <line key={y} x1="52" y1={y} x2="68" y2={y} stroke={p.grain} strokeWidth="1.4" opacity="0.55" />
      ))}
    </g>
  )
}

// ── Grain (пшеница, ячмень, рожь, овёс) ─────────────────────────────────────
function GrainCrop({ p, status, crop }) {
  const isBarley = crop === 'ячмень' || crop === 'рожь' || crop === 'овёс'
  const t = getTransform(status)

  if (isBarley) {
    // Longer awns (ости) — the key visual distinction from wheat
    const stalks = [36, 50, 62, 75, 87]
    return (
      <g transform={t}>
        {stalks.map((x, i) => {
          const h = 52 + (i % 2) * 8
          return (
            <g key={x}>
              <line x1={x} y1={88} x2={x} y2={88 - h} stroke={p.stem} strokeWidth="2.5" />
              {/* Grain nodes with long barley awns */}
              {[-14,-23,-32,-41].map((dy, j) => (
                <g key={j}>
                  <line x1={x} y1={88+dy} x2={x-16} y2={88+dy-9} stroke={p.grain} strokeWidth="1.3" />
                  <line x1={x} y1={88+dy} x2={x+16} y2={88+dy-9} stroke={p.grain} strokeWidth="1.3" />
                  <ellipse cx={x} cy={88+dy} rx="3" ry="5" fill={p.head} />
                </g>
              ))}
              {/* Leaf */}
              <path d={`M${x},${88-24} Q${x+(i%2===0?16:-16)},${88-36} ${x+(i%2===0?12:-12)},${88-50}`}
                fill="none" stroke={p.leaf} strokeWidth="2.2" />
            </g>
          )
        })}
      </g>
    )
  }

  // пшеница — bigger, bolder, more detailed
  const stems = [
    { x: 37, grains: [-16,-25,-34,-43,-52] },
    { x: 57, grains: [-14,-23,-32,-41,-50,-59] },
    { x: 77, grains: [-16,-25,-34,-43,-52] },
  ]
  return (
    <g transform={t}>
      {stems.map((s, i) => (
        <g key={i}>
          <line x1={s.x} y1={88} x2={s.x} y2={88-70} stroke={p.stem} strokeWidth="2.5" />
          {/* Leaf blade — wider and more visible */}
          <path d={`M${s.x},${88-28} Q${s.x+(i===1?18:i===0?16:-16)},${88-42} ${s.x+(i===1?13:i===0?12:-12)},${88-56}`}
            fill="none" stroke={p.leaf} strokeWidth="2.2" />
          {/* Grain head — larger ellipses with crease */}
          {s.grains.map((dy, j) => (
            <g key={j}>
              <ellipse cx={s.x} cy={88+dy} rx="4.5" ry="6.5" fill={j%2===0 ? p.head : p.grain} />
              <line x1={s.x} y1={88+dy-4} x2={s.x} y2={88+dy+4}
                stroke={j%2===0 ? p.grain : p.head} strokeWidth="0.9" opacity="0.45" />
            </g>
          ))}
        </g>
      ))}
    </g>
  )
}

// ── Legume (соя, горох, фасоль) — herbaceous plant, paired leaves + hanging pods ──
function LegumeCrop({ p, status }) {
  const t = getTransform(status)
  // Nodes: y-positions along the stem (bottom → top)
  const nodes = [72, 58, 45, 33, 21]
  // Pods hanging between nodes
  const pods = [
    { cx: 40, cy: 80, angle: -18 },
    { cx: 80, cy: 66, angle: 18 },
    { cx: 40, cy: 54, angle: -15 },
    { cx: 80, cy: 40, angle: 15 },
  ]
  return (
    <g transform={t}>
      {/* Main vertical stem */}
      <line x1="60" y1="88" x2="60" y2="14" stroke={p.stem} strokeWidth="2.5" />
      {/* Paired leaves at each node */}
      {nodes.map((y, i) => (
        <g key={y}>
          {/* Left petiole + trifoliate leaf */}
          <line x1="60" y1={y} x2="45" y2={y} stroke={p.stem} strokeWidth="1.3" />
          <ellipse cx="37" cy={y} rx="12" ry="7" fill={p.leaf} opacity="0.92"
            transform={`rotate(-14, 37, ${y})`} />
          <ellipse cx="44" cy={y-7} rx="7" ry="4.5" fill={p.leaf} opacity="0.82" />
          {/* Right petiole + trifoliate leaf */}
          <line x1="60" y1={y} x2="75" y2={y} stroke={p.stem} strokeWidth="1.3" />
          <ellipse cx="83" cy={y} rx="12" ry="7" fill={p.leaf} opacity="0.92"
            transform={`rotate(14, 83, ${y})`} />
          <ellipse cx="76" cy={y-7} rx="7" ry="4.5" fill={p.leaf} opacity="0.82" />
        </g>
      ))}
      {/* Elongated pods — hanging, slightly angled */}
      {pods.map(({ cx, cy, angle }, i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="4.5" ry="11"
          fill={p.pod} opacity="0.93"
          transform={`rotate(${angle}, ${cx}, ${cy})`} />
      ))}
    </g>
  )
}

// ── Root (свёкла, морковь, картофель) ───────────────────────────────────────
function RootCrop({ p, status, crop }) {
  const t = getTransform(status)
  const isCarrot = crop === 'морковь'
  const isPotato = crop === 'картофель'

  if (isPotato) {
    return (
      <g transform={t}>
        {[[38,62],[55,58],[70,63],[45,72],[62,70]].map(([lx,ly], i) => (
          <g key={i}>
            <ellipse cx={lx} cy={ly} rx="9" ry="6" fill={p.root} opacity="0.85" />
          </g>
        ))}
        <line x1="50" y1="58" x2="42" y2="30" stroke={p.stem} strokeWidth="2" />
        <line x1="60" y1="55" x2="60" y2="22" stroke={p.stem} strokeWidth="2" />
        <line x1="68" y1="58" x2="76" y2="30" stroke={p.stem} strokeWidth="2" />
        {[[42,30],[60,22],[76,30]].map(([sx,sy], i) => (
          <g key={i}>
            <ellipse cx={sx} cy={sy} rx="8" ry="5" fill={p.leaf} opacity="0.9" />
            <ellipse cx={sx-7} cy={sy+4} rx="7" ry="4.5" fill={p.leaf} opacity="0.85" />
            <ellipse cx={sx+7} cy={sy+4} rx="7" ry="4.5" fill={p.leaf} opacity="0.85" />
          </g>
        ))}
      </g>
    )
  }

  if (isCarrot) {
    return (
      <g transform={t}>
        <polygon points="60,88 52,60 68,60" fill={p.root} />
        <ellipse cx="60" cy="60" rx="8" ry="5" fill={p.tip} />
        <line x1="60" y1="60" x2="48" y2="35" stroke={p.stem} strokeWidth="2" />
        <line x1="60" y1="60" x2="60" y2="25" stroke={p.stem} strokeWidth="2" />
        <line x1="60" y1="60" x2="72" y2="35" stroke={p.stem} strokeWidth="2" />
        {[[48,30],[60,22],[72,30]].map(([sx,sy], i) => (
          <g key={i}>
            <path d={`M${sx},${sy+5} Q${sx-6},${sy-4} ${sx-2},${sy-10} Q${sx+2},${sy-4} ${sx},${sy+5}`} fill={p.leaf} opacity="0.9" />
            <path d={`M${sx},${sy+5} Q${sx+6},${sy-4} ${sx+2},${sy-10} Q${sx-2},${sy-4} ${sx},${sy+5}`} fill={p.leaf} opacity="0.85" />
          </g>
        ))}
      </g>
    )
  }

  // свёкла
  return (
    <g transform={t}>
      <ellipse cx="60" cy="78" rx="16" ry="12" fill={p.root} />
      <ellipse cx="60" cy="78" rx="12" ry="9" fill={p.tip} opacity="0.4" />
      <line x1="60" y1="66" x2="60" y2="90" stroke={p.tip} strokeWidth="1.5" opacity="0.5" />
      <line x1="60" y1="66" x2="46" y2="35" stroke={p.stem} strokeWidth="2" />
      <line x1="60" y1="66" x2="60" y2="25" stroke={p.stem} strokeWidth="2.5" />
      <line x1="60" y1="66" x2="74" y2="35" stroke={p.stem} strokeWidth="2" />
      {[[46,32],[60,22],[74,32]].map(([sx,sy], i) => (
        <ellipse key={i} cx={sx} cy={sy} rx="10" ry="6" fill={p.leaf} opacity="0.9"
          transform={`rotate(${i===1?0:i===0?-20:20},${sx},${sy})`} />
      ))}
    </g>
  )
}

// ── Technical (подсолнечник, рапс, лён) ─────────────────────────────────────
function TechnicalCrop({ p, status, crop }) {
  const t = getTransform(status)
  const isRape = crop === 'рапс'
  const isFlax = crop === 'лён'

  if (isFlax) {
    const stalks = [42, 54, 65, 76]
    return (
      <g transform={t}>
        {stalks.map((x, i) => (
          <g key={x}>
            <line x1={x} y1={88} x2={x} y2={30} stroke={p.stem} strokeWidth="1.4" />
            <circle cx={x} cy={30} r="5" fill={p.petal} opacity="0.9" />
            <circle cx={x} cy={30} r="2.5" fill={p.center} />
            {i % 2 === 0 && (
              <path d={`M${x},65 Q${x+8},60 ${x+6},52`} fill="none" stroke={p.stem} strokeWidth="1.2" />
            )}
          </g>
        ))}
      </g>
    )
  }

  if (isRape) {
    const stalks = [40, 55, 68, 82]
    return (
      <g transform={t}>
        {stalks.map((x, i) => (
          <g key={x}>
            <line x1={x} y1={88} x2={x} y2={28} stroke={p.stem} strokeWidth="2" />
            {[-8,-16,-22,-28].map((dy, j) => (
              <circle key={j} cx={x + (j%2===0?4:-4)} cy={88+dy-28} r="3.5" fill={p.petal} opacity="0.9" />
            ))}
            <path d={`M${x},60 Q${x+(i%2===0?12:-12)},52 ${x+(i%2===0?9:-9)},44`}
              fill="none" stroke={p.stem} strokeWidth="1.5" />
          </g>
        ))}
      </g>
    )
  }

  // подсолнечник
  const petalAngles = [0,30,60,90,120,150,180,210,240,270,300,330]
  return (
    <g transform={t}>
      <line x1="60" y1="88" x2="60" y2="20" stroke={p.stem} strokeWidth="3" />
      <path d="M60,60 Q72,55 68,48" fill="none" stroke={p.stem} strokeWidth="1.8" />
      <path d="M60,65 Q48,60 50,52" fill="none" stroke={p.stem} strokeWidth="1.8" />
      {petalAngles.map(a => {
        const rad = a * Math.PI / 180
        const cx = 60 + Math.cos(rad) * 15
        const cy = 20 + Math.sin(rad) * 15
        return <ellipse key={a} cx={cx} cy={cy} rx="5" ry="3"
          fill={p.petal} transform={`rotate(${a},${cx},${cy})`} />
      })}
      <circle cx="60" cy="20" r="10" fill={p.head} />
      <circle cx="60" cy="20" r="7" fill={p.center} />
      {[0,60,120,180,240,300].map(a => {
        const rad = a * Math.PI / 180
        return <circle key={a} cx={60+Math.cos(rad)*4} cy={20+Math.sin(rad)*4} r="1.2" fill={p.head} opacity="0.7" />
      })}
    </g>
  )
}

// ── Vegetable (томат, огурец, перец, капуста) ────────────────────────────────
function VegetableCrop({ p, status, crop }) {
  const t = getTransform(status)
  const isCabbage = crop === 'капуста'
  const isCucumber = crop === 'огурец'
  const isPepper = crop === 'перец'

  if (isCabbage) {
    return (
      <g transform={t}>
        <ellipse cx="60" cy="72" rx="22" ry="18" fill={p.leaf} opacity="0.5" />
        <ellipse cx="60" cy="70" rx="17" ry="14" fill={p.stem} opacity="0.6" />
        <ellipse cx="60" cy="68" rx="12" ry="10" fill={p.leaf} opacity="0.7" />
        <ellipse cx="60" cy="67" rx="8" ry="7" fill={p.stem} opacity="0.8" />
        <ellipse cx="60" cy="66" rx="4" ry="4" fill={p.leaf} opacity="0.9" />
      </g>
    )
  }

  if (isCucumber) {
    return (
      <g transform={t}>
        <line x1="50" y1="88" x2="58" y2="30" stroke={p.stem} strokeWidth="1.5" />
        <line x1="65" y1="88" x2="62" y2="30" stroke={p.stem} strokeWidth="1.5" />
        {[[50,75],[60,65],[55,55],[65,70],[58,42]].map(([fx,fy], i) => (
          <ellipse key={i} cx={fx} cy={fy} rx="6" ry="10" fill={p.fruit}
            transform={`rotate(${-20+i*8},${fx},${fy})`} opacity="0.9" />
        ))}
        {[[45,78],[68,72],[50,60],[62,50]].map(([lx,ly], i) => (
          <ellipse key={i} cx={lx} cy={ly} rx="8" ry="5" fill={p.leaf} opacity="0.8"
            transform={`rotate(${i*25},${lx},${ly})`} />
        ))}
      </g>
    )
  }

  if (isPepper) {
    return (
      <g transform={t}>
        <line x1="60" y1="88" x2="60" y2="30" stroke={p.stem} strokeWidth="2" />
        <path d="M60,55 Q72,50 70,42" fill="none" stroke={p.stem} strokeWidth="1.5" />
        <path d="M60,60 Q48,55 50,47" fill="none" stroke={p.stem} strokeWidth="1.5" />
        {[[60,65],[70,55],[50,58],[62,45]].map(([fx,fy], i) => (
          <g key={i}>
            <path d={`M${fx},${fy-10} Q${fx+7},${fy-5} ${fx+6},${fy+5} Q${fx},${fy+10} ${fx-6},${fy+5} Q${fx-7},${fy-5} ${fx},${fy-10}`}
              fill={p.fruit} opacity="0.9" />
            <line x1={fx} y1={fy-10} x2={fx} y2={fy-14} stroke={p.stem} strokeWidth="1.2" />
          </g>
        ))}
        {[[60,30],[70,42],[50,47]].map(([lx,ly], i) => (
          <ellipse key={i} cx={lx} cy={ly} rx="8" ry="5" fill={p.leaf} opacity="0.85"
            transform={`rotate(${i*30},${lx},${ly})`} />
        ))}
      </g>
    )
  }

  // томат
  return (
    <g transform={t}>
      <line x1="60" y1="88" x2="60" y2="20" stroke={p.stem} strokeWidth="2" />
      <path d="M60,60 Q74,54 72,44" fill="none" stroke={p.stem} strokeWidth="1.5" />
      <path d="M60,55 Q46,49 48,39" fill="none" stroke={p.stem} strokeWidth="1.5" />
      <path d="M60,40 Q70,34 68,26" fill="none" stroke={p.stem} strokeWidth="1.4" />
      {[[60,72],[72,58],[48,55],[68,42],[52,44]].map(([fx,fy], i) => (
        <g key={i}>
          <circle cx={fx} cy={fy} r={i<2?9:7} fill={p.fruit} opacity="0.9" />
          <circle cx={fx} cy={fy-3} r={i<2?3:2.5} fill={p.shine} opacity="0.5" />
          <path d={`M${fx-4},${fy-(i<2?9:7)} Q${fx},${fy-(i<2?13:10)} ${fx+4},${fy-(i<2?9:7)}`}
            fill="none" stroke={p.leaf} strokeWidth="1.2" />
        </g>
      ))}
    </g>
  )
}

// ── Fruit (яблоня, клубника, виноград) ───────────────────────────────────────
function FruitCrop({ p, status, crop }) {
  const t = getTransform(status)
  const isStrawberry = crop === 'клубника'
  const isGrape = crop === 'виноград'

  if (isStrawberry) {
    return (
      <g transform={t}>
        {[[45,55],[60,50],[75,55],[52,68],[68,68]].map(([sx,sy], i) => (
          <g key={i}>
            <line x1={sx} y1={88} x2={sx} y2={sy+8} stroke={p.trunk} strokeWidth="1.5" />
            <ellipse cx={sx-5} cy={sy} rx="7" ry="5" fill={p.leaf} opacity="0.9" />
            <ellipse cx={sx+5} cy={sy} rx="7" ry="5" fill={p.leaf} opacity="0.9" />
            <ellipse cx={sx} cy={sy-4} rx="6" ry="4" fill={p.leaf} opacity="0.85" />
          </g>
        ))}
        {[[46,75],[61,70],[74,76],[53,82],[69,82]].map(([fx,fy], i) => (
          <g key={i}>
            <path d={`M${fx},${fy-8} Q${fx+7},${fy-3} ${fx+5},${fy+6} Q${fx},${fy+10} ${fx-5},${fy+6} Q${fx-7},${fy-3} ${fx},${fy-8}`}
              fill={p.fruit} opacity="0.9" />
            <circle cx={fx-2} cy={fy-3} r="1.5" fill={p.blossom} opacity="0.6" />
          </g>
        ))}
      </g>
    )
  }

  if (isGrape) {
    return (
      <g transform={t}>
        <line x1="60" y1="88" x2="60" y2="30" stroke={p.trunk} strokeWidth="3" />
        <path d="M60,60 Q80,52 78,38" fill="none" stroke={p.trunk} strokeWidth="2" />
        <path d="M60,55 Q40,47 42,33" fill="none" stroke={p.trunk} strokeWidth="2" />
        {[[60,42],[52,52],[68,52],[56,62],[64,62],[60,72]].map(([gx,gy], i) => (
          <circle key={i} cx={gx} cy={gy} r="6" fill={p.blossom} opacity="0.9" />
        ))}
        {[[78,40],[42,35]].map(([lx,ly], i) => (
          <ellipse key={i} cx={lx} cy={ly} rx="10" ry="7" fill={p.leaf} opacity="0.85"
            transform={`rotate(${i===0?-20:20},${lx},${ly})`} />
        ))}
      </g>
    )
  }

  // яблоня
  return (
    <g transform={t}>
      <line x1="60" y1="88" x2="60" y2="55" stroke={p.trunk} strokeWidth="5" />
      <line x1="60" y1="70" x2="40" y2="58" stroke={p.trunk} strokeWidth="3" />
      <line x1="60" y1="65" x2="80" y2="52" stroke={p.trunk} strokeWidth="3" />
      <ellipse cx="60" cy="40" rx="28" ry="22" fill={p.leaf} opacity="0.85" />
      <ellipse cx="40" cy="52" rx="16" ry="14" fill={p.leaf} opacity="0.8" />
      <ellipse cx="80" cy="46" rx="16" ry="14" fill={p.leaf} opacity="0.8" />
      {[[55,36],[68,30],[48,46],[72,44],[60,50]].map(([ax,ay], i) => (
        <g key={i}>
          <circle cx={ax} cy={ay} r="7" fill={p.fruit} opacity="0.9" />
          <circle cx={ax-2} cy={ay-3} r="2.5" fill={p.blossom} opacity="0.5" />
          <line x1={ax} y1={ay-7} x2={ax} y2={ay-11} stroke={p.trunk} strokeWidth="1.2" />
        </g>
      ))}
    </g>
  )
}

// ── Fodder (клевер, люцерна) ─────────────────────────────────────────────────
function FodderCrop({ p, status }) {
  const t = getTransform(status)
  const stalks = [36, 50, 62, 74, 86]
  return (
    <g transform={t}>
      {stalks.map((x, i) => {
        const h = 40 + (i % 3) * 10
        return (
          <g key={x}>
            <line x1={x} y1={88} x2={x} y2={88-h} stroke={p.stem} strokeWidth="1.8" />
            <ellipse cx={x} cy={88-h} rx="5" ry="8" fill={p.flower} opacity="0.9" />
            <ellipse cx={x-3} cy={88-h+4} rx="3" ry="5" fill={p.petal} opacity="0.7" />
            <ellipse cx={x+3} cy={88-h+4} rx="3" ry="5" fill={p.petal} opacity="0.7" />
            {i % 2 === 0 && (
              <g>
                <ellipse cx={x} cy={88-h/2-2} rx="5" ry="4" fill={p.leaf} opacity="0.85" />
                <ellipse cx={x-5} cy={88-h/2+2} rx="4.5" ry="3.5" fill={p.leaf} opacity="0.8" />
                <ellipse cx={x+5} cy={88-h/2+2} rx="4.5" ry="3.5" fill={p.leaf} opacity="0.8" />
              </g>
            )}
          </g>
        )
      })}
    </g>
  )
}

// ── Weather overlays ─────────────────────────────────────────────────────────
const RAIN_STYLE = `
@media (prefers-reduced-motion: no-preference) {
  @keyframes crf { from { transform: translateY(0); opacity: 0.7; } to { transform: translateY(12px); opacity: 0; } }
  .crop-rain-drop { animation: crf 0.9s linear infinite; }
}
`

function SunOverlay() {
  return (
    <g>
      <circle cx="105" cy="13" r="7" fill="#fbbf24" opacity="0.9" />
      {[0,45,90,135,180,225,270,315].map(a => {
        const rad = a * Math.PI / 180
        const x1 = 105 + Math.cos(rad)*9, y1 = 13 + Math.sin(rad)*9
        const x2 = 105 + Math.cos(rad)*13, y2 = 13 + Math.sin(rad)*13
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth="1.5" opacity="0.8" />
      })}
    </g>
  )
}

function CrackOverlay() {
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
  const drops = [[15,10],[35,18],[55,8],[75,15],[95,10],[25,28],[45,22],[65,30],[85,24],[105,28]]
  return (
    <g opacity="0.65">
      <style>{RAIN_STYLE}</style>
      {drops.map(([x, y], i) => (
        <line
          key={i}
          className="crop-rain-drop"
          x1={x} y1={y} x2={x-3} y2={y+9}
          stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round"
          style={{ animationDelay: `${(i * 0.09).toFixed(2)}s` }}
        />
      ))}
    </g>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function CropSVG({ crop = 'wheat', status = 'normal', temp = 20, precip = 5, width = 110, height = 90 }) {
  const type = CROP_TYPE_MAP[crop] ?? 'grain'
  const palette = P[type]
  const p = palette[status] ?? palette.normal

  const hot = temp > 30 && precip < 2
  const rainy = precip > 10

  const cropProps = { p, status, crop }

  return (
    <svg
      viewBox="0 0 120 100"
      width={width}
      height={height}
      style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}
      aria-hidden="true"
    >
      <line x1="8" y1="88" x2="112" y2="88" stroke="var(--color-border)" strokeWidth="1.5" />

      {type === 'grain'      && <GrainCrop      {...cropProps} />}
      {type === 'corn'       && <CornCrop       {...cropProps} />}
      {type === 'legume'     && <LegumeCrop     {...cropProps} />}
      {type === 'root'       && <RootCrop       {...cropProps} />}
      {type === 'technical'  && <TechnicalCrop  {...cropProps} />}
      {type === 'vegetable'  && <VegetableCrop  {...cropProps} />}
      {type === 'fruit'      && <FruitCrop      {...cropProps} />}
      {type === 'fodder'     && <FodderCrop     {...cropProps} />}

      {hot && <CrackOverlay />}
      {hot && <SunOverlay />}
      {rainy && <RainOverlay />}
    </svg>
  )
}

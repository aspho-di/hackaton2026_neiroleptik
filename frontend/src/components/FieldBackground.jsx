const STEP = 25  // расстояние между центрами полосок (strokeWidth=15 → зазор 10px)

export default function FieldBackground() {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0,
      width: '100%', height: '320px',
      zIndex: 0, pointerEvents: 'none', opacity: 0.6,
    }}>
      <svg width="100%" height="100%" viewBox="0 0 1600 320"
        preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">

        <defs>
          <clipPath id="hill-left-clip">
            <path d="M-10 55 Q300 75 600 112 Q850 148 1050 205 Q1100 225 1120 320 L-10 320 Z"/>
          </clipPath>
          <clipPath id="hill-right-clip">
            <path d="M480 320 Q600 285 720 242 Q840 198 970 155 Q1090 117 1220 86 Q1360 58 1500 44 Q1560 38 1600 40 L1600 320 Z"/>
          </clipPath>
        </defs>

        {/* ══ ЛЕВЫЙ ХОЛМ ══ */}
        <path
          d="M-10 55 Q300 75 600 112 Q850 148 1050 205 Q1100 225 1120 320 L-10 320 Z"
          fill="#52A852"
        />
        <path
          d="M-10 55 Q300 75 600 112 Q850 148 1050 205 L1050 220 Q850 163 600 127 Q300 90 -10 70 Z"
          fill="#70C870" opacity="0.6"
        />
        <path
          d="M880 268 Q970 238 1050 205 L1050 220 Q970 253 880 283 Z"
          fill="#3A8035" opacity="0.4"
        />
        {/* Борозды левого холма — смещаем гребень вниз с шагом STEP */}
        <g clipPath="url(#hill-left-clip)" opacity="0.38">
          {Array.from({ length: 12 }, (_, i) => {
            const d = Math.round(STEP / 2) + i * STEP
            return (
              <path
                key={d}
                d={`M-10 ${55+d} Q300 ${75+d} 600 ${112+d} Q850 ${148+d} 1050 ${205+d}`}
                fill="none" stroke="#2d6e1a" strokeWidth="15"
              />
            )
          })}
        </g>

        {/* ══ ПРАВЫЙ ХОЛМ ══ */}
        <path
          d="M480 320 Q600 285 720 242 Q840 198 970 155 Q1090 117 1220 86 Q1360 58 1500 44 Q1560 38 1600 40 L1600 320 Z"
          fill="#BDD034"
        />
        <path
          d="M480 320 Q600 285 720 242 Q840 198 970 155 Q1090 117 1220 86 Q1360 58 1500 44 Q1560 38 1600 40
             L1600 53 Q1560 50 1500 56 Q1360 70 1220 99 Q1090 130 970 168 Q840 211 720 254 Q630 288 565 312 Z"
          fill="#D4E844" opacity="0.62"
        />
        <path
          d="M480 320 Q600 285 720 242 Q840 198 970 155 L970 170 Q840 213 720 256 Q620 293 548 315 Z"
          fill="#8AAE18" opacity="0.45"
        />
        {/* Борозды правого холма — смещаем гребень вниз с шагом STEP */}
        <g clipPath="url(#hill-right-clip)" opacity="0.38">
          {Array.from({ length: 13 }, (_, i) => {
            const d = Math.round(STEP / 2) + i * STEP
            return (
              <path
                key={d}
                d={`M480 ${320+d} Q600 ${285+d} 720 ${242+d} Q840 ${198+d} 970 ${155+d} Q1090 ${117+d} 1220 ${86+d} Q1360 ${58+d} 1500 ${44+d} Q1560 ${38+d} 1600 ${40+d}`}
                fill="none" stroke="#6e7a10" strokeWidth="15"
              />
            )
          })}
        </g>

        {/* ══ ЖЁЛТОЕ ПШЕНИЧНОЕ ПОЛЕ ══ */}
        <path
          d="M-10 246 Q200 234 420 242 Q640 250 800 238 Q1000 229 1200 237 Q1430 245 1610 234 L1610 320 L-10 320 Z"
          fill="#F0C030"
        />
        <path
          d="M-10 246 Q200 234 420 242 Q640 250 800 238 Q1000 229 1200 237 Q1430 245 1610 234
             L1610 258 Q1430 258 1200 250 Q1000 242 800 252 Q640 262 420 254 Q200 246 -10 258 Z"
          fill="#C89010" opacity="0.55"
        />
        {/* Борозды пшеничного поля — волнистые горизонтальные линии */}
        {Array.from({ length: 3 }, (_, i) => {
          const y = 260 + i * STEP
          return (
            <path
              key={y}
              d={`M-10 ${y} Q400 ${y-7} 800 ${y+4} Q1200 ${y+9} 1610 ${y-4}`}
              fill="none" stroke="#b8780a" strokeWidth="15" opacity="0.4"
            />
          )
        })}
      </svg>
    </div>
  )
}

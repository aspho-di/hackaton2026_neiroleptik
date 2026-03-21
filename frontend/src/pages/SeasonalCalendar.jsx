import { useState } from 'react'
import { CROPS, CROP_LABEL } from '../constants/districts'
import WheatEmoji from '../components/icons/WheatEmoji'

// Месяцы вегетационного периода (март–октябрь)
const MONTHS = ['Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь']
const MONTH_INDICES = [3, 4, 5, 6, 7, 8, 9, 10] // 1-based

// Фазы роста по культуре [startMonth, endMonth, label, color, icon]
const CROP_PHASES = {
  wheat: [
    { start: 3, end: 4,  label: 'Предпосевная подготовка', color: '#92400e', icon: '🌱', desc: 'Подготовка почвы, внесение удобрений, протравливание семян' },
    { start: 4, end: 5,  label: 'Сев',                     color: '#065f46', icon: '🌾', desc: 'Посев яровой пшеницы при прогреве почвы до +5°C' },
    { start: 5, end: 6,  label: 'Всходы',                  color: '#16a34a', icon: '🌿', desc: 'Появление всходов, кущение. Критичен достаточный полив' },
    { start: 6, end: 7,  label: 'Стеблевание и выход в трубку', color: '#15803d', icon: '🌾', desc: 'Интенсивный рост. При дефиците влаги — срочный полив' },
    { start: 7, end: 8,  label: 'Колошение и цветение',    color: '#b45309', icon: '🌻', desc: 'Формирование зерна. Ключевой период для урожайности' },
    { start: 8, end: 9,  label: 'Налив и созревание',      color: '#d97706', icon: '☀️', desc: 'Зерно набирает массу. Осадки снижают качество' },
    { start: 9, end: 9,  label: 'Уборка',                  color: '#dc2626', icon: '🚜', desc: 'Уборка при влажности зерна 14–16%' },
  ],
  corn: [
    { start: 4, end: 5,  label: 'Подготовка и сев',        color: '#065f46', icon: '🌱', desc: 'Сев при прогреве почвы до +10°C на глубине 5 см' },
    { start: 5, end: 6,  label: 'Всходы',                  color: '#16a34a', icon: '🌿', desc: '8–15 дней до появления всходов. Прополка обязательна' },
    { start: 6, end: 7,  label: 'Интенсивный рост',        color: '#15803d', icon: '🌽', desc: 'Растение наращивает надземную массу. Нужен полив 30–40 мм' },
    { start: 7, end: 8,  label: 'Выметывание метёлки',     color: '#0d9488', icon: '🌾', desc: 'Цветение. Опыление нарушается при t > 38°C' },
    { start: 8, end: 9,  label: 'Молочно-восковая спелость',color: '#d97706', icon: '🌽', desc: 'Формирование зерна в початке. Полив сокращается' },
    { start: 9, end: 10, label: 'Уборка',                  color: '#dc2626', icon: '🚜', desc: 'Уборка на зерно при влажности ≤ 25%' },
  ],
  sunflower: [
    { start: 4, end: 5,  label: 'Подготовка почвы',        color: '#92400e', icon: '🌱', desc: 'Глубокая вспашка, внесение фосфорных удобрений' },
    { start: 5, end: 5,  label: 'Сев',                     color: '#065f46', icon: '🌻', desc: 'Сев при +8–10°C. Схема 70×35 см' },
    { start: 5, end: 6,  label: 'Всходы и рост',           color: '#16a34a', icon: '🌿', desc: 'Прорывка лишних растений, уничтожение сорняков' },
    { start: 6, end: 7,  label: 'Образование корзинки',    color: '#0d9488', icon: '🌻', desc: 'Активный рост. Норма полива 20–25 мм/нед' },
    { start: 7, end: 8,  label: 'Цветение',                color: '#d97706', icon: '🌻', desc: 'Пчело-опыление. Нельзя применять пестициды' },
    { start: 8, end: 9,  label: 'Созревание',              color: '#b45309', icon: '☀️', desc: 'Корзинка темнеет, семена набирают масло' },
    { start: 9, end: 10, label: 'Уборка',                  color: '#dc2626', icon: '🚜', desc: 'Влажность семян 7–9%. Десикация при 12–14%' },
  ],
  tomato: [
    { start: 3, end: 4,  label: 'Выращивание рассады',     color: '#92400e', icon: '🌱', desc: '55–60 дней в теплице до высадки в открытый грунт' },
    { start: 5, end: 5,  label: 'Высадка в грунт',         color: '#065f46', icon: '🍅', desc: 'Температура ночью > 10°C. Схема 60×40 см' },
    { start: 5, end: 6,  label: 'Вегетация',               color: '#16a34a', icon: '🌿', desc: 'Пасынкование, подвязка. Полив 15–20 мм каждые 5 дней' },
    { start: 6, end: 7,  label: 'Цветение',                color: '#0d9488', icon: '🌸', desc: 'Встряхивание соцветий для опыления при закрытом грунте' },
    { start: 7, end: 8,  label: 'Плодообразование',        color: '#d97706', icon: '🍅', desc: 'Регулярный полив, кормление калием. Мульчирование' },
    { start: 8, end: 9,  label: 'Созревание и уборка',     color: '#dc2626', icon: '🚜', desc: 'Сбор каждые 2–3 дня. Хранение при +8–12°C' },
  ],
}

// Советы по месяцам
const MONTHLY_TIPS = {
  wheat: {
    3: 'Анализ почвы, заказ семян и удобрений',
    4: 'Ранний сев при прогреве +5°C',
    5: 'Контроль всходов, борьба с сорняками',
    6: 'Азотная подкормка при кущении',
    7: 'Обработка фунгицидами от болезней колоса',
    8: 'Подготовка техники к уборке',
    9: 'Уборка и послеуборочная обработка',
    10: 'Зяблевая вспашка',
  },
  corn: {
    4: 'Сев при +10°C',
    5: 'Боронование до и после всходов',
    6: 'Гербициды против сорняков',
    7: 'Полив 30–40 мм в жаркие дни',
    8: 'Контроль початков, уборка силоса',
    9: 'Уборка зернового кукурузы',
    10: 'Лущение стерни',
  },
  sunflower: {
    4: 'Подготовка почвы',
    5: 'Сев в прогретую почву',
    6: 'Прополка, прорывка',
    7: 'Полив при дефиците влаги',
    8: 'Отказ от пестицидов во время цветения',
    9: 'Десикация, уборка',
    10: 'Лущение стерни, вспашка',
  },
  tomato: {
    3: 'Посев на рассаду в теплице',
    4: 'Пикировка, закаливание рассады',
    5: 'Высадка в грунт',
    6: 'Пасынкование, подвязка',
    7: 'Полив и подкормки',
    8: 'Сбор плодов, обработка от фитофторы',
    9: 'Финальная уборка',
    10: 'Удаление ботвы, дезинфекция',
  },
}

function PhaseBar({ phase, monthStart, totalMonths }) {
  const colStart = MONTH_INDICES.indexOf(phase.start) + 1
  const colEnd   = MONTH_INDICES.indexOf(Math.min(phase.end, MONTH_INDICES[MONTH_INDICES.length - 1])) + 2
  const width = Math.max(colEnd - colStart, 1)

  return (
    <div
      title={`${phase.label}: ${phase.desc}`}
      style={{
        gridColumn: `${colStart} / ${colEnd}`,
        background: phase.color,
        borderRadius: 6,
        padding: '5px 10px',
        fontSize: 11,
        fontWeight: 600,
        color: '#fff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'default',
        boxShadow: `0 2px 6px ${phase.color}60`,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <span style={{ fontSize: 13 }}>{phase.icon}</span>
      {width > 1 ? phase.label : phase.icon}
    </div>
  )
}

export default function SeasonalCalendar() {
  const [selectedCrop, setSelectedCrop] = useState('wheat')
  const [hoveredMonth, setHoveredMonth] = useState(null)

  const phases = CROP_PHASES[selectedCrop] || []
  const tips   = MONTHLY_TIPS[selectedCrop] || {}
  const currentMonth = new Date().getMonth() + 1

  return (
    <>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 48px' }}>

        <h1 className="page-title">Сезонный календарь</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 28 }}>
          Фазы роста, агротехнические мероприятия и советы по каждому месяцу
        </p>

        {/* Crop selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {CROPS.map(c => (
            <button
              key={c.key}
              onClick={() => setSelectedCrop(c.key)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: `2px solid ${selectedCrop === c.key ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: selectedCrop === c.key ? 'var(--color-accent)' : 'var(--color-surface)',
                color: selectedCrop === c.key ? '#fff' : 'var(--color-text)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Timeline grid */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '24px',
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 16,
            color: 'var(--color-text)',
            marginBottom: 20,
          }}>
            {CROP_LABEL[selectedCrop]} — вегетационный период
          </div>

          {/* Month headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${MONTHS.length}, 1fr)`,
            gap: 4,
            marginBottom: 8,
          }}>
            {MONTHS.map((m, i) => {
              const mIdx = MONTH_INDICES[i]
              const isNow = mIdx === currentMonth
              return (
                <div
                  key={m}
                  onMouseEnter={() => setHoveredMonth(mIdx)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  style={{
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: isNow ? 700 : 500,
                    color: isNow ? 'var(--color-accent)' : hoveredMonth === mIdx ? 'var(--color-text)' : 'var(--color-text-muted)',
                    padding: '6px 4px',
                    borderRadius: 6,
                    background: isNow ? 'var(--color-accent-light)' : hoveredMonth === mIdx ? 'var(--color-bg)' : 'transparent',
                    transition: 'all 0.15s',
                    cursor: 'default',
                    position: 'relative',
                  }}
                >
                  {m}
                  {isNow && (
                    <div style={{
                      position: 'absolute',
                      bottom: -2, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4, height: 4,
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Phase bars */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${MONTHS.length}, 1fr)`,
            gap: 4,
            rowGap: 8,
            alignItems: 'center',
          }}>
            {phases.map((phase, i) => (
              <PhaseBar key={i} phase={phase} />
            ))}
          </div>
        </div>

        {/* Phase legend */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '24px',
          marginBottom: 20,
        }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--color-text)',
            marginBottom: 16,
          }}>
            Фазы роста
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {phases.map((phase, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  minWidth: 200, flexShrink: 0,
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: 3,
                    background: phase.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                    {phase.icon} {phase.label}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {phase.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly tips */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '24px',
        }}>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--color-text)',
            marginBottom: 16,
          }}>
            Советы по месяцам
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {Object.entries(tips).map(([mIdx, tip]) => {
              const mName = MONTHS[MONTH_INDICES.indexOf(Number(mIdx))]
              const isNow = Number(mIdx) === currentMonth
              return (
                <div key={mIdx} style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: `1px solid ${isNow ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: isNow ? 'var(--color-accent-light)' : 'var(--color-bg)',
                  animation: isNow ? 'none' : undefined,
                }}>
                  <div style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 700,
                    fontSize: 13,
                    color: isNow ? 'var(--color-accent)' : 'var(--color-text)',
                    marginBottom: 6,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {mName}
                    {isNow && <span style={{ fontSize: 10, background: 'var(--color-accent)', color: '#fff', borderRadius: 4, padding: '1px 5px' }}>Сейчас</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{tip}</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </>
  )
}

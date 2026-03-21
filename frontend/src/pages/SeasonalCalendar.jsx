import { useState } from 'react'
import { CROPS, CROP_LABEL } from '../constants/districts'

const MONTHS = ['Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь']
const MONTH_IDX = [3, 4, 5, 6, 7, 8, 9, 10]

// ── Данные фаз ──────────────────────────────────────────────────────────────
const CROP_PHASES = {
  wheat: [
    {
      start: 3, end: 4, label: 'Предпосевная подготовка', color: '#92400e',
      desc: 'Подготовка почвы, внесение удобрений, протравливание семян.',
      actions: ['Проверить pH почвы (оптимум 6.0–7.0)', 'Внести NPK 16:16:16 из расчёта 200 кг/га', 'Протравить семена фунгицидом', 'Проверить и откалибровать сеялку'],
      critical: null, water_mm: 0,
    },
    {
      start: 4, end: 5, label: 'Сев', color: '#065f46',
      desc: 'Посев яровой пшеницы при прогреве почвы до +5°C на глубину 10 см.',
      actions: ['Начать сев при t почвы +5°C на глубине 10 см', 'Норма высева 180–220 кг/га', 'Глубина заделки семян 5–6 см', 'Прикатать почву для сохранения влаги'],
      critical: 'Запоздание с севом на 10 дней снижает урожайность на 10–15%', water_mm: 20,
    },
    {
      start: 5, end: 6, label: 'Всходы и кущение', color: '#16a34a',
      desc: 'Появление всходов, активное кущение. Критичен полив при дефиците влаги.',
      actions: ['Контролировать плотность всходов (350–450 раст/м²)', 'Провести боронование против сорняков', 'Внести азотную подкормку 60 кг N/га', 'Полив при влажности почвы < 60% НВ'],
      critical: 'Дефицит влаги в фазе кущения снижает число колосков на 20–25%', water_mm: 35,
    },
    {
      start: 6, end: 7, label: 'Стеблевание и выход в трубку', color: '#15803d',
      desc: 'Интенсивный рост стебля. При дефиците влаги — срочный полив.',
      actions: ['Обработать фунгицидом от мучнистой росы и ржавчины', 'Норма полива 40–50 мм при температуре выше 25°C', 'Инсектицидная обработка при наличии тли', 'Второй уровень азотных подкормок при необходимости'],
      critical: 'Недостаток воды при выходе в трубку необратимо снижает высоту стебля', water_mm: 50,
    },
    {
      start: 7, end: 8, label: 'Колошение и цветение', color: '#b45309',
      desc: 'Формирование зерна. Ключевой критический период для урожайности.',
      actions: ['Полив 55–60 мм — наиболее критичный период', 'Обработка фунгицидом от фузариоза колоса', 'Запрет применения гербицидов', 'Мониторинг t — при >35°C ускорить полив'],
      critical: 'При t > 35°C в период цветения завязываемость зерна падает на 30–40%', water_mm: 60,
    },
    {
      start: 8, end: 9, label: 'Налив и созревание', color: '#d97706',
      desc: 'Зерно набирает массу. Осадки снижают качество. Подготовка к уборке.',
      actions: ['Сократить полив после восковой спелости', 'Подготовить и проверить комбайны', 'Определить оптимальное время уборки (влажность 14–16%)', 'Подготовить склад: очистить, обработать от вредителей'],
      critical: 'Обмолот при влажности > 18% ведёт к потерям качества и плесени при хранении', water_mm: 15,
    },
    {
      start: 9, end: 9, label: 'Уборка', color: '#dc2626',
      desc: 'Прямое комбайнирование при влажности зерна 14–16%.',
      actions: ['Убирать в сухую погоду при влажности 14–16%', 'Регулировать скорость обмолота комбайна', 'Немедленно сушить зерно если влажность > 16%', 'Провести зяблевую вспашку после уборки'],
      critical: null, water_mm: 0,
    },
  ],
  corn: [
    {
      start: 4, end: 5, label: 'Подготовка и сев', color: '#065f46',
      desc: 'Сев при прогреве почвы до +10°C на глубине 5 см.',
      actions: ['Дождаться +10°C на глубине 5 см', 'Схема посева 70×25 см, 70 000 раст/га', 'Внести фосфор 90–120 кг P₂O₅/га', 'Обработать почву гербицидом почвенного действия'],
      critical: 'Ранний сев при t < 8°C вызывает загнивание семян', water_mm: 25,
    },
    {
      start: 5, end: 6, label: 'Всходы', color: '#16a34a',
      desc: '8–15 дней до появления всходов. Прополка обязательна.',
      actions: ['Боронование по всходам при 2–3 листьях', 'Обработка гербицидом МЦПА при 3–5 листьях', 'Контроль почвенной влаги: минимум 70% НВ', 'Подкормка аммиачной селитрой 80 кг N/га'],
      critical: null, water_mm: 30,
    },
    {
      start: 6, end: 7, label: 'Интенсивный рост', color: '#15803d',
      desc: 'Растение наращивает надземную массу. Нужен полив 30–40 мм.',
      actions: ['Полив 30–40 мм каждые 10–12 дней', 'Азотная подкормка в рядки 60 кг N/га', 'Окучивание при высоте 50–60 см', 'Инсектицидная обработка против стеблевого мотылька'],
      critical: 'В фазу 7–10 листьев без полива потери урожая достигают 25%', water_mm: 45,
    },
    {
      start: 7, end: 8, label: 'Выметывание и цветение', color: '#0d9488',
      desc: 'Цветение. Опыление нарушается при t > 38°C.',
      actions: ['Максимальный полив 50–60 мм — критический период', 'Не применять пестициды в период цветения', 'При t > 38°C — дополнительное дождевание', 'Контроль фузариоза початка'],
      critical: 'При t > 38°C пыльца стерилизуется — урожай падает до 50%', water_mm: 60,
    },
    {
      start: 8, end: 9, label: 'Молочно-восковая спелость', color: '#d97706',
      desc: 'Формирование зерна в початке. Полив постепенно сокращается.',
      actions: ['Сократить полив до 20 мм/нед', 'Уборка силоса при влажности 65–70%', 'Контроль початков на поражение болезнями', 'Начать подготовку уборочной техники'],
      critical: null, water_mm: 20,
    },
    {
      start: 9, end: 10, label: 'Уборка на зерно', color: '#dc2626',
      desc: 'Уборка при влажности зерна не выше 25%.',
      actions: ['Убирать при влажности ≤ 25%, сушить до 14%', 'Регулировать зазор молотильного барабана', 'Лущение стерни сразу после уборки', 'Внести органику под основную вспашку'],
      critical: null, water_mm: 0,
    },
  ],
  sunflower: [
    {
      start: 4, end: 5, label: 'Подготовка почвы', color: '#92400e',
      desc: 'Глубокая вспашка 25–27 см, внесение фосфорных удобрений.',
      actions: ['Глубокая вспашка 25–27 см', 'Внести P 80–90 кг/га, K 60–80 кг/га', 'Протравить семена ТМТД + инсектицид', 'Провести предпосевную культивацию'],
      critical: null, water_mm: 0,
    },
    {
      start: 5, end: 5, label: 'Сев', color: '#065f46',
      desc: 'Сев при +8–10°C в почве. Оптимальная схема 70×35 см.',
      actions: ['Начать сев при t +8–10°C на глубине 5 см', 'Схема 70×35 см, 55 000–60 000 раст/га', 'Глубина заделки 6–8 см во влажный слой', 'Провести прикатывание после сева'],
      critical: 'Загущение > 65 000 раст/га снижает крупность корзинки', water_mm: 15,
    },
    {
      start: 5, end: 6, label: 'Всходы и рост', color: '#16a34a',
      desc: 'Прорывка лишних растений, уничтожение сорняков.',
      actions: ['Прорывка до 1 растения в гнезде при 2 листьях', 'Боронование поперёк рядков', 'Применить гербицид против злаковых сорняков', 'Подкормить N 40–50 кг/га'],
      critical: null, water_mm: 20,
    },
    {
      start: 6, end: 7, label: 'Образование корзинки', color: '#0d9488',
      desc: 'Активный рост. Норма полива 20–25 мм/неделю.',
      actions: ['Полив 20–25 мм каждые 7–10 дней', 'Обработка от белой и серой гнили', 'Подкормка K 40 кг/га для наполненности семян', 'Контроль заразихи — пропалывать при появлении'],
      critical: 'Дефицит влаги при образовании корзинки снижает диаметр на 30%', water_mm: 30,
    },
    {
      start: 7, end: 8, label: 'Цветение', color: '#d97706',
      desc: 'Пчело-опыление. Нельзя применять пестициды.',
      actions: ['Запрет пестицидов — период цветения 10–14 дней', 'Установить 1–2 улья на 1 га для опыления', 'Полив 30–35 мм в жаркую погоду', 'Мониторинг на подсолнечную моль'],
      critical: 'Нарушение опыления из-за пестицидов — потеря 30–40% урожая', water_mm: 35,
    },
    {
      start: 8, end: 9, label: 'Созревание', color: '#b45309',
      desc: 'Корзинка темнеет, семена набирают масло.',
      actions: ['Сократить полив, дать корзинке высохнуть', 'Провести десикацию при влажности 25–30%', 'Защитить от птиц (сетки или отпугиватели)', 'Подготовить технику к уборке'],
      critical: null, water_mm: 5,
    },
    {
      start: 9, end: 10, label: 'Уборка', color: '#dc2626',
      desc: 'Уборка при влажности семян 7–9%. Десикация при 12–14%.',
      actions: ['Убирать при влажности семян 7–9%', 'Регулировать частоту молотильного барабана', 'Немедленно провести лущение стерни 8–10 см', 'Вспашка зяби сразу после уборки'],
      critical: null, water_mm: 0,
    },
  ],
  tomato: [
    {
      start: 3, end: 4, label: 'Выращивание рассады', color: '#92400e',
      desc: '55–60 дней в теплице до высадки в открытый грунт.',
      actions: ['Посев на рассаду в ящики 1×1 см', 'Температура +23–25°C до всходов, +18–20°C после', 'Пикировка при 2 настоящих листьях', 'Досвечивание 14–16 ч в сутки'],
      critical: null, water_mm: 0,
    },
    {
      start: 5, end: 5, label: 'Высадка в грунт', color: '#065f46',
      desc: 'Ночная температура устойчиво выше +10°C. Схема 60×40 см.',
      actions: ['Высаживать после последних заморозков', 'Схема 60×40 см, 40 000 раст/га', 'Внести перегной 30–40 т/га', 'Обильный полив после высадки 25–30 мм'],
      critical: 'Заморозки после высадки уничтожают рассаду полностью', water_mm: 30,
    },
    {
      start: 5, end: 6, label: 'Вегетация', color: '#16a34a',
      desc: 'Пасынкование, подвязка. Полив 15–20 мм каждые 5 дней.',
      actions: ['Пасынкование до 1–2 стеблей', 'Подвязка к шпалере при высоте 30 см', 'Внести N 40 кг/га для листовой массы', 'Полив 15–20 мм каждые 4–5 дней'],
      critical: null, water_mm: 25,
    },
    {
      start: 6, end: 7, label: 'Цветение', color: '#0d9488',
      desc: 'Встряхивание соцветий для опыления. Регуляторы роста при необходимости.',
      actions: ['Встряхивать шпалеру утром для опыления', 'Применить завязь/томатон при слабом цветении', 'Подкормка K 50 кг/га для формирования плодов', 'Профилактика фитофторы — опрыскивание медью'],
      critical: 'При t > 35°C пыльца стерильна — цветки опадают без завязи', water_mm: 30,
    },
    {
      start: 7, end: 8, label: 'Плодообразование', color: '#d97706',
      desc: 'Регулярный полив, подкормка калием. Мульчирование.',
      actions: ['Полив 25–30 мм каждые 4–5 дней', 'Внести K 60–80 кг/га для качества плодов', 'Мульчировать почву соломой 5–8 см', 'Обработка от фитофторы и альтернариоза'],
      critical: 'Неравномерный полив вызывает вершинную гниль и растрескивание', water_mm: 35,
    },
    {
      start: 8, end: 9, label: 'Созревание и уборка', color: '#dc2626',
      desc: 'Сбор каждые 2–3 дня. Хранение при +8–12°C.',
      actions: ['Сбор урожая каждые 2–3 дня', 'Температура хранения +8–12°C', 'Удалить ботву и растительные остатки', 'Внести органику 40 т/га под вспашку'],
      critical: null, water_mm: 15,
    },
  ],
}

const MONTHLY_TIPS = {
  wheat: {
    3: [{ t: 'Проверить кислотность почвы и откорректировать pH', p: 'info' }, { t: 'Заказать семена и удобрения', p: 'info' }, { t: 'Проверить состояние сельхозтехники', p: 'info' }],
    4: [{ t: 'Сев при прогреве почвы до +5°C', p: 'critical' }, { t: 'Норма высева 180–220 кг/га', p: 'info' }, { t: 'Обработка гербицидом почвенного действия', p: 'warning' }],
    5: [{ t: 'Контроль всходов, прореживание', p: 'info' }, { t: 'Боронование против сорняков', p: 'warning' }, { t: 'Азотная подкормка 60 кг N/га при кущении', p: 'critical' }],
    6: [{ t: 'Фунгицидная обработка от ржавчины', p: 'warning' }, { t: 'Полив 40–50 мм при сухой погоде', p: 'critical' }, { t: 'Инсектицид при наличии тли', p: 'warning' }],
    7: [{ t: 'Полив 55–60 мм — критический период', p: 'critical' }, { t: 'Запрет гербицидов в период цветения', p: 'critical' }, { t: 'Фунгицид от фузариоза колоса', p: 'warning' }],
    8: [{ t: 'Прекратить полив при восковой спелости', p: 'warning' }, { t: 'Подготовить комбайны и склады', p: 'info' }, { t: 'Контроль влажности зерна', p: 'info' }],
    9: [{ t: 'Уборка при влажности 14–16%', p: 'critical' }, { t: 'Немедленная сушка при влажности > 16%', p: 'critical' }, { t: 'Зяблевая вспашка после уборки', p: 'info' }],
    10: [{ t: 'Зяблевая вспашка на 22–25 см', p: 'info' }, { t: 'Внести фосфорно-калийные удобрения', p: 'info' }],
  },
  corn: {
    4: [{ t: 'Сев при +10°C на глубине 5 см', p: 'critical' }, { t: 'Внести P 90–120 кг/га', p: 'info' }, { t: 'Обработка почвенным гербицидом', p: 'warning' }],
    5: [{ t: 'Боронование до и после всходов', p: 'info' }, { t: 'Гербицид при 3–5 листьях', p: 'warning' }, { t: 'Подкормка N 80 кг/га', p: 'info' }],
    6: [{ t: 'Полив 30–40 мм каждые 10 дней', p: 'critical' }, { t: 'Окучивание при высоте 50 см', p: 'info' }, { t: 'Инсектицид против мотылька', p: 'warning' }],
    7: [{ t: 'Полив 50–60 мм — критический период', p: 'critical' }, { t: 'Запрет пестицидов в период цветения', p: 'critical' }, { t: 'При t > 38°C — экстренное дождевание', p: 'critical' }],
    8: [{ t: 'Уборка силоса при влажности 65–70%', p: 'info' }, { t: 'Сократить полив до 20 мм/нед', p: 'warning' }, { t: 'Контроль болезней початка', p: 'warning' }],
    9: [{ t: 'Уборка на зерно при влажности ≤ 25%', p: 'critical' }, { t: 'Сушить до 14% перед хранением', p: 'critical' }, { t: 'Лущение стерни сразу после уборки', p: 'info' }],
    10: [{ t: 'Глубокая вспашка 25–27 см', p: 'info' }, { t: 'Внести органику под вспашку', p: 'info' }],
  },
  sunflower: {
    4: [{ t: 'Глубокая вспашка 25–27 см', p: 'info' }, { t: 'Внести P 80–90 кг/га, K 60–80 кг/га', p: 'info' }, { t: 'Предпосевная культивация', p: 'info' }],
    5: [{ t: 'Сев при +8–10°C', p: 'critical' }, { t: 'Схема 70×35 см, 55–60 тыс. раст/га', p: 'info' }, { t: 'Протравливание семян', p: 'warning' }],
    6: [{ t: 'Прополка — прорывка до 1 раст./гнездо', p: 'info' }, { t: 'Обработка гербицидом против злаков', p: 'warning' }, { t: 'Контроль заразихи', p: 'warning' }],
    7: [{ t: 'Полив 20–25 мм при дефиците влаги', p: 'warning' }, { t: 'Обработка от гнили', p: 'warning' }, { t: 'Подкормка K 40 кг/га', p: 'info' }],
    8: [{ t: 'Запрет пестицидов — цветение', p: 'critical' }, { t: 'Установить ульи для опыления', p: 'critical' }, { t: 'Полив 30–35 мм в жаркую погоду', p: 'warning' }],
    9: [{ t: 'Десикация при влажности семян 25–30%', p: 'warning' }, { t: 'Уборка при влажности 7–9%', p: 'critical' }, { t: 'Лущение стерни 8–10 см', p: 'info' }],
    10: [{ t: 'Вспашка зяби немедленно после уборки', p: 'info' }, { t: 'Внести органику 30 т/га', p: 'info' }],
  },
  tomato: {
    3: [{ t: 'Посев рассады в теплице 1×1 см', p: 'info' }, { t: 'Досвечивание 14–16 ч/сутки', p: 'warning' }, { t: 'Температура +23–25°C до всходов', p: 'info' }],
    4: [{ t: 'Пикировка при 2 настоящих листьях', p: 'info' }, { t: 'Закаливание рассады за 10 дней до высадки', p: 'warning' }, { t: 'Подготовить грядки, внести перегной', p: 'info' }],
    5: [{ t: 'Высадка после последних заморозков', p: 'critical' }, { t: 'Обильный полив после посадки 25–30 мм', p: 'info' }, { t: 'Установить шпалеры и системы полива', p: 'info' }],
    6: [{ t: 'Пасынкование до 1–2 стеблей еженедельно', p: 'warning' }, { t: 'Профилактика фитофторы — опрыскивание', p: 'critical' }, { t: 'Подкормка N 40 кг/га', p: 'info' }],
    7: [{ t: 'Подкормка K 60–80 кг/га', p: 'critical' }, { t: 'Полив 25–30 мм каждые 4–5 дней', p: 'critical' }, { t: 'Мульчирование соломой 5–8 см', p: 'warning' }],
    8: [{ t: 'Сбор плодов каждые 2–3 дня', p: 'info' }, { t: 'Обработка от фитофторы', p: 'warning' }, { t: 'Хранение при +8–12°C', p: 'info' }],
    9: [{ t: 'Финальная уборка до первых заморозков', p: 'critical' }, { t: 'Удалить ботву и растительные остатки', p: 'warning' }, { t: 'Внести органику под вспашку', p: 'info' }],
    10: [{ t: 'Дезинфекция теплиц (если применяется)', p: 'info' }, { t: 'Глубокая вспашка 25 см', p: 'info' }],
  },
}


const TIP_COLORS = { critical: '#dc2626', warning: '#d97706', info: '#4caf50' }
const TIP_LABELS = { critical: 'Критично', warning: 'Важно', info: 'Совет' }

export default function SeasonalCalendar() {
  const [selectedCrop, setSelectedCrop] = useState('wheat')
  const [activePhase, setActivePhase]   = useState(null)

  const phases = CROP_PHASES[selectedCrop] || []
  const tips   = MONTHLY_TIPS[selectedCrop] || {}
  const currentMonth = new Date().getMonth() + 1

  // Текущая активная фаза
  const nowPhase = phases.find(p => p.start <= currentMonth && p.end >= currentMonth)

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 48px' }}>

      <h1 className="page-title">Сезонный календарь</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 28 }}>
        Фазы роста, агротехнические мероприятия и критические сроки по культурам Ростовской области
      </p>

      {/* Crop selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        {CROPS.map(c => (
          <button
            key={c.key}
            onClick={() => { setSelectedCrop(c.key); setActivePhase(null) }}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', transition: 'all 0.15s',
              border: `2px solid ${selectedCrop === c.key ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: selectedCrop === c.key ? 'var(--color-accent)' : 'var(--color-surface)',
              color: selectedCrop === c.key ? '#fff' : 'var(--color-text)',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* "Сейчас" баннер */}
      {nowPhase && (
        <div style={{
          background: `linear-gradient(135deg, ${nowPhase.color}18, ${nowPhase.color}08)`,
          border: `1.5px solid ${nowPhase.color}50`,
          borderLeft: `4px solid ${nowPhase.color}`,
          borderRadius: 12, padding: '18px 24px', marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap',
        }}>
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: nowPhase.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Сейчас — {MONTHS[MONTH_IDX.indexOf(currentMonth)]}</div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, color: 'var(--color-text)', marginBottom: 4 }}>{nowPhase.label}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', maxWidth: 320 }}>{nowPhase.desc}</div>
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Что делать прямо сейчас</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {nowPhase.actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--color-text)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: nowPhase.color, marginTop: 5, flexShrink: 0 }} />
                  {a}
                </div>
              ))}
            </div>
          </div>
          {nowPhase.water_mm > 0 && (
            <div style={{ background: '#e0f2fe', borderRadius: 10, padding: '12px 20px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: '#0369a1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Норма полива</div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 28, color: '#0369a1', lineHeight: 1 }}>{nowPhase.water_mm}</div>
              <div style={{ fontSize: 12, color: '#0369a1' }}>мм/период</div>
            </div>
          )}
          {nowPhase.critical && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', maxWidth: 280 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Критическое предупреждение</div>
              <div style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.5 }}>{nowPhase.critical}</div>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)',
        padding: '24px', marginBottom: 20, overflowX: 'auto',
      }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--color-text)', marginBottom: 20 }}>
          {CROP_LABEL[selectedCrop]} — вегетационный период
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 12 }}>Нажмите на фазу для деталей</span>
        </div>

        <div style={{ minWidth: 600 }}>
          {/* Month headers */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MONTHS.length}, 1fr)`, gap: 4, marginBottom: 6 }}>
            {MONTHS.map((m, i) => {
              const mIdx = MONTH_IDX[i]
              const isNow = mIdx === currentMonth
              return (
                <div key={m} style={{
                  textAlign: 'center', fontSize: 12, fontWeight: isNow ? 700 : 500, padding: '6px 4px',
                  borderRadius: 6, transition: 'all 0.15s', position: 'relative',
                  color: isNow ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  background: isNow ? 'var(--color-accent-light)' : 'transparent',
                }}>
                  {m}
                  {isNow && <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)' }} />}
                </div>
              )
            })}
          </div>

          {/* Phase bars */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MONTHS.length}, 1fr)`, gap: 4, rowGap: 6 }}>
            {phases.map((phase, i) => {
              const colStart = Math.max(MONTH_IDX.indexOf(phase.start), 0) + 1
              const colEnd   = Math.max(MONTH_IDX.indexOf(Math.min(phase.end, MONTH_IDX[MONTH_IDX.length - 1])), 0) + 2
              const isActive = activePhase === i
              const width    = Math.max(colEnd - colStart, 1)
              return (
                <div
                  key={i}
                  onClick={() => setActivePhase(isActive ? null : i)}
                  style={{
                    gridColumn: `${colStart} / ${colEnd}`,
                    background: isActive ? phase.color : phase.color + 'dd',
                    borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600,
                    color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    boxShadow: isActive ? `0 0 0 2px #fff, 0 0 0 4px ${phase.color}` : `0 2px 6px ${phase.color}50`,
                    transform: isActive ? 'translateY(-1px)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {phase.label}
                </div>
              )
            })}
          </div>
        </div>

        {/* Expanded phase detail */}
        {activePhase !== null && (() => {
          const p = phases[activePhase]
          return (
            <div style={{
              marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 16,
              animation: 'fadeIn 0.2s ease',
            }}>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--color-text)' }}>{p.label}</span>
                    {p.water_mm > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: 12, background: '#e0f2fe', color: '#0369a1', borderRadius: 6, padding: '2px 10px', fontWeight: 600 }}>
                        Полив {p.water_mm} мм
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 12 }}>{p.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {p.actions.map((a, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--color-text)' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, marginTop: 6, flexShrink: 0 }} />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
                {p.critical && (
                  <div style={{ flex: '0 1 320px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Критическое предупреждение</div>
                    <div style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.6 }}>{p.critical}</div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Monthly checklist */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '24px',
      }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--color-text)', marginBottom: 16 }}>
          Агрокалендарь по месяцам
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {Object.entries(tips).map(([mIdx, items]) => {
            const mName  = MONTHS[MONTH_IDX.indexOf(Number(mIdx))]
            const isNow  = Number(mIdx) === currentMonth
            const hasCrit = items.some(t => t.p === 'critical')
            return (
              <div key={mIdx} style={{
                padding: '14px 16px', borderRadius: 10,
                border: `1px solid ${isNow ? 'var(--color-accent)' : hasCrit ? '#fca5a520' : 'var(--color-border)'}`,
                background: isNow ? 'var(--color-accent-light)' : 'var(--color-bg)',
              }}>
                <div style={{
                  fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13,
                  color: isNow ? 'var(--color-accent)' : 'var(--color-text)',
                  marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {mName}
                  {isNow && <span style={{ fontSize: 10, background: 'var(--color-accent)', color: '#fff', borderRadius: 4, padding: '1px 6px' }}>Сейчас</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.map((tip, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <div style={{
                        flexShrink: 0, marginTop: 3, fontSize: 9, fontWeight: 700,
                        background: TIP_COLORS[tip.p] + '20', color: TIP_COLORS[tip.p],
                        borderRadius: 3, padding: '1px 4px', whiteSpace: 'nowrap',
                      }}>
                        {TIP_LABELS[tip.p]}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{tip.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

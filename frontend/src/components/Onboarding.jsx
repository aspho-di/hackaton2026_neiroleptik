import { useState, useEffect } from 'react'
import WheatEmoji from './icons/WheatEmoji'
import { IconBarChart, IconDroplets, IconBell, IconCompare, IconCheck } from './icons/Icons'

const STEPS = [
  {
    icon: <WheatEmoji size={44} />,
    title: 'Добро пожаловать в АгроАналитику',
    text: 'Сервис предиктивной аналитики для сельского хозяйства Ростовской области. Помогает прогнозировать урожайность и оптимизировать полив.',
    color: '#1a4d2e',
  },
  {
    icon: <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(76,175,80,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCheck size={26} color="#4caf50" /></div>,
    title: 'Добавьте свои участки',
    text: 'Нажмите «+ Добавить участок» на главной странице. Укажите название, культуру, площадь и координаты — система сразу выдаст прогноз урожайности.',
    color: '#4caf50',
  },
  {
    icon: <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBarChart size={26} color="#3b82f6" /></div>,
    title: 'Анализируйте историю',
    text: 'Страница «История» показывает урожайность за 10 лет, осадки и водный баланс — с интерактивными графиками и детальным анализом каждого сезона.',
    color: '#3b82f6',
  },
  {
    icon: <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(76,175,80,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconDroplets size={26} color="#4caf50" /></div>,
    title: 'Оптимизируйте полив',
    text: 'В разделе «Полив» введите общий ресурс воды — система распределит его по участкам с учётом статуса и приоритета каждого поля.',
    color: '#4caf50',
  },
  {
    icon: <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBell size={26} color="#f59e0b" /></div>,
    title: 'Следите за уведомлениями',
    text: 'Раздел «Уведомления» сигнализирует об аномалиях датчиков, заморозках и засухе. Иконка колокольчика показывает количество непрочитанных.',
    color: '#f59e0b',
  },
  {
    icon: <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239,68,68,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCompare size={26} color="#ef4444" /></div>,
    title: 'Сравнивайте участки',
    text: 'Выберите 2–4 поля в разделе «Сравнение» — система покажет радарную диаграмму и выделит лучшие и худшие показатели.',
    color: '#ef4444',
  },
]

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      finish()
    }
  }

  function finish() {
    setExiting(true)
    setTimeout(() => {
      localStorage.setItem('onboarding_done', '1')
      onDone()
    }, 300)
  }

  const s = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      opacity: exiting ? 0 : 1,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '20px',
        padding: '40px 36px 32px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.32)',
        animation: 'fadeIn 0.35s ease',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: `linear-gradient(90deg, ${s.color} ${progress}%, var(--color-border) ${progress}%)`,
          transition: 'background 0.4s ease',
        }} />

        {/* Skip */}
        <button
          onClick={finish}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: 'var(--color-text-muted)',
            fontFamily: 'Inter, sans-serif',
            padding: '4px 8px', borderRadius: 6,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
        >
          Пропустить
        </button>

        {/* Icon */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          {s.icon}
        </div>

        {/* Step counter */}
        <div style={{
          fontSize: 12, color: 'var(--color-text-muted)',
          fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 10, textAlign: 'center',
        }}>
          Шаг {step + 1} из {STEPS.length}
        </div>

        {/* Title */}
        <h2 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: '20px',
          color: 'var(--color-text)',
          textAlign: 'center',
          marginBottom: '14px',
          lineHeight: 1.3,
        }}>
          {s.title}
        </h2>

        {/* Text */}
        <p style={{
          fontSize: '14px',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          lineHeight: 1.7,
          marginBottom: '32px',
        }}>
          {s.text}
        </p>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: '24px' }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 20 : 7, height: 7,
              borderRadius: 4,
              background: i === step ? s.color : 'var(--color-border)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }} />
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: '0 0 auto',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 10, padding: '11px 20px',
                fontSize: 14, fontWeight: 600,
                color: 'var(--color-text)',
                cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-border)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
            >
              Назад
            </button>
          )}
          <button
            onClick={next}
            style={{
              flex: 1,
              background: s.color,
              color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px',
              fontSize: 15, fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              cursor: 'pointer',
              boxShadow: `0 4px 14px ${s.color}40`,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {step === STEPS.length - 1 ? 'Начать работу' : 'Далее →'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import WheatEmoji from '../components/icons/WheatEmoji'
import { IconWheat, IconDroplet, IconWarning, IconBarChart, IconDroplets, IconCheck } from '../components/icons/Icons'

// ── LandingNavbar ──────────────────────────────────────────────────────────────
function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? '#fff' : 'transparent',
      boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.10)' : 'none',
      transition: 'background 0.25s ease, box-shadow 0.25s ease',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 32px',
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <WheatEmoji size={28} />
          <span style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18,
            color: scrolled ? '#1a4d2e' : '#fff',
            transition: 'color 0.25s',
          }}>
            АгроАналитика
          </span>
        </Link>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link to="/login" style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            fontFamily: 'Montserrat, sans-serif', textDecoration: 'none',
            color: scrolled ? '#1a4d2e' : '#fff',
            border: `1.5px solid ${scrolled ? '#1a4d2e' : 'rgba(255,255,255,0.7)'}`,
            background: 'transparent',
            transition: 'all 0.2s',
          }}>
            Войти
          </Link>
          <Link to="/register" style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            fontFamily: 'Montserrat, sans-serif', textDecoration: 'none',
            color: scrolled ? '#fff' : '#1a4d2e',
            background: scrolled ? '#1a4d2e' : '#fff',
            transition: 'all 0.2s',
          }}>
            Регистрация
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ── Animated counter ───────────────────────────────────────────────────────────
function useCountUp(target, duration = 1600, started = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!started) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target, duration])
  return value
}

function StatCounter({ value, suffix = '', label }) {
  const ref = useRef(null)
  const [started, setStarted] = useState(false)
  const count = useCountUp(value, 1800, started)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect() } },
      { threshold: 0.4 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ textAlign: 'center', width: 200, flexShrink: 0 }}>
      <div style={{
        fontFamily: 'Montserrat, sans-serif', fontWeight: 900,
        fontSize: 'clamp(42px, 6vw, 72px)',
        color: '#fff', lineHeight: 1, marginBottom: 10,
      }}>
        {count}{suffix}
      </div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
        {label}
      </div>
    </div>
  )
}

// ── Section fade-in ────────────────────────────────────────────────────────────
function FadeSection({ children, style }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Icon in gradient circle ─────────────────────────────────────────────────────
function IconCircle({ children, size = 72 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
      border: '2px solid #a5d6a7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(76,175,80,0.18)',
    }}>
      {children}
    </div>
  )
}

// ── Feature card ───────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, text, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        border: '1px solid #e8f5e9',
        padding: '36px 28px',
        flex: '1 1 260px',
        transition: 'box-shadow 0.2s, transform 0.2s, opacity 0.5s ease, transform 0.5s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transitionDelay: visible ? `${delay}s` : '0s',
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(26,77,46,0.13)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)' }}
    >
      <div style={{ marginBottom: 20 }}>{icon}</div>
      <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 19, color: '#1a4d2e', marginBottom: 12 }}>
        {title}
      </h3>
      <p style={{ fontSize: 15, color: '#6b7c6e', lineHeight: 1.7, margin: 0 }}>{text}</p>
    </div>
  )
}

// ── Step ───────────────────────────────────────────────────────────────────────
function Step({ num, icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', flex: '1 1 160px', maxWidth: 220 }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg, #1a4d2e, #4caf50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
        boxShadow: '0 4px 14px rgba(76,175,80,0.35)',
        fontSize: 20, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, color: '#fff',
      }}>
        {num}
      </div>
      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <h4 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: '#1a4d2e', marginBottom: 8 }}>
        {title}
      </h4>
      <p style={{ fontSize: 13, color: '#6b7c6e', lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  )
}

function Arrow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingTop: 8, flexShrink: 0 }}>
      <svg width="32" height="16" viewBox="0 0 32 16" fill="none">
        <path d="M0 8 L26 8" stroke="#4caf50" strokeWidth="2" strokeDasharray="4 3"/>
        <path d="M22 3 L30 8 L22 13" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    </div>
  )
}

// ── Main Landing ───────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      <LandingNavbar />

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        {/* Field background SVG */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <svg width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lSkyG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#071c0d"/>
                <stop offset="100%" stopColor="#1a4d22"/>
              </linearGradient>
              <clipPath id="lHillL">
                <path d="M-10 635 Q300 655 600 692 Q850 728 1050 785 Q1100 805 1120 900 L-10 900 Z"/>
              </clipPath>
              <clipPath id="lHillR">
                <path d="M480 900 Q600 865 720 822 Q840 778 970 735 Q1090 697 1220 666 Q1360 638 1500 624 Q1560 618 1600 620 L1600 900 Z"/>
              </clipPath>
              <clipPath id="lHillM">
                <path d="M-10 720 Q200 670 450 680 Q650 688 800 660 Q980 632 1200 650 Q1420 668 1610 645 L1610 900 L-10 900 Z"/>
              </clipPath>
            </defs>

            {/* Sky */}
            <rect width="1600" height="900" fill="url(#lSkyG)"/>

            {/* ══ ДАЛЬНИЙ ХОЛМ (фоновый) ══ */}
            <path d="M-10 720 Q200 670 450 680 Q650 688 800 660 Q980 632 1200 650 Q1420 668 1610 645 L1610 900 L-10 900 Z" fill="#2a6e3a"/>
            <path d="M-10 720 Q200 670 450 680 Q650 688 800 660 Q980 632 1200 650 Q1420 668 1610 645 L1610 658 Q1420 680 1200 663 Q980 645 800 673 Q650 700 450 692 Q200 682 -10 733 Z" fill="#3d8a4a" opacity="0.5"/>
            <g clipPath="url(#lHillM)" opacity="0.38">
              {Array.from({length:12},(_,i)=>{
                const d=13+i*25;
                return <path key={d} d={`M-10 ${720+d} Q200 ${670+d} 450 ${680+d} Q650 ${688+d} 800 ${660+d} Q980 ${632+d} 1200 ${650+d} Q1420 ${668+d} 1610 ${645+d}`} fill="none" stroke="#1a4d28" strokeWidth="15"/>
              })}
            </g>

            {/* ══ ЛЕВЫЙ ХОЛМ ══ */}
            <path d="M-10 635 Q300 655 600 692 Q850 728 1050 785 Q1100 805 1120 900 L-10 900 Z" fill="#1e5e28"/>
            <path d="M-10 635 Q300 655 600 692 Q850 728 1050 785 L1050 800 Q850 743 600 707 Q300 670 -10 650 Z" fill="#2a7835" opacity="0.6"/>
            <path d="M880 848 Q970 818 1050 785 L1050 800 Q970 833 880 863 Z" fill="#143d1e" opacity="0.4"/>
            <g clipPath="url(#lHillL)" opacity="0.38">
              {Array.from({length:12},(_,i)=>{
                const d=13+i*25;
                return <path key={d} d={`M-10 ${635+d} Q300 ${655+d} 600 ${692+d} Q850 ${728+d} 1050 ${785+d}`} fill="none" stroke="#0d3318" strokeWidth="15"/>
              })}
            </g>

            {/* ══ ПРАВЫЙ ХОЛМ ══ */}
            <path d="M480 900 Q600 865 720 822 Q840 778 970 735 Q1090 697 1220 666 Q1360 638 1500 624 Q1560 618 1600 620 L1600 900 Z" fill="#5a7e14"/>
            <path d="M480 900 Q600 865 720 822 Q840 778 970 735 Q1090 697 1220 666 Q1360 638 1500 624 Q1560 618 1600 620 L1600 633 Q1560 630 1500 636 Q1360 650 1220 679 Q1090 710 970 748 Q840 791 720 834 Q630 868 565 892 Z" fill="#7aa020" opacity="0.62"/>
            <path d="M480 900 Q600 865 720 822 Q840 778 970 735 L970 750 Q840 793 720 836 Q620 873 548 895 Z" fill="#3d5a08" opacity="0.45"/>
            <g clipPath="url(#lHillR)" opacity="0.38">
              {Array.from({length:13},(_,i)=>{
                const d=13+i*25;
                return <path key={d} d={`M480 ${900+d} Q600 ${865+d} 720 ${822+d} Q840 ${778+d} 970 ${735+d} Q1090 ${697+d} 1220 ${666+d} Q1360 ${638+d} 1500 ${624+d} Q1560 ${618+d} 1600 ${620+d}`} fill="none" stroke="#2e4006" strokeWidth="15"/>
              })}
            </g>

            {/* ══ ПШЕНИЧНОЕ ПОЛЕ ══ */}
            <path d="M-10 826 Q200 814 420 822 Q640 830 800 818 Q1000 809 1200 817 Q1430 825 1610 814 L1610 900 L-10 900 Z" fill="#c88a0e"/>
            <path d="M-10 826 Q200 814 420 822 Q640 830 800 818 Q1000 809 1200 817 Q1430 825 1610 814 L1610 838 Q1430 838 1200 830 Q1000 822 800 832 Q640 842 420 834 Q200 826 -10 838 Z" fill="#8a5c06" opacity="0.55"/>
            {Array.from({length:3},(_,i)=>{
              const y=840+i*25;
              return <path key={y} d={`M-10 ${y} Q400 ${y-7} 800 ${y+4} Q1200 ${y+9} 1610 ${y-4}`} fill="none" stroke="#7a4c04" strokeWidth="15" opacity="0.4"/>
            })}
          </svg>
        </div>

        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(26,77,46,0.75)' }} />

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '120px 24px 80px', maxWidth: 780 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <WheatEmoji size={64} />
          </div>
          <h1 style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 800,
            fontSize: 'clamp(38px, 7vw, 60px)',
            color: '#fff', margin: '0 0 20px',
            lineHeight: 1.15, letterSpacing: '-0.02em',
          }}>
            АгроАналитика
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 2.5vw, 20px)',
            color: 'rgba(255,255,255,0.87)',
            lineHeight: 1.6,
            maxWidth: 600, margin: '0 auto 40px',
          }}>
            Предиктивная аналитика для сельского хозяйства Ростовской области
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                padding: '14px 36px', borderRadius: 12, fontSize: 16, fontWeight: 700,
                fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
                background: '#fff', color: '#1a4d2e', border: 'none',
                boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.24)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.18)' }}
            >
              Начать бесплатно
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '14px 36px', borderRadius: 12, fontSize: 16, fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
                background: 'transparent', color: '#fff',
                border: '2px solid rgba(255,255,255,0.7)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)' }}
            >
              Войти
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          animation: 'bounce 1.8s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Прокрутите</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: '#fff', padding: 'clamp(60px, 8vw, 100px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeSection>
            <h2 style={{
              fontFamily: 'Montserrat, sans-serif', fontWeight: 800,
              fontSize: 'clamp(26px, 4vw, 38px)',
              color: '#1a4d2e', textAlign: 'center', marginBottom: 56,
            }}>
              Почему АгроАналитика?
            </h2>
          </FadeSection>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <FeatureCard
              delay={0}
              icon={<IconWheat size={52} color="#4caf50" />}
              title="Прогноз урожайности"
              text="ML-модель анализирует данные датчиков, осадки и 10 лет исторических показателей по всем 43 районам Ростовской области."
            />
            <FeatureCard
              delay={0.1}
              icon={<IconDroplet size={52} color="#4caf50" />}
              title="Умный полив"
              text="Рекомендации по орошению с учётом влажности почвы, температуры воздуха и прогноза осадков на ближайшие дни."
            />
            <FeatureCard
              delay={0.2}
              icon={<IconWarning size={52} color="#4caf50" />}
              title="Ранние предупреждения"
              text="Автоматическое обнаружение аномалий датчиков и критических отклонений параметров поля с мгновенными уведомлениями."
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: '#f0faf0', padding: 'clamp(60px, 8vw, 100px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <FadeSection>
            <h2 style={{
              fontFamily: 'Montserrat, sans-serif', fontWeight: 800,
              fontSize: 'clamp(26px, 4vw, 38px)',
              color: '#1a4d2e', textAlign: 'center', marginBottom: 56,
            }}>
              Как это работает
            </h2>
          </FadeSection>
          <FadeSection>
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              gap: 8, flexWrap: 'wrap',
            }}>
              <Step
                num="1"
                icon={<IconBarChart size={28} color="#4caf50" />}
                title="Добавьте участок"
                desc="Укажите культуру, площадь и координаты поля на карте Ростовской области"
              />
              <Arrow />
              <Step
                num="2"
                icon={<IconDroplets size={28} color="#4caf50" />}
                title="Введите данные датчиков"
                desc="Влажность почвы, температура воздуха — система валидирует и сохраняет"
              />
              <Arrow />
              <Step
                num="3"
                icon={<IconWheat size={28} color="#4caf50" />}
                title="Получите прогноз"
                desc="ML-модель рассчитывает урожайность и оценивает риски за секунды"
              />
              <Arrow />
              <Step
                num="4"
                icon={<IconCheck size={28} color="#4caf50" />}
                title="Следуйте рекомендациям"
                desc="Оптимизируйте полив, распределяйте ресурсы, сравнивайте поля"
              />
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: '#1a4d2e', padding: 'clamp(60px, 8vw, 100px) 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 6vw, 64px)', flexWrap: 'nowrap' }}>
            <StatCounter value={43} label="района Ростовской области в базе системы" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)', alignSelf: 'stretch', flexShrink: 0 }} />
            <StatCounter value={10} label="лет исторических данных урожайности по региону" />
            <div style={{ width: 1, background: 'rgba(255,255,255,0.15)', alignSelf: 'stretch', flexShrink: 0 }} />
            <StatCounter value={4} label="типа культур: зерновые, бобовые, технические, овощи" />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#fff', padding: 'clamp(80px, 10vw, 120px) 24px', textAlign: 'center' }}>
        <FadeSection>
          <h2 style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 800,
            fontSize: 'clamp(26px, 4vw, 42px)',
            color: '#1a4d2e', marginBottom: 16,
          }}>
            Готовы начать?
          </h2>
          <p style={{ fontSize: 18, color: '#6b7c6e', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
            Зарегистрируйтесь бесплатно и получите доступ ко всем функциям
          </p>
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '16px 48px', borderRadius: 14, fontSize: 17, fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif', cursor: 'pointer',
              background: 'linear-gradient(135deg, #1a4d2e, #4caf50)',
              color: '#fff', border: 'none',
              boxShadow: '0 6px 20px rgba(76,175,80,0.35)',
              transition: 'opacity 0.15s, box-shadow 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(76,175,80,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(76,175,80,0.35)' }}
          >
            Создать аккаунт
          </button>
        </FadeSection>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f3320', padding: '28px 32px' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <WheatEmoji size={24} />
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>
              АгроАналитика
            </span>
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Банк Центр-Инвест · Хакатон Весна 2026
          </span>
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(10px); }
        }
      `}</style>
    </div>
  )
}

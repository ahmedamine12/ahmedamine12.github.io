import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Icon, SNAPPY, useFinePointer, toast } from './kit'
import { useFlip } from './Flip'

export const SECTIONS = [
  { id: 'top', icon: 'home', key: 'home' },
  { id: 'about', icon: 'user', key: 'about' },
  { id: 'experience', icon: 'route', key: 'experience' },
  { id: 'work', icon: 'grid', key: 'work' },
  { id: 'skills', icon: 'tool', key: 'skills' },
  { id: 'contact', icon: 'mail', key: 'contact' },
]

const useActive = () => {
  const [active, setActive] = useState('top')
  useEffect(() => {
    const onScroll = () => {
      let cur = 'top'
      SECTIONS.forEach(s => {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = s.id
      })
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return active
}

/* One dock tile: magnifies with distance to the pointer, critically damped. */
const Tile = ({ mouseX, fine, label, active, children, as = 'a', className = '', ...rest }) => {
  const ref = useRef(null)
  const [hover, setHover] = useState(false)
  const dist = useTransform(mouseX, v => {
    const r = ref.current?.getBoundingClientRect()
    return r ? v - (r.left + r.width / 2) : Infinity
  })
  const size = useSpring(useTransform(dist, [-140, 0, 140], [44, 64, 44]), { stiffness: 520, damping: 40 })
  const Comp = motion[as]
  return (
    <Comp ref={ref} className={`tile ${className}${active ? ' is-active' : ''}`} aria-label={label}
      style={fine ? { width: size, height: size } : undefined}
      onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}
      onFocus={() => setHover(true)} onBlur={() => setHover(false)}
      whileTap={{ scale: 0.9, transition: { duration: 0.1 } }} {...rest}>
      {children}
      <AnimatePresence>
        {hover && fine && (
          <motion.span className="tile__tip" initial={{ opacity: 0, y: 6, x: '-50%', scale: 0.92 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }} exit={{ opacity: 0, y: 6, x: '-50%', scale: 0.92 }}
            transition={SNAPPY}>{label}</motion.span>
        )}
      </AnimatePresence>
      {active && <motion.span layoutId="dock-dot" className="tile__dot" transition={SNAPPY} />}
    </Comp>
  )
}

/* The window theme toggle from the original site, now spring-driven. 5 quick taps → disco. */
const ThemeWindow = ({ theme }) => (
  <span className="window" data-day={theme === 'light'}>
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span key={theme} className={theme === 'light' ? 'window__sun' : 'window__moon'}
        initial={{ rotate: -120, y: 10, opacity: 0 }} animate={{ rotate: 0, y: 0, opacity: 1 }}
        exit={{ rotate: 120, y: 10, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} />
    </AnimatePresence>
    <span className="window__cross" />
  </span>
)

export const Dock = ({ theme, toggleTheme }) => {
  const { open } = useFlip()
  const { t, i18n } = useTranslation()
  const fine = useFinePointer()
  const active = useActive()
  const mouseX = useMotionValue(Infinity)
  const taps = useRef([])

  const onTheme = () => {
    const now = Date.now()
    taps.current = [...taps.current.filter(x => now - x < 2200), now]
    if (taps.current.length >= 5) {
      taps.current = []
      document.documentElement.classList.add('disco')
      toast(t('egg'), 'spark')
      navigator.vibrate?.([12, 40, 12])
      setTimeout(() => document.documentElement.classList.remove('disco'), 4200)
    }
    toggleTheme()
  }

  return (
    <motion.nav className="dock" aria-label="Sections"
      initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.2 }}
      onMouseMove={(e) => fine && mouseX.set(e.clientX)} onMouseLeave={() => mouseX.set(Infinity)}>
      {SECTIONS.map(s => (
        <Tile key={s.id} mouseX={mouseX} fine={fine} label={t(`nav.${s.key}`)} active={active === s.id}
          href={`#${s.id}`} className={s.id === 'top' ? 'tile--home' : undefined}>
          <Icon name={s.icon} size={20} />
        </Tile>
      ))}
      <span className="dock__sep" />
      <Tile mouseX={mouseX} fine={fine} as="button" label={t('nav.lang')}
        onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}>
        <span className="tile__txt">{t('nav.lang_short')}</span>
      </Tile>
      <Tile mouseX={mouseX} fine={fine} as="button" label={t('nav.theme')} onClick={onTheme}>
        <ThemeWindow theme={theme} />
      </Tile>
      <Tile mouseX={mouseX} fine={fine} as="button" label={t('nav.cv')} onClick={open} className="tile--cv">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h4" /></svg>
      </Tile>
    </motion.nav>
  )
}

export const Toasts = ({ items, dismiss }) => (
  <div className="toasts" role="status" aria-live="polite">
    <AnimatePresence initial={false}>
      {items.map(it => (
        <motion.button key={it.id} className="toast" onClick={() => dismiss(it.id)} layout
          initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(8px)' }}
          transition={SNAPPY}>
          <span className="toast__ic"><Icon name={it.icon} size={16} stroke={2.2} /></span>{it.text}
        </motion.button>
      ))}
    </AnimatePresence>
  </div>
)

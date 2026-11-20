import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

/* ------------------------------------------------------------------
   Springs, in Apple's terms (damping ratio + response), converted to
   stiffness/damping: k = (2π / response)², c = 2·ζ·√k  (mass = 1)
------------------------------------------------------------------- */
const spring = (response, ratio) => {
  const k = Math.pow((2 * Math.PI) / response, 2)
  return { type: 'spring', stiffness: k, damping: 2 * ratio * Math.sqrt(k), mass: 1 }
}
export const SPRING = spring(0.4, 1)        // default: critically damped, no overshoot
export const SNAPPY = spring(0.3, 1)        // small UI (pills, tooltips)
export const FLICK = spring(0.4, 0.8)       // only after a gesture carried momentum
export const SHEET = spring(0.3, 0.8)       // drawers / sheets

// Apple's momentum projection (Designing Fluid Interfaces)
export const project = (v, d = 0.998) => (v / 1000) * d / (1 - d)

export const useFinePointer = () => {
  // read synchronously so the first render already matches the device (no div → motion.div remount)
  const [fine, setFine] = useState(() => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const set = () => setFine(mq.matches)
    set(); mq.addEventListener?.('change', set)
    return () => mq.removeEventListener?.('change', set)
  }, [])
  return fine
}

export const useCasaTime = () => {
  const fmt = () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' }).format(new Date())
  const [time, setTime] = useState(fmt)
  useEffect(() => { const id = setInterval(() => setTime(fmt()), 15000); return () => clearInterval(id) }, [])
  return time
}
export const casaHour = () => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Africa/Casablanca' }).format(new Date()))

/* ---------------- icons (SF Symbols–like strokes) ---------------- */
export const Icon = ({ name, size = 20, stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{P[name]}</svg>
)
const P = {
  home: <><path d="M3 11 12 4l9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  scan: <><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M4 12h16" /></>,
  route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h8a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h8" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /></>,
  tool: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  down: <path d="M12 4v13M6 12l6 6 6-6M5 21h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  ext: <><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></>,
  code: <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
  check: <path d="m5 12 5 5 9-10" />,
  chat: <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" />,
  wa: <><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z" /></>,
  in: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></>,
  gh: <path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.9-2.4c3-.3 6-1.5 6-6.5a5 5 0 0 0-1.4-3.6 4.6 4.6 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12.4 12.4 0 0 0-6.5 0C6 1.2 4.9 1.5 4.9 1.5a4.6 4.6 0 0 0-.1 3.5A5 5 0 0 0 3.4 8.6c0 5 3 6.2 6 6.5a3 3 0 0 0-.9 2.4V21" />,
  spark: <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />,
  pen: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13 7 4 4" /></>,
  cap: <><path d="m2 9 10-5 10 5-10 5z" /><path d="M6 11v5c3 2.5 9 2.5 12 0v-5" /></>,
  badge: <><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" /></>,
  replay: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  up: <path d="M12 20V6M6 11l6-6 6 6" />,
  chev: <path d="m6 9 6 6 6-6" />,
}

/* ---------- Magnetic: follows the pointer a little, springs home ---------- */
export const Magnetic = ({ as = 'a', strength = 0.25, className = '', children, ...rest }) => {
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, SPRING), sy = useSpring(y, SPRING)
  const Comp = motion[as]
  return (
    <Comp className={className} style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * strength)
        y.set((e.clientY - r.top - r.height / 2) * strength)
      }}
      onPointerLeave={() => { x.set(0); y.set(0) }}
      whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      {...rest}>
      {children}
    </Comp>
  )
}

/* ---------- Tilt card: 3D tilt + spotlight, springs from the live value ---------- */
export const Tilt = ({ max = 6, className = '', children, style, ...rest }) => {
  const px = useMotionValue(0.5), py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), SPRING)
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), SPRING)
  const fine = useFinePointer()
  // Touch has no hover to tilt with. A permanent perspective() layer combined with the card's
  // backdrop-filter makes iOS Safari render the card blank, so phones get a flat, plain element.
  if (!fine) return <div className={`tilt ${className}`} style={style} {...rest}>{children}</div>
  return (
    <motion.div className={`tilt ${className}`} style={{ rotateX: rx, rotateY: ry, transformPerspective: 900, ...style }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height
        e.currentTarget.style.setProperty('--mx', `${nx * 100}%`)
        e.currentTarget.style.setProperty('--my', `${ny * 100}%`)
        if (e.pointerType === 'mouse') { px.set(nx); py.set(ny) }
      }}
      onPointerLeave={() => { px.set(0.5); py.set(0.5) }}
      {...rest}>
      {children}
    </motion.div>
  )
}

/* ---------- Section heading with editorial numbering ---------- */
export const Head = ({ n, kicker, title, sub, center }) => (
  <div className={`head${center ? ' head--center' : ''}`}>
    <motion.p className="kicker" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }} transition={SPRING}>
      <span className="kicker__n">{n}</span><span className="kicker__line" />{kicker}
    </motion.p>
    <motion.h2 className="h2" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }} transition={{ ...SPRING, delay: 0.05 }}>{title}</motion.h2>
    {sub && <motion.p className="lead" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }} transition={{ ...SPRING, delay: 0.1 }}>{sub}</motion.p>}
  </div>
)

export const Reveal = ({ children, delay = 0, y = 24, className = '', as = 'div', ...rest }) => {
  const Comp = motion[as]
  const fine = useFinePointer()
  // one entrance for the whole page: the block "materializes" (rise + un-blur), then leaves no filter behind.
  // On touch devices the blur is skipped: an animated filter over backdrop-filter cards is what
  // blanks them out on iOS Safari, and it's the most expensive part of the entrance on a phone.
  const from = fine ? { opacity: 0, y, filter: 'blur(8px)' } : { opacity: 0, y }
  const to = fine ? { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } } : { opacity: 1, y: 0 }
  return (
    <Comp className={className} initial={from} whileInView={to}
      viewport={{ once: true, amount: 0.05 }} transition={{ ...SPRING, delay }} {...rest}>{children}</Comp>
  )
}

/* ---------- toast bus (status / completion feedback) ---------- */
const listeners = new Set()
export const toast = (text, icon = 'check') => listeners.forEach(fn => fn({ text, icon, id: Date.now() + Math.random() }))
export const useToasts = () => {
  const [items, setItems] = useState([])
  const timers = useRef({})
  useEffect(() => {
    const fn = (t) => {
      setItems(cur => [...cur.slice(-1), t])
      timers.current[t.id] = setTimeout(() => setItems(cur => cur.filter(i => i.id !== t.id)), t.text.length > 50 ? 4200 : 2600)
    }
    listeners.add(fn)
    const tm = timers.current
    return () => { listeners.delete(fn); Object.values(tm).forEach(clearTimeout) }
  }, [])
  return [items, (id) => setItems(cur => cur.filter(i => i.id !== id))]
}

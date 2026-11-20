import React, { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Head, Icon, SPRING, FLICK, project } from './kit'
import { SKILLS } from '../data'

/*
  About = the statement, acted out.
  "Turning an unclear need into something simple": a tangled thread the visitor pulls straight.
  - Direct manipulation: the thread's end follows the pointer 1:1 (horizontal), grab anywhere on the stage.
  - Release: Apple's momentum projection picks solved / tangled, the release velocity is handed to the spring.
  - Interruptible: grab it again mid-flight, it continues from where it is (motion value, never a CSS transition).
  - Rubber-band past both ends. Keyboard: arrows nudge, Enter/Space toggles.
  - The stats are stations on the dashed guide line ("where this is going"), lit as the thread reaches them.
*/

const W = 1000, H = 260, Y = 130          // SVG user space (stretched with preserveAspectRatio="none")
const X0 = 60, XT = 300, X1 = 960          // thread start, tangle end (handle at rest), straight end
const N = 160
const env = s => Math.pow(Math.sin(Math.PI * s), 0.5)
const TANGLE = Array.from({ length: N }, (_, k) => {
  const s = k / (N - 1), e = env(s), tau = 2 * Math.PI
  return [
    X0 + s * (XT - X0) + (110 * Math.sin(tau * 5.3 * s) + 30 * Math.sin(tau * 11 * s)) * e,
    Y + (85 * Math.cos(tau * 4.1 * s) + 25 * Math.sin(tau * 9.7 * s)) * e,
  ]
})
const LINE = Array.from({ length: N }, (_, k) => [X0 + (k / (N - 1)) * (X1 - X0), Y])
const STATIONS = [430, 585, 740, 890]
const at = x => (x - XT) / (X1 - XT)        // progress at which the handle reaches x
const clamp01 = v => Math.min(1, Math.max(0, v))

// the end unravels first (the part being pulled), the start follows: each point has its own lag
const points = p => TANGLE.map(([tx, ty], k) => {
  const lag = (1 - k / (N - 1)) * 0.4
  const q = clamp01((p - lag) / (1 - lag))
  return [tx + (LINE[k][0] - tx) * q, ty + (LINE[k][1] - ty) * q]
})
const smooth = P => {                       // Catmull-Rom → cubic Bézier
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i - 1] || P[i], b = P[i], c = P[i + 1], e = P[i + 2] || c
    d += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)},${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)},${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`
  }
  return d
}
const rubber = o => (o * 0.35) / (1 + 2 * Math.abs(o))   // soft resistance beyond the ends, in progress units

const Station = ({ p, x, i, s }) => {
  const t = at(x)
  const lit = useTransform(p, [t - 0.05, t + 0.03], [0, 1])
  const op = useTransform(lit, [0, 1], [0.38, 1])
  const sc = useTransform(lit, [0, 1], [0.5, 1])
  return (
    <>
      <motion.i className="thread__dot" style={{ left: `${x / 10}%`, scale: sc, opacity: op }} aria-hidden="true" />
      <motion.div className={`thread__st${i % 2 ? '' : ' is-up'}`} style={{ '--x': `${x / 10}%`, opacity: op }}>
        <b>{s.pre}{s.n}{s.suffix}</b>
        <span>{s.label}</span>
      </motion.div>
    </>
  )
}

const MStat = ({ p, x, s }) => {
  const t = at(x)
  const op = useTransform(p, [t - 0.05, t + 0.03], [0.38, 1])
  return <motion.div className="thread__mst" style={{ opacity: op }}><b>{s.pre}{s.n}{s.suffix}</b><span>{s.label}</span></motion.div>
}

const Thread = ({ stats, labels, onSolved }) => {
  const reduce = useReducedMotion()
  const p = useMotionValue(reduce ? 1 : 0)
  const stage = useRef(null)
  const drag = useRef(null)
  const touched = useRef(false)
  const anim = useRef(null)
  const inView = useInView(stage, { amount: 0.6 })

  const d = useTransform(p, v => smooth(points(v)))
  const hx = useTransform(p, v => `${(XT + (X1 - XT) * v) / 10}%`)
  const hy = useTransform(p, v => `${(points(Math.min(1, Math.max(0, v)))[N - 1][1] / H) * 100}%`)
  const mess = useTransform(p, [0, 0.35], [1, 0])
  const pull = useTransform(p, [0, 0.15], [1, 0])
  const neat = useTransform(p, [0.8, 1], [0, 1])
  const grey = useTransform(p, [0, 0.9], [1, 0])
  const hue = useTransform(p, [0, 0.9], [0.12, 1])
  const [solved, setSolved] = useState(reduce)
  useMotionValueEvent(p, 'change', v => setSolved(v > 0.985))
  useEffect(() => { onSolved(solved) }, [solved, onSolved])

  const go = (target, velocity = 0, cfg = SPRING) => {
    anim.current?.stop()
    anim.current = animate(p, target, { ...cfg, velocity })
  }

  // a gentle tug when it comes into view, pointing where the gesture goes (once per visit, until touched)
  useEffect(() => {
    if (!inView || reduce || touched.current || p.get() > 0.05) return
    const id = setTimeout(() => {
      if (touched.current) return
      anim.current = animate(p, 0.1, { ...SPRING, onComplete: () => { if (!touched.current) go(0, 0, FLICK) } })
    }, 500)
    return () => clearTimeout(id)
  }, [inView]) // eslint-disable-line react-hooks/exhaustive-deps

  const span = () => (stage.current.getBoundingClientRect().width * (X1 - XT)) / W   // px for progress 0 → 1

  const down = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    touched.current = true
    anim.current?.stop()                              // grab it mid-flight: continue from the live value
    drag.current = { x0: e.clientX, y0: e.clientY, p0: p.get(), hist: [{ x: e.clientX, t: e.timeStamp }], live: false, id: e.pointerId }
  }
  const move = (e) => {
    const g = drag.current
    if (!g) return
    if (e.pointerType === 'mouse' && e.buttons === 0) { drag.current = null; return }   // released outside the stage
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0
    if (!g.live) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag.current = null; return }   // vertical: let the page scroll
      if (Math.abs(dx) < 6) return
      g.live = true
      stage.current.setPointerCapture?.(g.id)
    }
    const raw = g.p0 + dx / span()
    p.set(raw < 0 ? -rubber(-raw) : raw > 1 ? 1 + rubber(raw - 1) : raw)
    g.hist.push({ x: e.clientX, t: e.timeStamp })
    if (g.hist.length > 6) g.hist.shift()
  }
  const up = (e) => {
    const g = drag.current
    drag.current = null
    if (!g) return
    if (!g.live) { go(p.get() < 0.5 ? 1 : 0, 0, SPRING); return }       // tap = toggle
    const a = g.hist[0], b = g.hist[g.hist.length - 1]
    const gap = (b.t - a.t) / Math.max(1, g.hist.length - 1)              // this device's event rhythm
    const rested = e.timeStamp - b.t > Math.max(100, gap * 2.5)        // a finger that stopped before release throws nothing
    const vpx = b.t > a.t && !rested ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0
    const v = vpx / span()
    const end = p.get() + project(vpx) / span()
    go(end > 0.5 ? 1 : 0, v, Math.abs(vpx) > 300 ? FLICK : SPRING)    // bounce only when it was thrown
  }
  const key = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault(); touched.current = true
      go(clamp01(p.get() + (e.key === 'ArrowRight' ? 0.12 : -0.12)))
    }
  }

  return (
    <div className="thread-wrap">
      <div className={`surface thread${solved ? ' is-solved' : ''}`} ref={stage}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null }}>
        <svg className="thread__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="threadGrad" gradientUnits="userSpaceOnUse" x1={X0} x2={X1} y1="0" y2="0">
              <stop offset="0" style={{ stopColor: 'var(--t1)' }} />
              <stop offset=".5" style={{ stopColor: 'var(--t2)' }} />
              <stop offset="1" style={{ stopColor: 'var(--t3)' }} />
            </linearGradient>
          </defs>
          <line className="thread__guide" x1={X0} x2={X1} y1={Y} y2={Y} vectorEffect="non-scaling-stroke" />
          <motion.path className="thread__line thread__line--grey" d={d} style={{ opacity: grey }} vectorEffect="non-scaling-stroke" />
          <motion.path className="thread__line" d={d} stroke="url(#threadGrad)" style={{ opacity: hue }} vectorEffect="non-scaling-stroke" />
        </svg>

        <i className="thread__start" style={{ left: `${X0 / 10}%` }} aria-hidden="true" />
        {STATIONS.map((x, i) => stats[i] && <Station key={x} p={p} x={x} i={i} s={stats[i]} />)}

        <motion.span className="hint thread__note thread__note--mess" style={{ opacity: mess }} aria-hidden="true">
          {labels.mess}
          <svg width="34" height="24" viewBox="0 0 34 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 3c8 2 16 8 24 17" /><path d="m20 18 7 3 1-7" /></svg>
        </motion.span>
        <motion.span className="hint thread__note thread__note--neat" style={{ opacity: neat }} aria-hidden="true">{labels.neat}</motion.span>

        <motion.button className="thread__handle" style={{ left: hx, top: hy }} type="button"
          aria-label={labels.aria} aria-pressed={solved}
          onClick={(e) => { if (e.detail === 0) { touched.current = true; go(p.get() < 0.5 ? 1 : 0) } }} onKeyDown={key}>
          <span className="knob thread__knob">{solved ? <Icon name="check" size={16} stroke={2.6} /> : <Icon name="arrow" size={15} stroke={2.4} />}</span>
          <motion.span className="hint thread__pull" style={{ opacity: pull }}>{labels.pull}</motion.span>
        </motion.button>
      </div>
      <div className="thread-stats">
        {STATIONS.map((x, i) => stats[i] && <MStat key={x} p={p} x={x} s={stats[i]} />)}
      </div>
    </div>
  )
}

export const About = () => {
  const { t } = useTranslation()
  const stats = t('about.stats', { returnObjects: true })
  const lead = t('about.lead', { returnObjects: true })
  const notes = t('about.notes', { returnObjects: true })
  const th = t('about.thread', { returnObjects: true })
  const q = t('about.question', { returnObjects: true })
  const [solved, setSolved] = useState(false)
  const line = { hidden: { y: '105%' }, show: i => ({ y: '0%', transition: { ...SPRING, delay: i * 0.08 } }) }

  return (
    <section className="section" id="about">
      <div className="wrap">
        <Head n="01" kicker={t('about.kicker')} />

        <motion.h2 className={`ab__lead${solved ? ' is-solved' : ''}`} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-15% 0px' }}>
          {[lead.a, lead.b].map((segs, l) => (
            <span key={l} className="ab__mask"><motion.span className={`ab__l${l + 1}`} custom={l} variants={line}>
              {segs.map((s, i) => s.k === 'mess'
                ? <span key={i} className="ab__mess">{s.t}<i className="ab__wave" aria-hidden="true" /><i className="ab__straight" aria-hidden="true" /></span>
                : <span key={i} className={s.k ? `ab__${s.k}` : undefined}>{s.t}</span>)}
            </motion.span></span>
          ))}
        </motion.h2>

        <div className="ab__row">
          <p className="ab__body">{t('about.body')}</p>
          <ul className="ab__notes" aria-label={th.notes}>
            {notes.map((n, i) => (
              <motion.li key={n} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ ...SPRING, delay: 0.2 + i * 0.07 }} style={{ rotate: `${[-2, 1.5, -1, 2, -1.5][i % 5]}deg` }}>{n}</motion.li>
            ))}
          </ul>
        </div>

        <Thread stats={stats} labels={th} onSolved={setSolved} />

        <div className={`ab__q${solved ? ' is-solved' : ''}`}>
          <span className="ab__q-pre">{q.pre}</span>
          {q.items.map((s, i) => (
            <span key={s} className="ab__q-it" style={{ '--d': `${i * 0.18}s` }}>
              <i className="ab__tick" aria-hidden="true"><Icon name="check" size={14} stroke={3} /></i>{s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

export const Marquee = () => {
  const all = [...SKILLS.ai, ...SKILLS.backend, ...SKILLS.frontend, ...SKILLS.devops].filter(s => s.length < 22)
  const half = Math.ceil(all.length / 2)
  const rows = [all.slice(0, half), all.slice(half)]
  return (
    <div className="marquee" aria-hidden="true">
      {rows.map((row, r) => (
        <div key={r} className={`marquee__row${r ? ' marquee__row--rev' : ''}`}>
          <div className="marquee__track">
            {[...row, ...row].map((s, i) => <span key={i} className="marquee__item">{s}<i>✦</i></span>)}
          </div>
        </div>
      ))}
    </div>
  )
}

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import { Icon, SPRING, FLICK, project } from './kit'

/*
  Earlier projects as a Cover Flow of illustrated covers.
  - pos (a float, in "cover" units) is the single source of truth; every cover derives its 3D pose from it.
  - Drag anywhere 1:1, release → momentum projection picks the cover, release velocity handed to the spring.
  - Interruptible (grab it mid-glide), rubber-band past both ends, tap a side cover to bring it forward,
    arrows / keyboard for precise steps. The caption below always describes the centred cover.
*/

/* ---------- covers: one small illustration per project, drawn from what it does ---------- */
const Cover = ({ k }) => {
  const A = ART[k] || ART.hiring
  return (
    <svg viewBox="0 0 200 200" className="cf__art" aria-hidden="true">
      <defs>
        <linearGradient id={`cg-${k}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={A.c[0]} /><stop offset="1" stopColor={A.c[1]} /></linearGradient>
        <radialGradient id={`cs-${k}`} cx=".2" cy=".1" r=".9"><stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset=".6" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#cg-${k})`} />
      {A.draw}
      <rect width="200" height="200" fill={`url(#cs-${k})`} />
    </svg>
  )
}
const W = 'rgba(255,255,255,.92)', W2 = 'rgba(255,255,255,.45)', W3 = 'rgba(255,255,255,.18)'
const ART = {
  hiring: { c: ['#4f46e5', '#1e1b4b'], draw: <>
    <rect x="46" y="38" width="108" height="128" rx="12" fill={W3} stroke={W2} />
    <rect x="60" y="54" width="62" height="8" rx="4" fill={W} />
    {[0, 1, 2].map(i => <g key={i} transform={`translate(60 ${80 + i * 26})`}>
      <circle cx="7" cy="7" r="7" fill={i === 1 ? '#34d399' : 'none'} stroke={i === 1 ? '#34d399' : W2} strokeWidth="2" />
      {i === 1 && <path d="m3.5 7 2.5 2.5 4.5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />}
      <rect x="22" y="3" width={[56, 44, 50][i]} height="7" rx="3.5" fill={i === 1 ? W : W2} />
    </g>)}
    <rect x="132" y="128" width="40" height="30" rx="6" fill="#f59e0b" /><path d="M144 128v-6h16v6" stroke="#f59e0b" strokeWidth="4" fill="none" /><rect x="132" y="139" width="40" height="3" fill="rgba(0,0,0,.2)" />
  </> },
  deliver: { c: ['#10b981', '#064e3b'], draw: <>
    {[40, 80, 120, 160].map(v => <g key={v}><path d={`M${v} 0v200`} stroke={W3} /><path d={`M0 ${v}h200`} stroke={W3} /></g>)}
    <path d="M42 150C70 150 64 96 100 96s40-50 62-50" stroke={W} strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" fill="none" />
    {[[42, 150], [100, 96], [162, 46]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}>
      <path d="M0 0c-10-12-14-18-14-24a14 14 0 0 1 28 0c0 6-4 12-14 24z" fill={i === 2 ? '#f43f5e' : '#fff'} transform="translate(0 -2)" />
      <circle cx="0" cy="-26" r="5" fill={i === 2 ? '#fff' : '#10b981'} />
    </g>)}
    <rect x="58" y="160" width="58" height="22" rx="6" fill="rgba(0,0,0,.25)" /><text x="87" y="175" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">12 km · 34 DH</text>
  </> },
  red: { c: ['#ef4444', '#7f1d1d'], draw: <>
    <path d="M148 18v40" stroke={W} strokeWidth="3" /><path d="M120 18h56" stroke={W} strokeWidth="5" strokeLinecap="round" /><path d="M141 58h14l-3 8h-8z" fill={W} />
    {[[30, 128, '#f59e0b'], [86, 128, '#0ea5e9'], [142, 128, '#fff'], [58, 92, '#22c55e'], [114, 92, '#f59e0b']].map(([x, y, c], i) => (
      <g key={i}><rect x={x} y={y} width="52" height="34" rx="3" fill={c} />
        {[1, 2, 3, 4, 5].map(j => <path key={j} d={`M${x + j * 8.7} ${y + 5}v24`} stroke="rgba(0,0,0,.18)" strokeWidth="2" />)}</g>
    ))}
    <path d="M14 168h172" stroke={W2} strokeWidth="3" strokeLinecap="round" />
  </> },
  voice: { c: ['#a855f7', '#4c1d95'], draw: <>
    {Array.from({ length: 15 }, (_, i) => { const h = [10, 22, 36, 18, 48, 64, 40, 70, 44, 28, 56, 30, 16, 26, 10][i]; return <rect key={i} x={24 + i * 10} y={92 - h / 2} width="5" height={h} rx="2.5" fill={i > 5 && i < 11 ? W : W2} /> })}
    <path d="M118 120l0 52 13-12 9 20 9-4-9-20 18-2z" fill="#fff" stroke="rgba(0,0,0,.25)" strokeWidth="2" strokeLinejoin="round" />
    <text x="28" y="160" fontSize="15" fontWeight="700" fill={W} fontFamily="Inter, sans-serif">“click”</text>
  </> },
  color: { c: ['#0f172a', '#0e7490'], draw: <>
    {[[44, 128, .18], [62, 116, .3], [82, 106, .45]].map(([x, y, o], i) => <circle key={i} cx={x} cy={y} r="13" fill="#f97316" opacity={o} />)}
    <circle cx="112" cy="92" r="22" fill="#f97316" />
    <g stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M82 70v-8h8M134 62h8v8M142 114v8h-8M90 122h-8v-8" />
    </g>
    <path d="M150 92h30m-8-8 8 8-8 8" stroke="#22d3ee" strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="82" y="40" width="62" height="16" rx="4" fill="#22d3ee" /><text x="113" y="51.5" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#0f172a" fontFamily="ui-monospace, monospace">ORANGE · →</text>
  </> },
  covid: { c: ['#f59e0b', '#9a3412'], draw: <>
    <rect x="62" y="26" width="76" height="30" rx="8" fill={W} /><text x="100" y="45" textAnchor="middle" fontSize="12" fontWeight="800" fill="#9a3412" fontFamily="Inter, sans-serif">IF fever</text>
    <path d="M100 56v14M100 70H56v16M100 70h44v16" stroke={W} strokeWidth="3" fill="none" />
    <rect x="22" y="86" width="68" height="28" rx="8" fill={W3} stroke={W} /><text x="56" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">+ cough</text>
    <rect x="110" y="86" width="68" height="28" rx="8" fill={W3} stroke={W2} /><text x="144" y="104" textAnchor="middle" fontSize="11" fontWeight="700" fill={W} fontFamily="Inter, sans-serif">no cough</text>
    <path d="M56 114v18" stroke={W} strokeWidth="3" />
    <rect x="18" y="132" width="76" height="30" rx="8" fill="#fff" /><text x="56" y="151" textAnchor="middle" fontSize="11" fontWeight="800" fill="#b45309" fontFamily="Inter, sans-serif">THEN test</text>
    <g transform="translate(150 150)" fill="none" stroke={W} strokeWidth="3">
      <circle r="14" />{Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <path key={i} d={`M${Math.cos(a) * 14} ${Math.sin(a) * 14}L${Math.cos(a) * 22} ${Math.sin(a) * 22}`} strokeLinecap="round" /> })}
    </g>
  </> },
}

/* ---------- one cover in the flow ---------- */
const STEP = 0.62                     // horizontal spacing of side covers, in cover widths
const Item = ({ i, pos, size, onPick, art, title, active }) => {
  const d = useTransform(pos, v => i - v)
  const x = useTransform(d, v => {
    const a = Math.abs(v), s = Math.sign(v)
    return s * (a < 1 ? a * size * 0.82 : size * 0.82 + (a - 1) * size * STEP * 0.55)
  })
  const rotateY = useTransform(d, v => Math.max(-58, Math.min(58, -v * 58)))
  const z = useTransform(d, v => -Math.min(Math.abs(v), 1) * size * 0.55 - Math.max(0, Math.abs(v) - 1) * 20)
  const opacity = useTransform(d, v => Math.max(0, 1 - Math.max(0, Math.abs(v) - 2.6) * 0.8))
  const zIndex = useTransform(d, v => 100 - Math.round(Math.abs(v) * 10))
  return (
    <motion.button type="button" className={`cf__item${active ? ' is-active' : ''}`} style={{ x, z, rotateY, opacity, zIndex }}
      onClick={(e) => onPick(i, e)} aria-label={title} aria-current={active} tabIndex={active ? 0 : -1}>
      <Cover k={art} />
    </motion.button>
  )
}

export const Archive = ({ items, labels }) => {
  const n = items.length
  const pos = useMotionValue(0)
  const [cur, setCur] = useState(0)
  const stage = useRef(null)
  const g = useRef(null)
  const anim = useRef(null)
  const moved = useRef(false)
  const [size, setSize] = useState(240)

  useEffect(() => {
    const fit = () => setSize(window.innerWidth < 720 ? 190 : window.innerWidth < 1100 ? 240 : 285)
    fit(); window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  useMotionValueEvent(pos, 'change', v => setCur(Math.max(0, Math.min(n - 1, Math.round(v)))))

  const target = useRef(0)
  const go = (to, velocity = 0, cfg = SPRING) => {
    anim.current?.stop()
    target.current = Math.max(0, Math.min(n - 1, to))
    anim.current = animate(pos, target.current, { ...cfg, velocity })
  }
  const step = (d) => go(target.current + d)
  const unit = () => size * 0.82          // px per cover when dragging near the centre

  const down = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    anim.current?.stop()
    moved.current = false
    g.current = { x0: e.clientX, y0: e.clientY, p0: pos.get(), live: false, id: e.pointerId, hist: [{ x: e.clientX, t: e.timeStamp }] }
  }
  const move = (e) => {
    const s = g.current
    if (!s) return
    if (e.pointerType === 'mouse' && e.buttons === 0) { g.current = null; go(Math.round(pos.get())); return }
    const dx = e.clientX - s.x0, dy = e.clientY - s.y0
    if (!s.live) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { g.current = null; return }
      if (Math.abs(dx) < 6) return
      s.live = true; moved.current = true
      stage.current.setPointerCapture?.(s.id)
    }
    let v = s.p0 - dx / unit()
    if (v < 0) v = -(-v * 0.35) / (1 + -v)                         // rubber-band
    if (v > n - 1) v = n - 1 + ((v - n + 1) * 0.35) / (1 + v - n + 1)
    pos.set(v)
    s.hist.push({ x: e.clientX, t: e.timeStamp }); if (s.hist.length > 6) s.hist.shift()
  }
  const up = (e) => {
    const s = g.current
    g.current = null
    if (!s) return
    if (!s.live) { if (Math.abs(pos.get() - Math.round(pos.get())) > 0.01) go(Math.round(pos.get())); return }
    const a = s.hist[0], b = s.hist[s.hist.length - 1]
    const gap = (b.t - a.t) / Math.max(1, s.hist.length - 1)              // this device's event rhythm
    const rested = e.timeStamp - b.t > Math.max(100, gap * 2.5)        // a finger that stopped before release throws nothing
    const vpx = b.t > a.t && !rested ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0
    const end = pos.get() - project(vpx) / unit()
    go(Math.round(end), -vpx / unit(), Math.abs(vpx) > 300 ? FLICK : SPRING)
  }
  const pick = (i, e) => {
    if (moved.current) { e.preventDefault(); return }
    if (i !== cur) go(i)
  }
  const key = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
  }
  const it = items[cur]

  return (
    <div className="surface cf" onKeyDown={key}>
      <div className="cf__stage" ref={stage} style={{ '--cf': `${size}px` }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        role="group" aria-roledescription="carousel" aria-label={labels.title}>
        <div className="cf__floor">
          {items.map((m, i) => <Item key={m.title} i={i} pos={pos} size={size} onPick={pick} art={m.art} title={m.title} active={i === cur} />)}
        </div>
        <p className="hint cf__hint" aria-hidden="true">{labels.hint}</p>
      </div>

      <div className="cf__bar">
        <button type="button" className="cf__nav" onClick={() => step(-1)} disabled={cur === 0} aria-label={labels.prev}><Icon name="arrow" size={18} /></button>
        <div className="cf__cap" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={cur} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              <span className="cf__n mono">{String(cur + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
              <h4 className="cf__t">{it.title}</h4>
              <p className="cf__d">{it.desc}</p>
              <div className="cf__meta">
                <span className="cf__tech mono">{it.tech}</span>
                <a className="cf__go" href={it.link} target="_blank" rel="noreferrer">{labels.open}<Icon name="ext" size={14} /></a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        <button type="button" className="cf__nav" onClick={() => step(1)} disabled={cur === n - 1} aria-label={labels.next}><Icon name="arrow" size={18} /></button>
      </div>
    </div>
  )
}

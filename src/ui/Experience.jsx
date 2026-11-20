import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Head, Reveal, SPRING } from './kit'
import { EXP_TECH } from '../data'

/*
  Journey = a climb. Read from base camp (first internship) up to the summit (today's job).
  - Wide screens: the mountain stays beside the cards; a trail draws itself as you scroll and a
    small climber walks it, camp by camp. Click a camp to jump to its story.
  - Phones: the mountain becomes an elevation strip pinned on top (like a hiking app).
  - The climber follows your scroll 1:1 (through a spring), nothing is hijacked.
*/

// story order, bottom → top: items are stored newest first in the locales
const ORDER = [4, 3, 2, 1, 0]           // Tekcy, Saweblia, Neoxia, Lymit Labs, Xelops
const KIND = ['base', 'camp', 'camp', 'side', 'summit']

// trail vertices; camps sit on the even ones
const GEO = {
  desk: {
    vb: '0 0 400 500',
    pts: [[58, 474], [176, 440], [112, 398], [222, 352], [158, 300], [252, 252], [326, 156], [298, 176], [266, 112]],
    camps: [0, 2, 4, 6, 8],
    lab: [[14, 4, 'start'], [-14, 4, 'end'], [14, 4, 'start'], [0, 28, 'middle'], [-14, 4, 'end']],  // label offset per camp
    stars: [[40, 60], [96, 34], [150, 92], [204, 48], [352, 52], [380, 104], [318, 24], [60, 150], [170, 160]],
  },
  phone: {
    vb: '0 0 400 120',
    pts: [[16, 104], [70, 96], [104, 84], [150, 88], [190, 66], [232, 62], [292, 44], [330, 52], [384, 18]],
    camps: [0, 2, 4, 6, 8],
  },
}

const lengths = (pts) => {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
  return cum
}
const pointAt = (pts, cum, f) => {
  const d = Math.max(0, Math.min(1, f)) * cum[cum.length - 1]
  let i = 1
  while (i < cum.length - 1 && cum[i] < d) i++
  const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]
}

const usePhone = () => {
  const q = '(max-width: 960px)'
  const [on, setOn] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q), f = () => setOn(mq.matches)
    mq.addEventListener?.('change', f); return () => mq.removeEventListener?.('change', f)
  }, [])
  return on
}

const span = (it, now) => {
  const [from, to] = it.date.split('—').map(s => s.trim())
  return { from, to: to ? (/present|aujourd/i.test(to) ? now : to) : null }
}

const Mountain = ({ geo, phone, pos, reached, names, years, onPick }) => {
  const cum = lengths(geo.pts)
  const trail = 'M' + geo.pts.map(p => p.join(' ')).join(' L')
  const cx = useTransform(pos, f => pointAt(geo.pts, cum, f)[0])
  const cy = useTransform(pos, f => pointAt(geo.pts, cum, f)[1])
  const top = geo.pts[geo.pts.length - 1]

  return (
    <svg className={`mt__svg${phone ? ' mt__svg--strip' : ''}`} viewBox={geo.vb} role="img" aria-label={names.join(' → ')}>
      <defs>
        <linearGradient id="mt-rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="mt__rock-hi" /><stop offset="1" className="mt__rock-lo" />
        </linearGradient>
      </defs>
      {phone ? (
        // elevation profile: the trail itself, filled below
        <path d={`${trail} L384 120 L16 120Z`} fill="url(#mt-rock)" className="mt__mass" />
      ) : (<>
        {geo.stars.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1.1 : 1.6} className="mt__star" style={{ animationDelay: `${i * 0.6}s` }} />)}
        <path d="M0 500 L70 318 L128 372 L196 236 L250 300 L318 188 L400 290 L400 500Z" className="mt__ridge" />
        <path d="M0 500 L150 286 L196 326 L266 104 L300 166 L330 140 L400 318 L400 500Z" fill="url(#mt-rock)" className="mt__mass" />
        <path d="M266 104 L244 164 L258 154 L268 172 L283 150 L292 160Z" className="mt__snow" />
        <path d="M330 140 L318 166 L328 160 L338 168Z" className="mt__snow" />
      </>)}

      <path d={trail} className="mt__trail" />
      <motion.path d={trail} className="mt__walked" style={{ pathLength: pos }} />

      {/* summit flag */}
      <g transform={`translate(${top[0]} ${top[1]})`} className={`mt__flag${reached >= geo.camps.length - 1 ? ' is-up' : ''}`}>
        <path d={phone ? 'M0 0 V-14' : 'M0 0 V-30'} className="mt__pole" />
        <path d={phone ? 'M0 -14 L12 -10 L0 -6Z' : 'M0 -30 L22 -23 L0 -16Z'} className="mt__cloth" />
      </g>

      {geo.camps.map((v, i) => {
        const [x, y] = geo.pts[v]
        const [dx, dy, anchor] = geo.lab?.[i] || [14, 4, 'start']
        return (
          <g key={i} className={`mt__camp${i <= reached ? ' is-on' : ''}${i === reached ? ' is-cur' : ''}`} onClick={() => onPick(i)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(i) } }} aria-label={`${names[i]} · ${years[i]}`}>
            <circle cx={x} cy={y} r={phone ? 10 : 16} className="mt__hit" />
            <circle cx={x} cy={y} r={phone ? 4 : 6.5} className="mt__dot" />
            {!phone && (
              <text x={x + dx} y={y + dy} textAnchor={anchor} className="mt__label">
                <tspan className="mt__name">{names[i]}</tspan><tspan dx="6" className="mt__yr">{years[i]}</tspan>
              </text>
            )}
          </g>
        )
      })}

      {/* the climber */}
      <motion.g style={{ x: cx, y: cy }} className="mt__me" aria-hidden="true">
        <circle r={phone ? 9 : 13} className="mt__halo" />
        <circle r={phone ? 5 : 7} className="mt__body" />
      </motion.g>
    </svg>
  )
}

export const Experience = () => {
  const { t } = useTranslation()
  const all = t('exp.items', { returnObjects: true })
  const ui = t('exp.ui', { returnObjects: true })
  const items = ORDER.map(i => ({ ...all[i], tech: EXP_TECH[i] || [] }))
  const phone = usePhone()
  const geo = phone ? GEO.phone : GEO.desk
  const list = useRef(null)
  const [reached, setReached] = useState(0)

  // camp positions along the trail (0 → 1), so the climber stops exactly at each camp
  const cum = lengths(geo.pts)
  const campF = geo.camps.map(v => cum[v] / cum[cum.length - 1])

  const raw = useMotionValue(0)
  const pos = useSpring(raw, SPRING)
  const { scrollY } = useScroll()

  // card k is "reached" once its top passes 55% of the viewport;
  // while reading it, the climber walks the trail from its camp towards the next one
  const update = () => {
    const cards = list.current?.querySelectorAll('.mt__card')
    if (!cards?.length) return
    const line = window.innerHeight * 0.55
    let k = 0, f = 0
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect()
      if (r.top < line) { k = i; f = Math.max(0, Math.min(1, (line - r.top) / Math.max(1, r.height))) }
    })
    const next = Math.min(k + 1, campF.length - 1)
    raw.set(k === campF.length - 1 ? campF[k] : campF[k] + (campF[next] - campF[k]) * f)
    setReached(k)
  }
  useMotionValueEvent(scrollY, 'change', update)
  useEffect(() => { update() }, [phone]) // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (i) => {
    const card = list.current?.querySelectorAll('.mt__card')[i]
    if (!card) return
    const y = card.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3
    window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  const kicker = (i) => KIND[i] === 'base' ? ui.base : KIND[i] === 'summit' ? ui.summit : KIND[i] === 'side' ? ui.side : t('exp.ui.camp', { n: i + 1 })
  const short = (c) => c.replace(' Technology', '').replace(' Maroc', '')

  return (
    <section className="section" id="experience">
      <div className="wrap">
        <Head n="02" kicker={t('exp.kicker')} title={t('exp.title')} sub={ui.sub} />
        <div className="mt">
          <div className="mt__side">
            <div className="mt__frame">
              <Mountain geo={geo} phone={phone} pos={pos} reached={reached} onPick={goTo}
                names={items.map(it => short(it.company))}
                years={items.map((it, i) => (KIND[i] === 'summit' ? ui.now : (it.date.match(/\d{4}/) || [''])[0]))} />
              {phone && <p className="mt__now"><b>{kicker(reached)}</b> · {items[reached].company}</p>}
            </div>
          </div>

          <ol className="mt__list" ref={list}>
            {items.map((it, i) => {
              const s = span(it, ui.now)
              return (
                <li key={it.company} className={`mt__card mt__card--${KIND[i]}${i <= reached ? ' is-on' : ''}${i === reached ? ' is-cur' : ''}`}>
                  <Reveal className="card mt__inner">
                    <span className="mt__kick"><i />{kicker(i)}<span className="mt__when mono">{s.from}{s.to ? ` → ${s.to}` : ''}</span></span>
                    <h3 className="mt__co">{it.company}</h3>
                    <p className="mt__role">{it.role} <span className="mt__ty">· {it.type}</span></p>
                    <ul className="mt__bul">{it.bullets.map(b => <li key={b}>{b}</li>)}</ul>
                    <div className="tags tags--sm">{it.tech.map(x => <span key={x} className="tag">{x}</span>)}</div>
                  </Reveal>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

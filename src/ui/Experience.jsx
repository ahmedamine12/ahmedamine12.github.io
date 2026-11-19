import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Head, Reveal, SPRING } from './kit'
import { EXP_TECH } from '../data'

/*
  Journey = the About thread, continued, driven by scrolling only (nothing to discover, nothing hidden).
  - Every role is a card on a vertical thread, newest first. Reading = scrolling.
  - The knob rides the thread with your scroll; stations light up as you reach them.
  - Wide screens: a sticky panel rolls the years like an odometer to the role you are reading.
*/

const Digit = ({ d }) => {
  const y = useSpring(-d * 10, SPRING)
  useEffect(() => { y.set(-d * 10) }, [d, y])
  const ty = useTransform(y, v => `${v}%`)
  return (
    <span className="odo__d" aria-hidden="true">
      <motion.span className="odo__col" style={{ y: ty }}>{'0123456789'.split('').map(n => <span key={n}>{n}</span>)}</motion.span>
    </span>
  )
}
const Odometer = ({ value }) => (
  <span className="odo" aria-label={String(value)}>{String(value).padStart(4, '0').split('').map((c, i) => <Digit key={i} d={Number(c)} />)}</span>
)

const span = (it, now) => {
  const [from, to] = it.date.split('—').map(s => s.trim())
  return { from, to: to ? (/present|aujourd/i.test(to) ? now : to) : null, year: Number((from.match(/\d{4}/) || [0])[0]) }
}

export const Experience = () => {
  const { t } = useTranslation()
  const items = t('exp.items', { returnObjects: true })
  const ui = t('exp.ui', { returnObjects: true })
  const list = useRef(null)
  const [cur, setCur] = useState(0)

  const { scrollYProgress } = useScroll({ target: list, offset: ['start 0.6', 'end 0.6'] })
  const prog = useSpring(scrollYProgress, SPRING)
  const knobTop = useTransform(prog, v => `${Math.max(0, Math.min(1, v)) * 100}%`)

  // the role you are reading = the last card whose top has crossed 60% of the viewport
  const pick = () => {
    const cards = list.current?.querySelectorAll('.jx__item')
    if (!cards) return
    let k = 0
    cards.forEach((c, i) => { if (c.getBoundingClientRect().top < window.innerHeight * 0.6) k = i })
    setCur(k)
  }
  useMotionValueEvent(scrollYProgress, 'change', pick)
  useEffect(pick, [])

  const c = span(items[cur], ui.now)

  return (
    <section className="section" id="experience">
      <div className="wrap">
        <Head n="02" kicker={t('exp.kicker')} title={t('exp.title')} />
        <div className="jx">
          <aside className="jx__side" aria-hidden="true">
            <div className="surface jx__panel">
              <span className="jx__count mono">{String(cur + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
              <div className="jx__years"><Odometer value={c.year} /></div>
              <p className="jx__to mono">{c.to ? `→ ${c.to}` : ' '}</p>
              <p className="jx__co">{items[cur].company}</p>
              <p className="jx__ty">{items[cur].type}</p>
              <span className="hint jx__hint">{ui.hint}</span>
            </div>
          </aside>

          <div className="jx__list" ref={list}>
            <span className="jx__line" aria-hidden="true"><motion.i style={{ scaleY: prog }} /></span>
            <motion.span className="knob jx__knob" style={{ top: knobTop }} aria-hidden="true" />
            <ol className="jx__ol">
            {items.map((it, i) => {
              const s = span(it, ui.now)
              return (
                <li key={it.company} className={`jx__item${i <= cur ? ' is-past' : ''}${i === cur ? ' is-cur' : ''}`}>
                  <i className="jx__dot" aria-hidden="true" />
                  <Reveal className="card jx__card">
                    <div className="jx__top">
                      <span className="jx__logo">{it.company[0]}</span>
                      <div className="jx__who">
                        <h3>{it.company}</h3>
                        <p><span className="jx__type">{it.type}</span><span className="mono">{s.from}{s.to ? ` → ${s.to}` : ''}</span></p>
                      </div>
                    </div>
                    <p className="jx__role">{it.role}</p>
                    <ul className="jx__bul">{it.bullets.map(b => <li key={b}>{b}</li>)}</ul>
                    <div className="tags tags--sm">{(EXP_TECH[i] || []).map(x => <span key={x} className="tag">{x}</span>)}</div>
                  </Reveal>
                </li>
              )
            })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

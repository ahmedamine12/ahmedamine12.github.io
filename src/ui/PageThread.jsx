import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useScroll, useMotionValueEvent, useSpring } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { SPRING } from './kit'

/*
  The page thread: the About thread runs down the whole page (wide screens only).
  One node per numbered section; the gradient fills as you read, the node you are in carries the knob.
  It ties the sections together as one path, and doubles as quiet wayfinding (click a node to go there).
*/
const SECTIONS = [['about', 'about.kicker'], ['experience', 'exp.kicker'], ['work', 'work.kicker'], ['skills', 'skills.kicker'],
  ['stage', 'stage.kicker'], ['beyond', 'more.kicker'], ['contact', 'contact.kicker']]

export const PageThread = () => {
  const { t } = useTranslation()
  const { scrollY } = useScroll()
  const raw = useMotionValue(0)                  // 0 … SECTIONS.length - 1, continuous
  const p = useSpring(raw, SPRING)
  const [cur, setCur] = useState(-1)
  const tops = useRef([])

  useEffect(() => {
    const measure = () => {
      tops.current = SECTIONS.map(([id]) => {
        const el = document.getElementById(id)
        return el ? el.getBoundingClientRect().top + window.scrollY : Infinity
      })
    }
    measure()
    const ro = new ResizeObserver(measure); ro.observe(document.body)
    return () => ro.disconnect()
  }, [])

  const update = (y) => {
    const T = tops.current, mid = y + window.innerHeight * 0.45
    if (!T.length) return
    let i = -1
    for (let k = 0; k < T.length; k++) if (mid >= T[k]) i = k
    if (i < 0) { raw.set(0); setCur(-1); return }
    const next = T[i + 1] ?? document.documentElement.scrollHeight
    const frac = i < T.length - 1 ? Math.min(1, (mid - T[i]) / Math.max(1, next - T[i])) : 0
    raw.set(i + frac)
    setCur(i)
  }
  useMotionValueEvent(scrollY, 'change', update)
  useEffect(() => { update(window.scrollY) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const n = SECTIONS.length
  const fill = useSpring(useMotionValue(0), SPRING)
  useMotionValueEvent(p, 'change', v => fill.set(Math.max(0, Math.min(1, v / (n - 1)))))
  const knobTop = useMotionValue('0%')
  useMotionValueEvent(p, 'change', v => knobTop.set(`${(Math.max(0, Math.min(n - 1, v)) / (n - 1)) * 100}%`))

  return (
    <nav className={`pth${cur >= 0 ? ' is-on' : ''}`} aria-label={t('meta.progress')}>
      <span className="pth__line"><motion.i style={{ scaleY: fill }} /></span>
      {SECTIONS.map(([id, key], k) => (
        <a key={id} href={`#${id}`} className={`pth__node${k <= cur ? ' is-past' : ''}${k === cur ? ' is-cur' : ''}`} style={{ top: `${(k / (n - 1)) * 100}%` }}
          aria-current={k === cur ? 'true' : undefined}>
          <i /><span className="pth__label"><b className="mono">{String(k + 1).padStart(2, '0')}</b>{t(key)}</span>
        </a>
      ))}
      <motion.span className="knob pth__knob" style={{ top: knobTop }} aria-hidden="true" />
    </nav>
  )
}

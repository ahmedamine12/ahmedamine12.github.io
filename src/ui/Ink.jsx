import React, { useEffect, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion'

/*
  Handwriting effect.
  Two layers of the same text: a thin outline (the pen stroke) and the ink fill.
  A soft-edged mask sweeps in the writing direction; the fill trails the stroke
  slightly, like ink settling behind a nib. RTL scripts sweep right to left.
*/
const sweep = (pos, rtl, soft = 9) =>
  `linear-gradient(${rtl ? 270 : 90}deg, #000 ${pos}%, transparent ${pos + soft}%)`

const EASE = [0.45, 0.05, 0.3, 1] // starts gently like a pen landing, slows at the end

export const Ink = ({
  text, rtl = false, duration, delay = 0, play = true, className = '', onDone, fillClass = '',
}) => {
  const p = useMotionValue(0)
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dur = duration ?? Math.min(2.4, Math.max(1.15, [...text].length * 0.2))
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    if (!play) return
    if (reduce) { p.set(1); const id = setTimeout(() => done.current?.(), 500); return () => clearTimeout(id) }
    const c = animate(p, 1, { duration: dur, delay, ease: EASE, onComplete: () => done.current?.() })
    return () => c.stop()
  }, [play, dur, delay, p, reduce])

  const strokeMask = useTransform(p, v => sweep(v * 125 - 12, rtl))
  const fillMask = useTransform(p, v => sweep(v * 150 - 45, rtl, 16))

  return (
    <span className={`ink ${rtl ? 'ink--rtl' : ''} ${className}`} dir={rtl ? 'rtl' : 'ltr'} aria-label={text} role="img">
      <motion.span aria-hidden="true" className="ink__stroke" style={{ WebkitMaskImage: strokeMask, maskImage: strokeMask }}>{text}</motion.span>
      <motion.span aria-hidden="true" className={`ink__fill ${fillClass}`} style={{ WebkitMaskImage: fillMask, maskImage: fillMask }}>{text}</motion.span>
    </span>
  )
}

/* Writes itself the first time it scrolls into view. */
export const InkOnView = (props) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  return <span ref={ref} style={{ display: 'inline-block' }}><Ink {...props} play={inView} /></span>
}

/* A hand-drawn stroke (underline, arrow…) that draws itself. */
export const Scribble = ({ d, viewBox = '0 0 200 12', className = '', delay = 0, duration = 0.7, play = true, ...rest }) => (
  <svg className={`scribble ${className}`} viewBox={viewBox} preserveAspectRatio="none" fill="none" aria-hidden="true" {...rest}>
    <motion.path d={d} stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }} animate={play ? { pathLength: 1, opacity: 1 } : {}}
      transition={{ pathLength: { duration, delay, ease: EASE }, opacity: { duration: 0.01, delay } }} />
  </svg>
)

/* Wait for the handwriting fonts so the first stroke never flashes in a fallback face. */
export const fontsReady = (timeout = 1600) => {
  if (!document.fonts?.load) return Promise.resolve()
  const want = Promise.all([
    document.fonts.load('64px "Great Vibes"'),
    document.fonts.load('64px "Aref Ruqaa"', 'مرحبا'),
  ]).catch(() => {})
  return Promise.race([want, new Promise(r => setTimeout(r, timeout))])
}

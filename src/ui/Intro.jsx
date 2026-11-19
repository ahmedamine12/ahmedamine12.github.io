import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { SPRING } from './kit'
import { Ink, fontsReady } from './Ink'

/*
  Handwritten welcome: Hello → Bonjour → مرحبا, then the signature.
  The signature then glides (shared layout) into the corner and becomes the logo.
  Skippable at any instant (agency); calm pacing, nothing technical.
*/
const SIG_SPRING = { type: 'spring', stiffness: 158, damping: 25 } // ζ≈1, response≈0.5s: a calm reposition

export const Intro = ({ onDone, mode = 'full' }) => {
  const short = mode === 'short'
  const { t } = useTranslation()
  const greetings = t('intro.greetings', { returnObjects: true })
  const [ready, setReady] = useState(false)
  const [step, setStep] = useState(() => (short ? Infinity : 0)) // 0..n-1 greetings, then the signature
  const [role, setRole] = useState(false)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => { let alive = true; fontsReady().then(() => alive && setReady(true)); return () => { alive = false } }, [])
  useEffect(() => {
    const skip = (e) => { if (e.key === 'Tab') return; done.current() }
    window.addEventListener('keydown', skip)
    return () => window.removeEventListener('keydown', skip)
  }, [])

  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms))

  const isArabic = (w) => /[؀-ۿ]/.test(w)
  const sigStep = step >= greetings.length

  return (
    <motion.div className="intro" onClick={() => done.current()}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }}>
      <div className="intro__stage">
        <AnimatePresence initial={false}>
          {ready && !sigStep && (
            <motion.div key={step} className="intro__word"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.38, ease: [0.4, 0, 1, 1] } }}>
              <Ink text={greetings[step]} rtl={isArabic(greetings[step])} duration={step === 0 ? 0.9 : 0.6}
                className={isArabic(greetings[step]) ? 'ink--ar' : 'ink--hello'} fillClass="ink__fill--grad"
                onDone={() => later(step === 0 ? 200 : 90, () => setStep(s => s + 1))} />
            </motion.div>
          )}
          {ready && sigStep && (
            <motion.div key="sig" className="intro__sig" initial={{ opacity: 1 }}>
              <motion.div layoutId="signature" transition={SIG_SPRING} className="sig-box">
                <Ink text={t('intro.signature')} duration={short ? 1.0 : 1.15} className="ink--sig"
                  onDone={() => { setRole(true); later(short ? 280 : 350, () => done.current()) }} />
              </motion.div>
              <motion.p className="intro__role" initial={{ opacity: 0, y: 8 }} animate={role ? { opacity: 1, y: 0 } : {}} transition={SPRING}>
                {t('intro.role')}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <motion.button className="intro__skip" onClick={(e) => { e.stopPropagation(); done.current() }}
        initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.8 } }} whileTap={{ scale: 0.95 }}>
        {t('intro.skip')}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
      </motion.button>
      {!short && <div className="intro__progress" aria-hidden="true">
        {[...greetings, 'sig'].map((_, i) => <i key={i} className={i < Math.min(step, greetings.length) ? 'is-done' : i === Math.min(step, greetings.length) ? 'is-on' : ''} />)}
      </div>}
    </motion.div>
  )
}

/* The signature, resting in the corner as the site's logo. */
export const Brand = ({ fromIntro }) => {
  const { t } = useTranslation()
  return (
    <div className="brand-bar">
      <motion.a href="#top" className="brand" aria-label={t('nav.home')}
        layoutId={fromIntro ? 'signature' : undefined} transition={SIG_SPRING}
        initial={fromIntro ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <span className="brand__sig">{t('intro.signature')}</span>
      </motion.a>
    </div>
  )
}

/* Aurora: three soft light sources that lean toward the pointer (springs, no loops). */
export const Aurora = () => {
  const mx = useMotionValue(0.5), my = useMotionValue(0.3)
  const sx = useSpring(mx, { stiffness: 40, damping: 18 }), sy = useSpring(my, { stiffness: 40, damping: 18 })
  const ax = useTransform(sx, v => `${(v - 0.5) * 120}px`), ay = useTransform(sy, v => `${(v - 0.5) * 90}px`)
  const bx = useTransform(sx, v => `${(0.5 - v) * 90}px`), by = useTransform(sy, v => `${(0.5 - v) * 70}px`)
  const gx = useTransform(sx, v => `${v * 100}%`), gy = useTransform(sy, v => `${v * 100}%`)
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const move = (e) => { mx.set(e.clientX / window.innerWidth); my.set(e.clientY / window.innerHeight) }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [mx, my])
  return (
    <div className="aurora" aria-hidden="true">
      <motion.div className="aurora__a" style={{ x: ax, y: ay }} />
      <motion.div className="aurora__b" style={{ x: bx, y: by }} />
      <div className="aurora__c" />
      <motion.div className="aurora__spot" style={{ '--gx': gx, '--gy': gy }} />
      <div className="aurora__grid" />
      <div className="aurora__grain" />
    </div>
  )
}

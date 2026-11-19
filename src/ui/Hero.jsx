import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import ME from '../assets/proPic.webp'
import STAGE from '../assets/talks/portrait-stage.webp'
import { Icon, Magnetic, SPRING, casaHour, useCasaTime } from './kit'
import { Scribble } from './Ink'
import { useFlip } from './Flip'

const greetingKey = () => {
  const h = casaHour()
  if (h >= 5 && h < 12) return 'hero.greeting_morning'
  if (h >= 12 && h < 18) return 'hero.greeting_afternoon'
  if (h >= 18 && h < 23) return 'hero.greeting_evening'
  return 'hero.greeting_night'
}

/* Letters rise in one by one; once settled, the line becomes plain text again
   (so the animated gradient can run across the whole word). */
const Letters = ({ text, delay = 0, className, gradient }) => {
  const [done, setDone] = useState(false)
  const chars = [...text]
  if (done) return <span className={className}>{text}</span>
  return (
    <span className={className.replace('grad-text', '')} aria-label={text}>
      {chars.map((ch, i) => (
        <motion.span key={i} aria-hidden="true" className={`ch${gradient ? ' ch--grad' : ''}`}
          style={gradient ? { backgroundSize: `${chars.length * 100}% 100%`, backgroundPosition: `${(i / Math.max(1, chars.length - 1)) * 100}% 0` } : undefined}
          initial={{ opacity: 0, y: '0.6em', rotateX: -70 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          onAnimationComplete={i === chars.length - 1 ? () => setDone(true) : undefined}
          transition={{ ...SPRING, delay: delay + i * 0.028 }}>
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  )
}

const Rotator = ({ words }) => {
  const [i, setI] = useState(0)
  useEffect(() => { const id = setInterval(() => setI(n => (n + 1) % words.length), 2400); return () => clearInterval(id) }, [words.length])
  return (
    <motion.span className="rotator" layout transition={SPRING}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={words[i]} className="rotator__w"
          initial={{ y: '90%', opacity: 0, filter: 'blur(6px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-90%', opacity: 0, filter: 'blur(6px)' }} transition={SPRING}>
          {words[i]}
          <Scribble className="rotator__line" d="M3 8.5C38 4.2 82 3.4 122 4.6c26 .8 50 2.4 75 4.4" delay={0.25} duration={0.6} />
        </motion.span>
      </AnimatePresence>
    </motion.span>
  )
}

/*
  Two-sided portrait: the professional photo on the front, on stage on the back.
  Click / tap turns it over (rotation spring); drag throws it and it springs home.
*/
const TWIST = (() => { const k = Math.pow(2 * Math.PI / 0.5, 2); return { type: 'spring', stiffness: k, damping: 2 * 0.8 * Math.sqrt(k) } })()

const Portrait = ({ hint, frontTag, backTag, chips = [] }) => {
  const px = useMotionValue(0), py = useMotionValue(0)
  const sx = useSpring(px, SPRING), sy = useSpring(py, SPRING)
  const tiltX = useTransform(sy, [-1, 1], [8, -8]), tiltY = useTransform(sx, [-1, 1], [-10, 10])
  const r = useMotionValue(0)
  const rotY = useTransform([r, tiltY], ([a, b]) => a + b)
  const l1x = useTransform(sx, v => v * 18), l1y = useTransform(sy, v => v * 18)
  const l2x = useTransform(sx, v => v * -26), l2y = useTransform(sy, v => v * -22)
  const glare = useTransform([sx, sy], ([x, y]) => `radial-gradient(circle at ${50 + x * 40}% ${50 + y * 40}%, rgba(255,255,255,.35), transparent 55%)`)
  const facing = v => { const a = ((v % 360) + 360) % 360; return a < 90 || a > 270 }
  const frontOn = useTransform(r, v => (facing(v) ? 1 : 0))
  const backOn = useTransform(r, v => (facing(v) ? 0 : 1))
  const [turned, setTurned] = useState(false)
  const dragged = useRef(false)
  const anim = useRef(null)

  const settle = (target, velocity = 0) => {
    anim.current?.stop()
    anim.current = animate(r, target, { ...TWIST, velocity })
    setTurned(true)
  }
  const nearest = (v) => Math.round(v / 180) * 180

  return (
    <div className="portrait" onPointerMove={(e) => {
      if (e.pointerType !== 'mouse') return
      const rc = e.currentTarget.getBoundingClientRect()
      px.set(((e.clientX - rc.left) / rc.width) * 2 - 1); py.set(((e.clientY - rc.top) / rc.height) * 2 - 1)
    }} onPointerLeave={() => { px.set(0); py.set(0) }}>
      <div className="portrait__halo" />
      {chips.map((c, i) => (
        <motion.span key={c} className={`chip-float c${i + 1}`} style={i % 2 ? { x: l2x, y: l2y } : { x: l1x, y: l1y }}
          initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 247, damping: 25, delay: 0.9 + i * 0.07 }}>
          {c}
        </motion.span>
      ))}
      <motion.div className="portrait__card" role="button" tabIndex={0} aria-label={hint}
        style={{ rotateX: tiltX, rotateY: rotY, transformPerspective: 1100 }}
        initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ...SPRING, delay: 0.35 }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); settle(nearest(r.get()) + 180) } }}
        drag dragSnapToOrigin dragElastic={0.32} dragTransition={{ bounceStiffness: 240, bounceDamping: 16 }}
        whileDrag={{ scale: 1.04, cursor: 'grabbing' }}
        onPointerDown={() => { dragged.current = false }}
        onDragStart={() => { dragged.current = true; setTurned(true) }}
        onTap={() => { if (!dragged.current) settle(nearest(r.get()) + 180) }}>
        <motion.div className="face face--front" style={{ opacity: frontOn }}>
          <img src={ME} alt="Ahmed Amine Bouricha" draggable="false" />
          <motion.div className="portrait__glare" style={{ background: glare }} />
          <div className="portrait__tag"><span className="live-dot" />{frontTag}</div>
        </motion.div>
        <motion.div className="face face--back" style={{ opacity: backOn }}>
          <img src={STAGE} alt={backTag} draggable="false" />
          <div className="portrait__tag"><span className="rec" />{backTag}</div>
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {!turned && (
          <motion.span className="portrait__hint" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.6 } }} exit={{ opacity: 0, y: 6 }}>
            <svg width="34" height="22" viewBox="0 0 34 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 20C8 8 18 3 30 4" /><path d="m25 1 5 3-4 4" /></svg>
            {hint}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export const Hero = () => {
  const { open } = useFlip()
  const { t } = useTranslation()
  const time = useCasaTime()
  const words = t('hero.words', { returnObjects: true })
  return (
    <section className="hero" id="top">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <motion.p className="hero__hello" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
            <span className="mono">{t(greetingKey())}</span><span className="hero__sep">/</span><span className="mono dim">{t('hero.here', { time })}</span>
          </motion.p>
          <h1 className="hero__name">
            <motion.span className="hero__hi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>{t('hero.hi')}</motion.span>
            <Letters text={t('hero.name_a')} delay={0.15} className="hero__line grad-text" gradient />
            <Letters text={t('hero.name_b')} delay={0.45} className="hero__line hero__line--b" />
          </h1>
          <motion.p className="hero__build" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.8 }}>
            {t('hero.build')} <Rotator words={words} />
          </motion.p>
          <motion.p className="hero__sub" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.9 }}>{t('hero.sub')}</motion.p>
          <motion.div className="hero__cta" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 1 }}>
            <Magnetic as="button" onClick={open} className="btn btn--primary"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></svg>{t('hero.cta_cv')}</Magnetic>
            <Magnetic href="#work" className="btn btn--glass">{t('hero.cta_work')}<Icon name="arrow" size={18} /></Magnetic>
          </motion.div>
          <motion.div className="hero__status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <span className="live-dot" />{t('hero.status')}
          </motion.div>
        </div>
        <Portrait hint={t('hero.drag')} frontTag={t('hero.front_tag')} backTag={t('hero.back_tag')} chips={t('hero.chips', { returnObjects: true })} />
      </div>
      <a href="#about" className="scroll-cue" aria-label={t('hero.scroll')}><span className="scroll-cue__wheel" /></a>
    </section>
  )
}

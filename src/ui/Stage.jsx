import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useMotionValue } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Head, Icon, SNAPPY, SPRING, project, useFinePointer } from './kit'
import cursor from '../assets/talks/stage-cursor.webp'
import podium from '../assets/talks/stage-podium.webp'
import campus from '../assets/talks/stage-campus.webp'
import opening from '../assets/talks/stage-opening.webp'

/*
  "Presenter mode": the speaking section behaves like a keynote presenter view.
  Real talk photos become designed slides; the visitor drives the talk
  (arrows, buttons, swipe with momentum projection), with a laser pointer,
  speaker notes, a running timer and a slide navigator.
*/
const SLIDES = [
  { key: 'cursor', img: cursor, layout: 'full', tone: '#0b0f1a' },
  { key: 'podium', img: podium, layout: 'split', tone: '#1a0f0d' },
  { key: 'campus', img: campus, layout: 'split-r', tone: '#0d1715' },
  { key: 'opening', img: opening, layout: 'split', tone: '#0f1020' },
]
const PUSH = { type: 'spring', stiffness: 300, damping: 34 } // ζ≈1, response≈0.36s

const Slide = ({ s, t, n, total }) => {
  const c = t(`stage.slides.${s.key}`, { returnObjects: true })
  return (
    <div className={`slide slide--${s.layout}`} style={{ '--tone': s.tone }}>
      <div className="slide__img"><img src={s.img} alt={c.title} draggable="false" /></div>
      <div className="slide__text">
        <span className="slide__eyebrow">{c.eyebrow}</span>
        <h3 className="slide__title">{c.title}</h3>
        <p className="slide__sub">{c.sub}</p>
      </div>
      <div className="slide__foot"><span className="slide__sig">Ahmed Amine</span><span>{n} / {total}</span></div>
    </div>
  )
}

const EndSlide = ({ t }) => (
  <div className="slide slide--end">
    <span className="slide__eyebrow">Q&amp;A</span>
    <h3 className="slide__title">{t('stage.end_title')}</h3>
    <a href="#contact" className="btn btn--primary btn--sm slide__cta" onPointerDown={e => e.stopPropagation()}>{t('stage.end_cta')}<Icon name="arrow" size={16} /></a>
  </div>
)

const Notes = ({ text }) => (
  <p className="notes__text">
    {text.split(' ').map((w, i) => (
      <motion.span key={i} initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ ...SPRING, delay: 0.15 + i * 0.045 }}>{w} </motion.span>
    ))}
  </p>
)

export const Stage = () => {
  const { t } = useTranslation()
  const fine = useFinePointer()
  const total = SLIDES.length
  const [i, setI] = useState(0)            // i === total → end slide
  const dir = useRef(1)
  const wrap = useRef(null)
  const screen = useRef(null)
  const inView = useInView(wrap, { margin: '-25% 0px' })
  const [secs, setSecs] = useState(0)
  const lx = useMotionValue(-100), ly = useMotionValue(-100)
  const [laser, setLaser] = useState(false)

  const go = useCallback((n) => {
    const next = Math.max(0, Math.min(total, n))
    setI(cur => { dir.current = next >= cur ? 1 : -1; return next })
  }, [total])

  // timer runs while the talk is on screen
  useEffect(() => {
    if (!inView) return
    const id = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [inView])

  // arrow keys drive the talk, only while it is on screen
  useEffect(() => {
    if (!inView) return
    const onKey = (e) => {
      if (document.querySelector('.sheet-layer') || /input|textarea/i.test(document.activeElement?.tagName || '')) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(i + 1) }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(i - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inView, i, go])

  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0')
  const next = i + 1 < total ? SLIDES[i + 1] : null
  const note = i < total ? t(`stage.slides.${SLIDES[i].key}.note`) : t('stage.end_note')

  return (
    <section className="section" id="stage" ref={wrap}>
      <div className="wrap">
        <Head n="05" kicker={t('stage.kicker')} title={t('stage.title')} sub={t('stage.sub')} />
        <div className="presenter">
          <div className="presenter__main">
            <div className="screen" ref={screen}
              onPointerMove={(e) => {
                if (e.pointerType !== 'mouse') return
                const r = e.currentTarget.getBoundingClientRect()
                lx.set(e.clientX - r.left); ly.set(e.clientY - r.top)   // 1:1, no lag: it is a pointer
              }}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setLaser(true)}
              onPointerLeave={() => setLaser(false)}>
              <AnimatePresence initial={false} custom={dir.current} mode="popLayout">
                <motion.div key={i} className="screen__slide" custom={dir.current}
                  variants={{
                    enter: d => ({ x: `${d * 100}%`, opacity: 0.4 }),
                    center: { x: 0, opacity: 1 },
                    exit: d => ({ x: `${d * -100}%`, opacity: 0.4 }),
                  }}
                  initial="enter" animate="center" exit="exit" transition={PUSH}
                  drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={{ left: i === total ? 0.12 : 0.5, right: i === 0 ? 0.12 : 0.5 }}
                  onDragEnd={(e, info) => {
                    const w = screen.current?.offsetWidth || 600
                    const landing = info.offset.x + project(info.velocity.x)
                    if (landing < -w * 0.22) go(i + 1)
                    else if (landing > w * 0.22) go(i - 1)
                  }}>
                  {i < total ? <Slide s={SLIDES[i]} t={t} n={i + 1} total={total} /> : <EndSlide t={t} />}
                </motion.div>
              </AnimatePresence>
              {fine && laser && <motion.span className="laser" style={{ x: lx, y: ly }} aria-hidden="true" />}
            </div>

            <div className="navigator" role="tablist" aria-label={t('stage.kicker')}>
              {SLIDES.map((s, n) => (
                <button key={s.key} role="tab" aria-selected={n === i} className={`nav-thumb${n === i ? ' is-on' : ''}`} onClick={() => go(n)}
                  aria-label={t(`stage.slides.${s.key}.title`)}>
                  <img src={s.img} alt="" />
                  {n === i && <motion.span layoutId="thumb-ring" className="nav-thumb__ring" transition={SNAPPY} />}
                </button>
              ))}
              <button className={`nav-thumb nav-thumb--end${i === total ? ' is-on' : ''}`} onClick={() => go(total)} aria-label="Q&A">
                <span>Q&amp;A</span>
                {i === total && <motion.span layoutId="thumb-ring" className="nav-thumb__ring" transition={SNAPPY} />}
              </button>
            </div>
          </div>

          <aside className="presenter__side">
            <div className="side__row">
              <span className="side__timer mono"><span className="rec" />{mm}:{ss}</span>
              <span className="mono dim">{Math.min(i + 1, total)} / {total}</span>
            </div>
            <div className="side__block side__next">
              <span className="side__label">{t('stage.next')}</span>
              <div className="next-thumb">
                {next ? <img src={next.img} alt="" /> : <span>{i < total ? 'Q&A' : t('stage.done')}</span>}
                {next && <span className="next-thumb__t">{t(`stage.slides.${next.key}.title`)}</span>}
              </div>
            </div>
            <div className="side__block notes">
              <span className="side__label">{t('stage.notes')}</span>
              <AnimatePresence mode="wait"><motion.div key={i} exit={{ opacity: 0, transition: { duration: 0.15 } }}><Notes text={note} /></motion.div></AnimatePresence>
            </div>
            <div className="side__controls">
              <motion.button className="ctrl" onClick={() => go(i - 1)} disabled={i === 0} whileTap={{ scale: 0.92 }} aria-label={t('stage.prev')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
              </motion.button>
              <motion.button className="ctrl ctrl--next" onClick={() => go(i + 1)} disabled={i === total} whileTap={{ scale: 0.92 }} aria-label={t('stage.next_btn')}>
                {t('stage.next_btn')}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
              </motion.button>
            </div>
            <p className="side__hint">{t('stage.hint')}</p>
          </aside>
        </div>
      </div>
    </section>
  )
}

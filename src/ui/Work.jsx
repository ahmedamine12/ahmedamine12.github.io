import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Head, Icon, Reveal, SHEET, SPRING, Tilt, project } from './kit'
import { WORK } from '../data'
import { IdpDemo } from './IdpDemo'
import { Archive } from './Archive'

const Badge = ({ w, t }) => w.badge ? <span className="badge">{t(`work.${w.badge}`)}</span> : null

const Card = ({ w, onOpen, t }) => {
  const it = t(`work.items.${w.id}`, { returnObjects: true })
  return (
    <Tilt max={4} className={`work-card card${w.size === 'lg' ? ' work-card--lg' : ''}`} style={{ '--tone': w.tone }}>
      <button className="work-card__hit" onClick={onOpen} aria-label={`${t('work.open')}: ${it.title}`} />
      <motion.div layoutId={`media-${w.id}`} className="work-card__media" transition={SHEET}>
        <img src={w.img} alt="" loading="lazy" />
      </motion.div>
      <div className="work-card__body">
        <div className="work-card__row"><span className="kind mono">{it.kind}</span><Badge w={w} t={t} /></div>
        <h3>{it.title}</h3>
        <p>{it.desc}</p>
        <div className="work-card__foot">
          <div className="tags tags--sm">{w.tech.slice(0, 4).map(x => <span key={x} className="tag">{x}</span>)}</div>
          <span className="open-ic"><Icon name="arrow" size={18} /></span>
        </div>
      </div>
    </Tilt>
  )
}

const Sheet = ({ w, onClose, t }) => {
  const it = t(`work.items.${w.id}`, { returnObjects: true })
  const controls = useDragControls()
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])
  return createPortal(
    <div className="sheet-layer" role="dialog" aria-modal="true" aria-label={it.title}>
      <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
      <motion.div className="sheet"
        drag="y" dragControls={controls} dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0.06, bottom: 0.85 }}
        onDragEnd={(e, info) => {
          // decide with the projected landing point, not the release point
          if (info.offset.y + project(info.velocity.y) > 220 || info.velocity.y > 900) onClose()
        }}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={SHEET}>
        <div className="sheet__grab" onPointerDown={(e) => controls.start(e)}>
          <span className="sheet__handle" aria-hidden="true" />
          <span className="sr-only">{t('work.grab')}</span>
        </div>
        <button className="sheet__close" onClick={onClose} aria-label={t('work.close')}><Icon name="close" size={18} /></button>
        <div className="sheet__scroll">
          <motion.div layoutId={`media-${w.id}`} className="sheet__media" style={{ background: w.tone }} transition={SHEET} onPointerDown={(e) => controls.start(e)}>
            <img src={w.img} alt={it.title} />
          </motion.div>
          <motion.div className="sheet__body" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ ...SPRING, delay: 0.08 }}>
            <div className="work-card__row"><span className="kind mono">{it.kind}</span><Badge w={w} t={t} /></div>
            <h3 className="sheet__title">{it.title}</h3>
            <p className="sheet__desc">{it.desc}</p>
            {w.id === 'idp' && (<>
              <h4 className="mini-h sheet__demo-h"><span className="live-dot" />{t('demo.kicker')} · {t('demo.title')}</h4>
              <IdpDemo embedded />
            </>)}
            <div className="sheet__cols">
              <div>
                <h4 className="mini-h">{t('work.highlights')}</h4>
                <ul className="checks">{it.points.map(p => <li key={p}><Icon name="check" size={16} stroke={2.4} />{p}</li>)}</ul>
              </div>
              <div>
                <h4 className="mini-h">{t('work.stack')}</h4>
                <div className="tags">{w.tech.map(x => <span key={x} className="tag">{x}</span>)}</div>
              </div>
            </div>
            {(w.live || w.github) && (
              <div className="sheet__links">
                {w.live && <a className="btn btn--primary" href={w.live} target="_blank" rel="noreferrer"><Icon name="ext" size={17} />{t('work.live')}</a>}
                {w.github && <a className="btn btn--glass" href={w.github} target="_blank" rel="noreferrer"><Icon name="code" size={17} />{t('work.github')}</a>}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

/* Desktop: the section pins and vertical scroll moves the projects sideways, 1:1 (never hijacked). */
const useRailMode = () => {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1001px)')
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const f = () => setOn(mq.matches && !rm.matches)
    f(); mq.addEventListener?.('change', f); rm.addEventListener?.('change', f)
    return () => { mq.removeEventListener?.('change', f); rm.removeEventListener?.('change', f) }
  }, [])
  return on
}

const Rail = ({ head, children, count }) => {
  const outer = useRef(null), track = useRef(null)
  const [dist, setDist] = useState(0)
  useLayoutEffect(() => {
    const measure = () => track.current && setDist(Math.max(0, track.current.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure); ro.observe(track.current)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])
  const { scrollYProgress } = useScroll({ target: outer, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, v => -v * dist)
  const idx = useTransform(scrollYProgress, v => String(Math.min(count, Math.floor(v * count) + 1)).padStart(2, '0'))
  return (
    <div ref={outer} className="rail" style={{ height: `calc(100vh + ${dist}px)` }}>
      <div className="rail__sticky">
        <div className="wrap rail__head">{head}
          <div className="rail__meter"><motion.span className="mono">{idx}</motion.span><span className="mono dim">/ {String(count).padStart(2, '0')}</span>
            <span className="rail__bar"><motion.i style={{ scaleX: scrollYProgress }} /></span></div>
        </div>
        <motion.div ref={track} className="rail__track" style={{ x }}>{children}</motion.div>
      </div>
    </div>
  )
}

export const Work = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(null)
  const more = t('work.more', { returnObjects: true })
  const cur = WORK.find(w => w.id === open)
  const rail = useRailMode()
  return (
    <section className="section" id="work">
        {rail ? (
          <Rail count={WORK.length} head={<Head n="03" kicker={t('work.kicker')} title={t('work.title')} sub={t('work.sub')} />}>
            {WORK.map(w => <div key={w.id} className="rail__item"><Card w={w} t={t} onOpen={() => setOpen(w.id)} /></div>)}
          </Rail>
        ) : (
          <div className="wrap">
            <Head n="03" kicker={t('work.kicker')} title={t('work.title')} sub={t('work.sub')} />
            <div className="work-grid">
              {WORK.map((w, i) => (
                <Reveal key={w.id} delay={(i % 2) * 0.06} className={w.size === 'lg' ? 'span-lg' : ''}>
                  <Card w={w} t={t} onOpen={() => setOpen(w.id)} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
        <div className="wrap">
        <Reveal className="older">
          <div className="older__head">
            <h3 className="older__h">{t('work.more_title')}</h3>
            <p className="older__sub">{t('work.more_sub')}</p>
          </div>
          <Archive items={more} labels={t('work.archive', { returnObjects: true })} />
        </Reveal>
      </div>
      <AnimatePresence>{cur && <Sheet key={cur.id} w={cur} t={t} onClose={() => setOpen(null)} />}</AnimatePresence>
    </section>
  )
}

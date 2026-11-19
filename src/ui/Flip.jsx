import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Icon, SPRING, project } from './kit'

/*
  "Turn the page": the live website shrinks into a sheet of paper and flips over;
  the résumé is printed on its back. The page can be grabbed and turned by hand.
   - shrink: critically damped spring (ζ 1, response 0.4)
   - flip: rotation spring (ζ 0.8, response 0.5), always started from the live value (interruptible)
   - drag: 1:1 rotation, release velocity → momentum projection → nearest side, velocity handed to the spring
*/
const k = (resp, ratio) => { const s = Math.pow(2 * Math.PI / resp, 2); return { type: 'spring', stiffness: s, damping: 2 * ratio * Math.sqrt(s) } }
const TURN = k(0.5, 0.8)
const CARD = 0.56

const Ctx = createContext({ open: () => {} })
export const useFlip = () => useContext(Ctx)

const rubber = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over))

export const FlipProvider = ({ children, outside, cvImg, cvPdf, cvName }) => {
  const { t } = useTranslation()
  const [mode, setMode] = useState(false)
  const page = useRef(null), inner = useRef(null)
  const saved = useRef(0)
  const anims = useRef([])
  const s = useMotionValue(1), r = useMotionValue(0)
  const backR = useTransform(r, v => v - 180)
  const scrim = useTransform(s, [1, CARD], [0, 1])
  // each side is shown only while it faces the viewer (some inner layers ignore backface-visibility)
  const facing = v => { const a = ((v % 360) + 360) % 360; return a < 90 || a > 270 }
  const frontOn = useTransform(r, v => (facing(v) ? 1 : 0))
  const backOn = useTransform(r, v => (facing(v) ? 0 : 1))
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const stopAll = () => { anims.current.forEach(a => a.stop()); anims.current = [] }
  const run = (mv, to, opts) => {
    if (reduce) { mv.set(to); opts.onComplete?.(); return { stop() {}, then: (f) => Promise.resolve().then(f) } }
    const a = animate(mv, to, opts); anims.current.push(a); return a
  }

  const open = useCallback(() => {
    if (mode) return
    saved.current = window.scrollY
    setMode(true)
  }, [mode])

  // detach the live page into a card showing exactly what was on screen
  useLayoutEffect(() => {
    if (!mode) return
    inner.current.style.transform = `translateY(${-saved.current}px)`
    document.documentElement.classList.add('flip-mode')
    stopAll()
    run(s, CARD, SPRING)
    const id = setTimeout(() => run(r, 180, TURN), reduce ? 0 : 230)
    return () => clearTimeout(id)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => {
    const el = page.current
    document.documentElement.classList.remove('flip-mode')
    inner.current.style.transform = ''
    setMode(false)
    requestAnimationFrame(() => {
      if (el) el.style.transform = ''
      window.scrollTo({ top: saved.current, behavior: 'instant' })
    })
  }, [])

  const close = useCallback(() => {
    stopAll()
    const a = run(r, 0, TURN)
    Promise.resolve(a).then(() => run(s, 1, { ...SPRING, onComplete: finish }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mode) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); stopAll(); run(r, r.get() > 90 ? 0 : 180, TURN) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, close]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- grab and turn the page by hand ----
  const drag = useRef(null)
  const onDown = (e) => {
    if (e.target.closest('button, a')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    stopAll()
    drag.current = { x: e.clientX, r0: r.get(), hist: [{ x: e.clientX, t: performance.now() }], moved: false, w: window.innerWidth * CARD }
  }
  const onMove = (e) => {
    const d = drag.current; if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 6) d.moved = true
    let next = d.r0 - dx * (180 / d.w)                       // 1:1 with the finger
    if (next < 0) next = -rubber(-next, 180)                  // soft limits instead of a wall
    if (next > 180) next = 180 + rubber(next - 180, 180)
    r.set(next)
    d.hist.push({ x: e.clientX, t: performance.now() }); if (d.hist.length > 5) d.hist.shift()
  }
  const onUp = () => {
    const d = drag.current; drag.current = null; if (!d) return
    if (!d.moved) { if (r.get() < 90) close(); return }       // a tap on the website side returns to it
    const a = d.hist[0], b = d.hist[d.hist.length - 1]
    const vx = (b.x - a.x) / Math.max(1, b.t - a.t) * 1000    // px/s
    const vr = -vx * (180 / d.w)                               // deg/s
    const target = r.get() + project(vr) > 90 ? 180 : 0       // decide from where the gesture is going
    run(r, target, { ...TURN, velocity: vr })
  }

  return (
    <Ctx.Provider value={{ open }}>
      <motion.div ref={page} className={`page${mode ? ' page--card' : ''}`}
        style={mode ? { scale: s, rotateY: r, transformPerspective: 1800, opacity: frontOn } : undefined}>
        <div ref={inner} className="page__inner">{children}</div>
      </motion.div>
      {outside}

      <AnimatePresence>
        {mode && (
          <>
            <motion.div key="scrim" className="desk" style={{ opacity: scrim }} exit={{ opacity: 0 }} />
            <motion.div key="back" className="cv-sheet" style={{ rotateY: backR, transformPerspective: 1800, opacity: backOn }}>
              <img src={cvImg} alt={t('flip.alt')} draggable="false" />
            </motion.div>
            <div key="stage" className="flip-stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
              <motion.p className="flip-hint" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.6 } }} exit={{ opacity: 0 }}>
                <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 9c6-7 16-7 22 0" /><path d="m20 4 4 5-5 2" /></svg>
                {t('flip.hint')}
              </motion.p>
              <motion.div className="flip-bar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.45, ...SPRING } }} exit={{ opacity: 0, y: 20 }}>
                <button className="flip-btn" aria-label={t('flip.turn')} onClick={() => { stopAll(); run(r, r.get() > 90 ? 0 : 180, TURN) }}>
                  <Icon name="replay" size={16} /><span className="flip-btn__t">{t('flip.turn')}</span>
                </button>
                <a className="flip-btn flip-btn--primary" href={cvPdf} download={cvName}><Icon name="down" size={16} />{t('flip.download')}</a>
                <button className="flip-btn" onClick={close}><Icon name="close" size={16} />{t('flip.back')}</button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  )
}

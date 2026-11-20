import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Head, Icon, SNAPPY, SPRING } from './kit'

/*
  phase 0 idle · 1 reading (scan beam) · 2 extracting (fields one by one) · 3 answering · 4 done
  Everything is driven by one timeline so "Replay" can interrupt it at any moment.
*/
export const IdpDemo = ({ embedded = false }) => {
  const { t } = useTranslation()
  const doc = t('demo.doc', { returnObjects: true })
  const fields = t('demo.fields', { returnObjects: true })
  const steps = t('demo.steps', { returnObjects: true })
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const [phase, setPhase] = useState(0)
  const [found, setFound] = useState(0)
  const [typed, setTyped] = useState(0)
  const [run, setRun] = useState(0)
  const q = t('demo.q')
  const nFields = fields.length

  useEffect(() => {
    if (!inView) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const n = nFields, qLen = q.length
    if (reduce) { setPhase(4); setFound(n); setTyped(qLen); return }
    const timers = []
    const at = (ms, fn) => timers.push(setTimeout(fn, ms))
    setPhase(1); setFound(0); setTyped(0)
    at(1700, () => setPhase(2))
    for (let i = 0; i < n; i++) at(1900 + i * 520, () => setFound(i + 1))
    const qStart = 1900 + n * 520 + 300
    at(qStart, () => setPhase(3))
    for (let c = 1; c <= qLen; c++) at(qStart + 200 + c * 26, () => setTyped(c))
    at(qStart + 200 + qLen * 26 + 900, () => setPhase(4))
    return () => timers.forEach(clearTimeout)
  }, [inView, run, nFields, q])

  const stepIdx = phase <= 1 ? 0 : phase === 2 ? 1 : 2
  const hl = (i) => (found > i ? ' is-hit' : '')

  return (
    <div className={embedded ? 'demo-embed' : 'section'}>
      <div className={embedded ? '' : 'wrap'}>
        {!embedded && <Head n="02" kicker={t('demo.kicker')} title={t('demo.title')} sub={t('demo.sub')} />}
        <motion.div ref={ref} className="demo card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: embedded ? 0.25 : 0 }}>
          <div className="demo__top">
            <div className="steps">
              {steps.map((s, i) => (
                <span key={s} className={`step${i === stepIdx && phase > 0 && phase < 4 ? ' is-on' : ''}${i < stepIdx || phase === 4 ? ' is-done' : ''}`}>
                  {(i === stepIdx && phase > 0 && phase < 4) && <motion.span key={stepIdx} className="step__pill" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={SNAPPY} />}
                  <span className="step__t">{i < stepIdx || phase === 4 ? '✓' : i + 1} · {s}</span>
                </span>
              ))}
            </div>
            <button className="btn-mini" onClick={() => setRun(r => r + 1)} disabled={!inView}>
              <Icon name="replay" size={15} />{t('demo.replay')}
            </button>
          </div>

          <div className="demo__grid">
            {/* the document */}
            <div className="paper-wrap">
              <span className="note note--demo" aria-hidden="true">{t('notes.demo')}</span>
              <div className="paper">
                {phase === 1 && <motion.div key={run} className="beam" initial={{ top: '-10%' }} animate={{ top: '105%' }} transition={{ duration: 1.6, ease: 'easeInOut' }} />}
                <div className="paper__head">
                  <div><b className={`f${hl(0)}`}>{doc.from}</b><small>Casablanca · Maroc</small></div>
                  <div className="paper__title">{doc.title}</div>
                </div>
                <div className="paper__meta">
                  <span className={`f${hl(1)}`}>N° FA-2026-0412</span>
                  <span className={`f${hl(2)}`}>12/09/2026</span>
                </div>
                <div className="paper__to">{doc.to}</div>
                <div className="paper__lines">
                  {doc.lines.map(([a, b]) => <div key={a}><span>{a}</span><span>{b}</span></div>)}
                  <div className="paper__sub"><span>{doc.vat}</span><span>2 496,00</span></div>
                </div>
                <div className="paper__total">
                  <span>TOTAL TTC</span><b className={`f${hl(3)}`}>14 976,00 MAD</b>
                </div>
                <div className="paper__foot"><span className={`f${hl(4)}`}>Échéance : 12/10/2026</span><i /><i /><i /></div>
              </div>
            </div>

            {/* the output */}
            <div className="out">
              <div className="json mono">
                <div className="json__bar"><span>extraction.json</span><span className="dim">{found}/{fields.length}</span></div>
                <div className="json__body">
                  <span className="dim">{'{'}</span>
                  {fields.map((f, i) => (
                    <AnimatePresence key={f.k}>
                      {found > i && (
                        <motion.div className="json__row" initial={{ opacity: 0, x: -14, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} transition={SPRING}>
                          <span className="json__k">"{f.k}"</span>: <span className="json__v">"{f.v}"</span>
                          <span className={`conf${f.c < 0.95 ? ' conf--mid' : ''}`}>
                            <motion.i initial={{ width: 0 }} animate={{ width: `${f.c * 100}%` }} transition={{ ...SPRING, delay: 0.1 }} />
                            <em>{Math.round(f.c * 100)}%</em>
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}
                  <span className="dim">{'}'}</span>
                </div>
              </div>

              <div className="rag">
                <AnimatePresence>
                  {phase >= 3 && (
                    <motion.div className="bubble-q" initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={SPRING}>
                      <span className="mono dim">Q</span>
                      <span>{q.slice(0, typed)}{phase === 3 && typed < q.length && <span className="caret" />}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {phase === 4 && (
                    <motion.div className="bubble-a" initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={SPRING}>
                      <span className="bubble-a__ic"><Icon name="spark" size={15} /></span>
                      <div><p>{t('demo.a')}</p><span className="source"><Icon name="ext" size={12} />{t('demo.source')}</span></div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {phase === 3 && typed >= q.length && <div className="thinking"><i /><i /><i /></div>}
              </div>
            </div>
          </div>
          <p className="demo__note">{t('demo.simulated')}</p>
        </motion.div>
      </div>
    </div>
  )
}

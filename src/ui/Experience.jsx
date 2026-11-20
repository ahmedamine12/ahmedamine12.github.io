import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Head, Icon, Reveal, SPRING } from './kit'
import { EXP_TECH } from '../data'

/*
  Journey = my career as `git log --graph`.
  - Every role is a commit: short hash, branch refs, dates, the role as the commit message.
  - The graph tells the real shape: the full-time role is `main` (HEAD), the part-time one runs on a
    parallel branch, internships are feature branches merged back into main.
  - Commits arrive as one line; when you scroll to one, its diff opens (what I did, as `+` lines)
    and stays open. Tap any commit to open or fold it. Normal scrolling, nothing pinned.
*/
const HASH = ['a3f9c21', '7e1b04d', 'c58d2fa', '19be6a0', 'e40d7b3']
const REF = ['xelops', 'lymit-labs', 'neoxia', 'saweblia', 'tekcy']
const LANE = [1, 2, 2, 2, 2]

const span = (it, now) => {
  const [from, to] = it.date.split('—').map(s => s.trim())
  return { from, to: to ? (/present|aujourd/i.test(to) ? now : to) : null }
}

const Prompt = ({ text, on }) => {
  const [k, setK] = useState(0)
  useEffect(() => {
    if (!on) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setK(text.length); return }
    let i = 0
    const id = setInterval(() => { i += 1; setK(i); if (i >= text.length) clearInterval(id) }, 45)
    return () => clearInterval(id)
  }, [on, text])
  return <>{text.slice(0, k)}{k < text.length && <span className="caret" />}</>
}

// fires once when the row enters the band above 62% of the viewport
const Watch = ({ i, onReach, children, className }) => {
  const ref = useRef(null)
  const hit = useInView(ref, { once: true, margin: '0px 0px -38% 0px' })
  useEffect(() => { if (hit) onReach(i) }, [hit]) // eslint-disable-line react-hooks/exhaustive-deps
  return <li ref={ref} className={className}>{children}</li>
}

export const Experience = () => {
  const { t } = useTranslation()
  const items = t('exp.items', { returnObjects: true })
  const ui = t('exp.ui', { returnObjects: true })
  const term = useRef(null)
  const seen = useInView(term, { once: true, margin: '-15% 0px' })
  const [reached, setReached] = useState(-1)
  const [open, setOpen] = useState(() => new Set())

  // a commit opens when it crosses 62% of the viewport, and stays open (no layout jumps above you)
  const reach = (i) => {
    setReached(r => Math.max(r, i))
    setOpen(o => (o.has(i) ? o : new Set(o).add(i)))
  }

  const toggle = (i) => setOpen(o => { const n = new Set(o); n.has(i) ? n.delete(i) : n.add(i); return n })

  return (
    <section className="section" id="experience">
      <div className="wrap">
        <Head n="02" kicker={t('exp.kicker')} title={t('exp.title')} />
        <Reveal>
          <div className="gx" ref={term}>
            <div className="gx__bar"><span className="gx__dots" aria-hidden="true"><i /><i /><i /></span><span className="gx__title mono">~/career — zsh</span></div>
            <div className="gx__screen">
              <p className="gx__prompt mono"><span className="gx__ps">~/career $</span> <Prompt text="git log --graph --all" on={seen} /></p>

              <ol className="gx__log">
                {items.map((it, i) => {
                  const s = span(it, ui.now)
                  const lane = LANE[i]
                  const isOpen = open.has(i)
                  const past = i <= reached
                  const tech = EXP_TECH[i] || []
                  return (
                    <Watch key={it.company} i={i} onReach={reach} className={`gx__row gx__row--l${lane}${past ? ' is-past' : ''}${isOpen ? ' is-open' : ''}${i === 0 ? ' is-first' : ''}${i === items.length - 1 ? ' is-last' : ''}`}>
                      <div className="gx__graph" aria-hidden="true">
                        <span className="gx__main" />
                        {lane === 2 && (<>
                          <svg className="gx__merge" viewBox="0 0 48 22" preserveAspectRatio="none"><path d="M34 22 C34 9, 12 12, 12 0" /></svg>
                          <span className="gx__l2" />
                          <svg className="gx__fork" viewBox="0 0 48 26" preserveAspectRatio="none"><path d="M34 0 C34 14, 12 12, 12 26" /></svg>
                        </>)}
                        <span className="gx__node" />
                      </div>

                      <div className="gx__commit">
                        <button type="button" className="gx__head" aria-expanded={isOpen} onClick={() => toggle(i)}>
                          <span className="gx__line1">
                            <span className="gx__hash mono">commit {HASH[i]}</span>
                            <span className="gx__refs">
                              {i === 0 && <em className="gx__ref gx__ref--head">HEAD → main</em>}
                              <em className={`gx__ref${lane === 2 ? ' gx__ref--br' : ''}`}>{REF[i]}</em>
                            </span>
                            <span className="gx__date mono">{s.from}{s.to ? ` → ${s.to}` : ''}</span>
                          </span>
                          <span className="gx__msg">{it.role}</span>
                          <span className="gx__co">{it.company} <span className="gx__ty">· {it.type}</span></span>
                          <span className="gx__chev"><Icon name="chev" size={16} stroke={2.2} /></span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div className="gx__body" key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}>
                              <ul className="gx__diff">
                                {it.bullets.map((b, j) => (
                                  <motion.li key={b} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...SPRING, delay: 0.1 + j * 0.08 }}>
                                    <span className="gx__plus" aria-hidden="true">+</span><span>{b}</span>
                                  </motion.li>
                                ))}
                              </ul>
                              <p className="gx__stat mono">
                                <span className="gx__add">{t('exp.ui.changes', { count: it.bullets.length })}</span>
                                <span> · {t('exp.ui.tools', { count: tech.length })}</span>
                                <span className="gx__merged"> · {i === 0 ? ui.head : lane === 2 && i === 1 ? ui.parallel : ui.merged}</span>
                              </p>
                              <div className="gx__tech">{tech.map(x => <span key={x} className="gx__file mono">{x}</span>)}</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Watch>
                  )
                })}
              </ol>
              <p className="gx__prompt gx__prompt--end mono"><span className="gx__ps">~/career $</span> <span className="gx__next">{ui.next}</span><span className="caret" /></p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

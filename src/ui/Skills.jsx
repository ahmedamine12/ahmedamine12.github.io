import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Head, Icon, Reveal, SNAPPY, SPRING, Tilt } from './kit'
import { LINKS } from '../data'


/*
  Toolbox = an exploded view of a product, Apple-style.
  - Five plates, top to bottom: Frontend → Backend → AI → Data → DevOps. Each tool is a chip on its board.
  - Scrolling (1:1, never hijacked) first pulls the stack apart, then brings one layer forward at a time;
    the panel beside it says what that layer is for. Tap a tool to read how I use it (its chip lights up).
  - Testing isn't a layer, it's the pass that runs through all of them: a scan sweeps the stack, every plate gets its ✓.
  - Plates are flat, 2D-projected (no preserve-3d / backdrop-filter), so iOS Safari draws them reliably.
*/
const STACK = [
  ['frontend', ['React', 'Next.js', 'TypeScript', 'Angular', 'Redux Saga']],
  ['backend', ['Java', 'Spring Boot', 'Python', 'FastAPI', 'REST APIs', 'Microservices']],
  ['ai', ['RAG', 'IDP', 'LLMs', 'Embeddings', 'Qdrant', 'AI agents']],
  ['data', ['PostgreSQL', 'Redis', 'MongoDB', 'MySQL', 'AS400', 'Flyway']],
  ['devops', ['Docker', 'Kubernetes', 'Azure DevOps', 'Jenkins', 'GitLab CI']],
  ['qa', ['Playwright', 'Selenium', 'Cucumber', 'TestNG']],
]
const PLATES = STACK.length - 1       // the last entry (testing) is the pass, not a plate
const STEPS = STACK.length
const INTRO = 0.1                      // share of the scroll spent pulling the stack apart

const usePhone = () => {
  const q = '(max-width: 720px)'
  const [on, setOn] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q), f = () => setOn(mq.matches)
    mq.addEventListener?.('change', f); return () => mq.removeEventListener?.('change', f)
  }, [])
  return on
}

const Plate = ({ i, g, tools, label, explode, active, testing, tool, phone, onPick }) => {
  const gap0 = phone ? 10 : 18, gap1 = phone ? 30 : 66
  // fixed spacing around the middle plate; the explode value (0 → 1) pulls them apart
  const y = useTransform(explode, e => (i - (PLATES - 1) / 2) * (gap0 + (gap1 - gap0) * e))
  const on = active === i
  const lit = on || testing
  return (
    <motion.button type="button" className={`st__plate kc--${g}${on ? ' is-on' : ''}${testing ? ' is-tested' : ''}`} style={{ y, zIndex: PLATES - i }}
      animate={{ x: on ? (phone ? -10 : -22) : 0, opacity: lit || active < 0 ? 1 : 0.38 }} transition={SPRING}
      onClick={() => onPick(i)} aria-label={label} aria-current={on || undefined}>
      <span className="st__face st__face--edge" aria-hidden="true" />
      <span className="st__face" aria-hidden="true">
        <b>{label}</b>
        <span className="st__chips">{tools.map(k => <i key={k} className={tool === k && on ? 'is-lit' : ''} />)}</span>
      </span>
      <AnimatePresence>
        {testing && (
          <motion.span className="st__check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            transition={{ ...SNAPPY, delay: 0.25 + i * 0.16 }} aria-hidden="true"><Icon name="check" size={13} stroke={3} /></motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export const Skills = () => {
  const { t } = useTranslation()
  const caps = t('skills.keys', { returnObjects: true })
  const groups = t('skills.groups', { returnObjects: true })
  const phone = usePhone()
  const outer = useRef(null)
  const { scrollYProgress } = useScroll({ target: outer, offset: ['start start', 'end end'] })
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const explode = useTransform(scrollYProgress, [0, INTRO], [reduce ? 1 : 0, 1], { clamp: true })
  const hint = useTransform(scrollYProgress, [0, INTRO * 0.6], [1, 0], { clamp: true })
  const stepOf = (v) => (v < INTRO * 0.5 ? -1 : Math.min(STEPS - 1, Math.floor(Math.max(0, v - INTRO) / (1 - INTRO) * STEPS)))
  const [step, setStep] = useState(-1)
  const [tool, setTool] = useState(null)
  const stepRef = useRef(-1)   // the live step, so a scroll inside the same layer never clears the picked tool
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const s = stepOf(v)
    if (s !== stepRef.current) { stepRef.current = s; setStep(s); setTool(null) }
  })

  const testing = step === STEPS - 1
  const cur = step >= 0 ? STACK[step] : null

  // jump to a layer: scroll to the middle of its stretch (the page keeps scrolling normally)
  const goTo = (i) => {
    const el = outer.current; if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: top + span * (INTRO + ((i + 0.5) / STEPS) * (1 - INTRO)), behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <section className="section st-sec" id="skills">
      <div className="wrap"><Head n="04" kicker={t('skills.kicker')} title={t('skills.title')} sub={t('skills.sub')} /></div>
      <div ref={outer} className="st" style={{ '--steps': STEPS }}>
        <div className="st__sticky">
          <div className="wrap st__grid">
            <div className={`st__stage${testing ? ' is-testing' : ''}`}>
              {STACK.slice(0, PLATES).map(([g, tools], i) => (
                <Plate key={g} i={i} g={g} tools={tools} label={groups[g]} explode={explode} active={testing ? -2 : step} testing={testing}
                  tool={tool} phone={phone} onPick={goTo} />
              ))}
              {testing && <span key="scan" className="st__scan" aria-hidden="true" />}
              <motion.span className="st__hint" style={{ opacity: hint }} aria-hidden="true">{t('skills.hint')}</motion.span>
            </div>

            <div className="st__panel" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                {cur ? (
                  <motion.div key={cur[0]} className={`st__card kc--${cur[0]}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={SPRING}>
                    <span className="st__n mono">{testing ? t('skills.across') : `${t('skills.layer')} ${String(step + 1).padStart(2, '0')} / ${String(PLATES).padStart(2, '0')}`}</span>
                    <h3 className="st__h"><i />{groups[cur[0]]}</h3>
                    <p className="st__p">{caps[`@${cur[0]}`]}</p>
                    <div className="st__tools">
                      {cur[1].map(k => (
                        <button type="button" key={k} className={`st__tool${tool === k ? ' is-on' : ''}`} aria-pressed={tool === k}
                          onClick={() => setTool(x => (x === k ? null : k))}
                          onPointerEnter={(e) => { if (e.pointerType === 'mouse') setTool(k) }}>{k}</button>
                      ))}
                    </div>
                    <div className="st__note">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p key={tool || 'idle'} className={tool ? '' : 'is-idle'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.14 }}>
                          {tool ? caps[tool] : t('skills.pick')}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="intro" className="st__card st__card--intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    <span className="st__n mono">{t('skills.layers', { n: PLATES })}</span>
                    <p className="st__p">{t('skills.intro')}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="st__nav" role="tablist" aria-label={t('skills.kicker')}>
                {STACK.map(([g], i) => (
                  <button type="button" key={g} role="tab" aria-selected={step === i} className={`st__seg kc--${g}${step === i ? ' is-on' : ''}${step > i ? ' is-past' : ''}`}
                    onClick={() => goTo(i)} aria-label={groups[g]}><i /><span>{groups[g]}</span></button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const Beyond = () => {
  const { t } = useTranslation()
  const certs = t('more.certs', { returnObjects: true })
  return (
    <section className="section" id="beyond">
      <div className="wrap">
        <Head n="06" kicker={t('more.kicker')} title={t('more.title')} />
        <div className="bento">
          <Reveal className="b-write" delay={0.05}><Tilt max={3} className="card bento__c">
            <span className="bento__ic"><Icon name="pen" /></span>
            <h3>{t('more.article_title')}</h3><p>{t('more.article')}</p>
            <a className="read-link" href={LINKS.article} target="_blank" rel="noreferrer">{t('more.article_cta')}<Icon name="arrow" size={16} /></a>
          </Tilt></Reveal>
          <Reveal className="b-edu" delay={0.1}><Tilt max={3} className="card bento__c">
            <span className="bento__ic"><Icon name="cap" /></span>
            <h3>{t('more.edu_title')}</h3><p className="strong">{t('more.edu')}</p><p className="mono dim">{t('more.edu_place')}</p>
          </Tilt></Reveal>
          <Reveal className="b-certs" delay={0.15}><Tilt max={3} className="card bento__c">
            <span className="bento__ic"><Icon name="badge" /></span>
            <h3>{t('more.certs_title')}</h3>
            <ul className="certs">
              {certs.map((c, i) => (
                <motion.li key={c.name} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ ...SPRING, delay: 0.1 + i * 0.06 }}>
                  <span className={`issuer issuer--${c.by.toLowerCase()}`}>{c.by}</span><span>{c.name}</span>
                </motion.li>
              ))}
            </ul>
          </Tilt></Reveal>
        </div>
      </div>
    </section>
  )
}

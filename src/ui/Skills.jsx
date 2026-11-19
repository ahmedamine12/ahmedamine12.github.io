import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Head, Icon, Reveal, SPRING, Tilt, useFinePointer } from './kit'
import { LINKS } from '../data'

/*
  Toolbox = a keyboard: "what I reach for" are the keys I reach for.
  - One row per family; the row's first key is its coloured "modifier".
  - Press (pointer-down, instant) → the key sinks, the little screen says, in plain words, what I use it for.
  - On desktop the visitor can type on their real keyboard: a letter presses the keys starting with it, cycling.
*/
const ROWS = [
  ['ai', ['RAG', 'IDP', 'LLMs', 'Embeddings', 'Qdrant', 'AI agents']],
  ['backend', ['Java', 'Spring Boot', 'Python', 'FastAPI', 'REST APIs', 'Microservices']],
  ['frontend', ['React', 'Redux Saga', 'Angular', 'Next.js', 'TypeScript']],
  ['data', ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'AS400', 'Flyway']],
  ['devops', ['Docker', 'Kubernetes', 'Azure DevOps', 'Jenkins', 'GitLab CI']],
  ['qa', ['Playwright', 'Selenium', 'Cucumber', 'TestNG']],
]
const ALL = ROWS.flatMap(([g, ks]) => ks.map(k => ({ k, g }))).concat([{ k: 'Curiosity', g: 'space' }])

let lastType = 'mouse'   // input type of the last press (Safari < 17 has no pointerType on click)
const Key = ({ id, label, g, mod, deco, down, onPress, wide }) => (
  <button type="button" className={`kc kc--${g}${mod ? ' kc--mod' : ''}${deco ? ' kc--deco' : ''}${wide ? ' kc--space' : ''}${down ? ' is-down' : ''}`}
    onPointerDown={(e) => { lastType = e.pointerType; if (e.pointerType === 'mouse' && e.button === 0) onPress(id) }}   // mouse: instant
    onClick={(e) => { if (e.detail > 0 && lastType !== 'mouse') onPress(id) }}   // touch / pen: on tap, never while scrolling
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPress(id) } }}
    aria-label={label} tabIndex={deco ? -1 : 0}>
    <span className="kc__cap">{!deco && !wide && <i />}<span>{label}</span></span>
  </button>
)

/*
  Phones: no physical keyboard to type on, so no "press any key" screen and no stretched rows.
  Keys sit at their natural width under each family's label; tapping one opens its note right
  under that family (anchored to the finger, not to a screen at the top). Tap again to close.
*/
const TouchDeck = ({ groups, caps, curId, onToggle }) => {
  const rows = [...ROWS, ['space', ['Curiosity']]]
  return (
    <div className="surface kb kt">
      {rows.map(([g, ks]) => {
        const open = curId && (curId === `mod:${g}` || ks.some(k => curId === `key:${k}`))
        const isMod = curId === `mod:${g}`
        const name = isMod ? groups[g] : curId?.slice(4) === 'Curiosity' ? (caps.Curiosity_label || 'Curiosity') : curId?.slice(4)
        const text = isMod ? caps[`@${g}`] : caps[curId?.slice(4)]
        return (
          <div className={`kt__group kc--${g}`} key={g}>
            {g !== 'space' && (
              <button type="button" className={`kt__label${isMod ? ' is-on' : ''}`} aria-expanded={isMod} onClick={() => onToggle(`mod:${g}`)}>
                <i />{groups[g]}
              </button>
            )}
            <div className="kt__keys">
              {ks.map(k => {
                const id = `key:${k}`, on = curId === id
                return (
                  <button type="button" key={k} className={`kt__key${g === 'space' ? ' kt__key--space' : ''}${on ? ' is-on' : ''}`} aria-expanded={on} onClick={() => onToggle(id)}>
                    {g === 'space' ? (caps.Curiosity_label || k) : k}
                  </button>
                )
              })}
            </div>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div className="kt__note" key="note" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={curId} className="kt__note-in" aria-live="polite" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.14 }}>
                      <b>{name}</b><span>{text}</span>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export const Skills = () => {
  const { t } = useTranslation()
  const caps = t('skills.keys', { returnObjects: true })
  const groups = t('skills.groups', { returnObjects: true })
  const [cur, setCur] = useState(null)          // { id, label, g }
  const [down, setDown] = useState(null)
  const sec = useRef(null)
  const inView = useInView(sec, { amount: 0.35 })
  const cycle = useRef({})
  const fine = useFinePointer()

  const press = (id) => {
    const [kind, name] = id.split(':')
    if (kind === 'deco') { setDown(id); setTimeout(() => setDown(d => (d === id ? null : d)), 140); return }
    const g = kind === 'mod' ? name : (ALL.find(x => x.k === name) || {}).g
    setCur({ id, label: kind === 'mod' ? groups[name] : name === 'Curiosity' ? (caps.Curiosity_label || name) : name, g, text: kind === 'mod' ? caps[`@${name}`] : caps[name] })
    setDown(id); setTimeout(() => setDown(d => (d === id ? null : d)), 160)
  }

  const pressRef = useRef(press)
  pressRef.current = press

  // type on the real keyboard (only while the section is on screen, never while typing in a field)
  useEffect(() => {
    if (!inView) return
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      if (/input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable) return
      if (!/^[a-z]$/i.test(e.key)) return
      const hits = ALL.filter(x => x.k[0].toLowerCase() === e.key.toLowerCase())
      if (!hits.length) return
      const n = (cycle.current[e.key] = ((cycle.current[e.key] ?? -1) + 1) % hits.length)
      pressRef.current(`key:${hits[n].k}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inView]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="section" id="skills" ref={sec}>
      <div className="wrap">
        <Head n="04" kicker={t('skills.kicker')} title={t('skills.title')} />
        <Reveal>
          {!fine ? (
            <TouchDeck groups={groups} caps={caps} curId={cur?.id}
              onToggle={(id) => { if (cur?.id === id) setCur(null); else { press(id); navigator.vibrate?.(8) } }} />
          ) : (
          <div className="surface kb">
            <div className={`kb__screen${cur ? ` is-on kc--${cur.g}` : ''}`} aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                {cur ? (
                  <motion.div key={cur.id} className="kb__msg" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>
                    <b><i />{cur.label}</b><span>{cur.text}</span>
                  </motion.div>
                ) : (
                  <motion.div key="idle" className="kb__msg kb__msg--idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
                    <b>{t('skills.idle')}<span className="kb__caret" /></b><span>{fine ? t('skills.idle_type') : t('skills.idle_tap')}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="kb__deck">
              {ROWS.map(([g, ks]) => (
                <div className="kb__row" key={g}>
                  <Key id={`mod:${g}`} label={groups[g]} g={g} mod down={down === `mod:${g}`} onPress={press} />
                  {ks.map(k => <Key key={k} id={`key:${k}`} label={k} g={g} down={down === `key:${k}` || (cur?.id === `mod:${g}` && down === `mod:${g}`)} onPress={press} />)}
                </div>
              ))}
              <div className="kb__row kb__row--space">
                {['fn', '⌃', '⌥', '⌘'].map(k => <Key key={k} id={`deco:${k}`} label={k} g="deco" deco down={down === `deco:${k}`} onPress={press} />)}
                <Key id="key:Curiosity" label={caps.Curiosity_label || 'Curiosity'} g="space" wide down={down === 'key:Curiosity'} onPress={press} />
                {['⌘', '⌥'].map((k, i) => <Key key={`r${i}`} id={`deco:r${k}`} label={k} g="deco" deco down={down === `deco:r${k}`} onPress={press} />)}
              </div>
            </div>
          </div>
          )}
        </Reveal>
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

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useInView, useMotionValue, useMotionValueEvent } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Icon, SNAPPY, SPRING } from './kit'

/*
  One small live demo per project, same grammar as the IDP one:
  a script of "beats" plays once the demo is on screen, the step pills follow it,
  Replay restarts it at any moment, reduced motion jumps straight to the end state.
*/
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// gaps[i] = ms between beat i and beat i+1 (beat 1 fires `first` ms after the demo is seen)
const useScript = (gaps, first = 450) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const [beat, setBeat] = useState(0)
  const [run, setRun] = useState(0)
  const n = gaps.length + 1
  useEffect(() => {
    if (!inView) return
    if (reduced()) { setBeat(n); return }
    setBeat(0)
    const timers = []
    let at = first
    for (let i = 1; i <= n; i++) {
      const b = i
      timers.push(setTimeout(() => setBeat(b), at))
      at += gaps[i - 1] ?? 0
    }
    return () => timers.forEach(clearTimeout)
  }, [inView, run]) // eslint-disable-line react-hooks/exhaustive-deps
  return { ref, beat, n, inView, replay: () => setRun(r => r + 1) }
}

const Typer = ({ text, on, speed = 32 }) => {
  const [k, setK] = useState(0)
  useEffect(() => {
    if (!on) { setK(0); return }
    if (reduced()) { setK(text.length); return }
    let i = 0
    const id = setInterval(() => { i += 1; setK(i); if (i >= text.length) clearInterval(id) }, speed)
    return () => clearInterval(id)
  }, [on, text, speed])
  return <>{text.slice(0, k)}{on && k < text.length && <span className="caret" />}</>
}

const Num = ({ v, fmt = (x) => Math.round(x).toLocaleString('fr-FR') }) => {
  const mv = useMotionValue(v)
  const [txt, setTxt] = useState(fmt(v))
  useMotionValueEvent(mv, 'change', (x) => setTxt(fmt(x)))
  useEffect(() => { const c = animate(mv, v, { duration: reduced() ? 0 : 0.55, ease: [0.2, 0.8, 0.2, 1] }); return () => c.stop() }, [v]) // eslint-disable-line react-hooks/exhaustive-deps
  return <span className="tnum">{txt}</span>
}

// a block that materializes when its beat comes
const In = ({ on, className = '', children, y = 10, delay = 0, as = 'div' }) => {
  const C = motion[as]
  return (
    <AnimatePresence initial={false}>
      {on && <C className={className} initial={{ opacity: 0, y, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...SPRING, delay }}>{children}</C>}
    </AnimatePresence>
  )
}

const Shell = ({ id, s, steps, phase, children }) => {
  const { t } = useTranslation()
  const done = s.beat >= s.n
  return (
    <div className="demo-embed">
      <div ref={s.ref} className={`demo card pd pd--${id}`}>
        <div className="demo__top">
          <div className="steps">
            {steps.map((label, i) => {
              const on = s.beat > 0 && !done && i === phase
              const ok = done || i < phase
              return (
                <span key={label} className={`step${on ? ' is-on' : ''}${ok ? ' is-done' : ''}`}>
                  {on && <motion.span key={i} className="step__pill" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={SNAPPY} />}
                  <span className="step__t">{ok ? '✓' : i + 1} · {label}</span>
                </span>
              )
            })}
          </div>
          <button className="btn-mini" onClick={s.replay} disabled={!s.inView}><Icon name="replay" size={15} />{t('demo.replay')}</button>
        </div>
        {children}
        <p className="demo__note">{t('demo.simulated')}</p>
      </div>
    </div>
  )
}

/* ---------------- Lymit Labs: dosage pricing → batch certificate → checkout ---------------- */
const Lymit = () => {
  const { t } = useTranslation()
  const c = t('pdemo.lymit', { returnObjects: true })
  const s = useScript([700, 700, 900, 900, 1100, 1300, 1000])
  const b = s.beat
  const doses = [['5 mg', 290], ['10 mg', 490], ['20 mg', 850]]
  const pick = Math.min(Math.max(b, 1), 3) - 1
  const price = doses[pick][1]
  const off = b >= 7 ? Math.round(price * 0.1) : 0
  const phase = b <= 3 ? 0 : b <= 5 ? 1 : 2
  return (
    <Shell id="lymit" s={s} steps={c.steps} phase={phase}>
      <div className="pd__grid">
        <div className="pd__panel lm">
          <div className="lm__vial" aria-hidden="true"><i /><b /></div>
          <div className="lm__info">
            <span className="pd__eyebrow">{c.product}</span>
            <div className="lm__price"><Num v={b === 0 ? 290 : price} /> <small>MAD</small></div>
            <span className="pd__eyebrow">{c.dosage}</span>
            <div className="lm__doses">
              {doses.map(([d], i) => (
                <span key={d} className={`lm__dose${b > 0 && i === pick ? ' is-on' : ''}`}>{d}</span>
              ))}
            </div>
            <In on={b >= 4} className="lm__lot"><span className="pd__dot" />{c.lot} · 48 {c.stock}</In>
          </div>
        </div>
        <div className="pd__col">
          <In on={b >= 5} className="lm__cert">
            <span className="lm__seal"><Icon name="check" size={16} stroke={2.6} /></span>
            <div><b>{c.cert}</b><span>{c.lot} · {c.purity}</span><em>{c.verified}</em></div>
          </In>
          <In on={b >= 6} className="pd__card lm__cart">
            <span className="pd__eyebrow">{c.cart}</span>
            <div className="pd__row"><span>{c.product} {doses[pick][0]} × 1</span><span className="tnum">{price}</span></div>
            <div className="pd__row lm__coupon"><span>{c.coupon}</span><span className="mono"><Typer text={c.code} on={b >= 6} speed={70} /></span></div>
            <In on={b >= 7} className="pd__row pd__ok"><span>{c.discount}</span><span className="tnum">−{off}</span></In>
            <div className="pd__row pd__total"><span>{c.total}</span><span><Num v={price - off} /> MAD</span></div>
          </In>
          <In on={b >= 8} className="pd__done"><Icon name="check" size={16} stroke={2.4} /><div><b>{c.paid}</b><span>{c.email}</span></div></In>
        </div>
      </div>
    </Shell>
  )
}

/* ---------------- BrowseMate: read the page → ask → sourced bullet answer ---------------- */
const Browse = () => {
  const { t } = useTranslation()
  const c = t('pdemo.browsemate', { returnObjects: true })
  const s = useScript([1500, 400, 1500, 900, 650, 650, 700])
  const b = s.beat
  const phase = b <= 2 ? 0 : b <= 4 ? 1 : 2
  const lit = b >= 5 ? Math.min(b - 4, 3) : 0 // bullets shown
  // which article lines each bullet comes from
  const src = [[1, 2], [4, 5], [7]]
  const hot = new Set(src.slice(0, lit).flat())
  return (
    <Shell id="browsemate" s={s} steps={c.steps} phase={phase}>
      <div className="bm">
        <div className="bm__chrome"><span className="bm__dots"><i /><i /><i /></span><span className="bm__url">{c.url}</span></div>
        <div className="bm__page">
          <div className="bm__article">
            <b>{c.article}</b>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={`bm__line${hot.has(i) ? ' is-hot' : ''}`} style={{ width: `${[96, 88, 92, 70, 94, 84, 60, 90, 76][i]}%` }} />
            ))}
            {b === 1 && <motion.div key={s.beat} className="bm__scan" initial={{ top: '0%' }} animate={{ top: '100%' }} transition={{ duration: 1.4, ease: 'easeInOut' }} />}
          </div>
          <In on={b >= 1} className="bm__panel" y={16}>
            <div className="bm__head"><span className="bm__logo" /><b>BrowseMate</b><span className="bm__model">Gemini</span></div>
            <div className="bm__body">
              <span className="bm__status">{b >= 2 ? <><Icon name="check" size={13} stroke={2.6} />{c.words}</> : <>{c.reading}</>}</span>
              <In on={b >= 3} className="bm__q"><Typer text={c.q} on={b >= 3} speed={30} /></In>
              {b === 4 && <div className="thinking"><i /><i /><i /></div>}
              {b >= 5 && (
                <ol className="bm__a">
                  {c.points.map((p, i) => <In key={p} as="li" on={lit > i}>{p}</In>)}
                </ol>
              )}
              <In on={b >= 8} className="bm__by">{c.by}</In>
            </div>
          </In>
        </div>
      </div>
    </Shell>
  )
}

/* ---------------- Smart Navigation: pins → two engines draw routes → compare ---------------- */
const RA = 'M46 168 L46 120 L120 120 L120 72 L210 72 L210 40 L278 40'
const RB = 'M46 168 L150 168 L150 100 L232 100 L232 40 L278 40'
const Nav = () => {
  const { t } = useTranslation()
  const c = t('pdemo.nav', { returnObjects: true })
  const s = useScript([600, 600, 1300, 1300, 900, 1600])
  const b = s.beat
  const phase = b <= 2 ? 0 : b <= 4 ? 1 : 2
  const best = b >= 6
  return (
    <Shell id="nav" s={s} steps={c.steps} phase={phase}>
      <div className="pd__grid nv">
        <div className="nv__map">
          <svg viewBox="0 0 320 200" aria-hidden="true">
            <rect width="320" height="200" className="nv__ground" />
            <path d="M0 150 C 80 140, 140 190, 320 170 L320 200 L0 200z" className="nv__water" />
            <rect x="160" y="128" width="56" height="30" rx="6" className="nv__park" />
            {[40, 72, 100, 120, 168].map(y => <path key={`h${y}`} d={`M0 ${y}H320`} className="nv__street" />)}
            {[46, 120, 150, 210, 232, 278].map(x => <path key={`v${x}`} d={`M${x} 0V200`} className="nv__street" />)}
            {b >= 3 && <motion.path d={RA} className={`nv__route nv__route--a${best ? ' is-dim' : ''}`} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduced() ? 0 : 1.1, ease: 'easeInOut' }} />}
            {b >= 4 && <motion.path d={RB} className="nv__route nv__route--b" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduced() ? 0 : 1.1, ease: 'easeInOut' }} />}
            {b >= 7 && <motion.path d={RB} className="nv__trip" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduced() ? 0 : 1.6, ease: 'easeInOut' }} />}
            {b >= 1 && <motion.g initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...SPRING }}><circle cx="46" cy="168" r="7" className="nv__pin nv__pin--a" /><circle cx="46" cy="168" r="2.6" fill="#fff" /></motion.g>}
            {b >= 2 && <motion.g initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ ...SPRING }}><path d="M278 40c-8-10-11-14-11-19a11 11 0 0 1 22 0c0 5-3 9-11 19z" transform="translate(0 -4)" className="nv__pin nv__pin--b" /><circle cx="278" cy="17" r="3.6" fill="#fff" /></motion.g>}
          </svg>
          <In on={b >= 1} className="nv__tag nv__tag--a">{c.from}</In>
          <In on={b >= 2} className="nv__tag nv__tag--b">{c.to}</In>
        </div>
        <div className="pd__col">
          <In on={b >= 5} className={`pd__card nv__eng${best ? ' is-dim' : ''}`}>
            <span className="nv__sw nv__sw--a" /><div><b>{c.a}</b><span>7,9 {c.km} · 19 {c.min}</span></div>
          </In>
          <In on={b >= 5} delay={0.08} className={`pd__card nv__eng${best ? ' is-best' : ''}`}>
            <span className="nv__sw nv__sw--b" /><div><b>{c.b}</b><span>7,2 {c.km} · 17 {c.min}</span></div>
            {best && <motion.em className="nv__best" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={SNAPPY}>{c.best}</motion.em>}
          </In>
          <In on={b >= 6} className="pd__meta"><Icon name="spark" size={14} />{c.query}</In>
        </div>
      </div>
    </Shell>
  )
}

/* ---------------- Restaurant platform: site in a click → order + Square → Uber Eats ---------------- */
const Resto = () => {
  const { t } = useTranslation()
  const c = t('pdemo.resto', { returnObjects: true })
  const s = useScript([1200, 900, 1000, 1100, 900, 900, 900])
  const b = s.beat
  const phase = b <= 2 ? 0 : b <= 5 ? 1 : 2
  const qty = [0, b >= 4 ? 2 : b >= 3 ? 1 : 0, b >= 4 ? 2 : 0]
  const total = c.menu.reduce((a, [, p], i) => a + Number(p) * qty[i], 0)
  const track = b >= 6 ? Math.min(b - 5, 3) : 0
  return (
    <Shell id="resto" s={s} steps={c.steps} phase={phase}>
      <div className="pd__grid">
        <div className="rs__site">
          <div className="bm__chrome"><span className="bm__dots"><i /><i /><i /></span><span className="bm__url"><Typer text={c.url} on={b >= 1} speed={40} /></span></div>
          <div className={`rs__hero${b >= 1 ? ' is-on' : ''}`}>
            <b>{b >= 1 ? c.name : ''}</b><span>{b >= 1 ? c.tag : ''}</span>
            <In on={b >= 2} className="rs__live"><span className="pd__dot" />{c.live}</In>
          </div>
          <div className="rs__menu">
            {c.menu.map(([name, p], i) => (
              <In key={name} on={b >= 2} delay={i * 0.08} className={`rs__item${qty[i] ? ' is-picked' : ''}`}>
                <span>{name}</span><span className="tnum">{p} MAD</span>
                {qty[i] > 0 && <motion.em key={qty[i]} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={SNAPPY}>×{qty[i]}</motion.em>}
              </In>
            ))}
          </div>
        </div>
        <div className="pd__col">
          <In on={b >= 3} className="pd__card">
            <span className="pd__eyebrow">{c.cart}</span>
            <div className="pd__row pd__total"><span>{c.menu.filter((_, i) => qty[i]).map(([n], i) => <span key={n}>{i ? ' · ' : ''}{n}</span>)}</span><span><Num v={total} /> MAD</span></div>
            <div className={`rs__pay${b >= 5 ? ' is-paid' : ''}`}>{b >= 5 ? <><Icon name="check" size={15} stroke={2.6} />{c.paid}</> : <><span className="rs__sq" />{c.pay}</>}</div>
          </In>
          <In on={b >= 6} className="pd__card rs__track">
            {c.track.map((step, i) => (
              <div key={step} className={`rs__tstep${track > i ? ' is-done' : ''}${track === i + 1 && i < 2 ? ' is-now' : ''}`}><i />{step}</div>
            ))}
          </In>
        </div>
      </div>
    </Shell>
  )
}

/* ---------------- Home services: booking → slot on the weekly board → live follow-up ---------------- */
const BUSY = [[0, 0], [1, 2], [2, 1], [3, 0], [4, 2], [0, 1], [3, 2], [2, 0]] // [day, tech]
const Home = () => {
  const { t } = useTranslation()
  const c = t('pdemo.home', { returnObjects: true })
  const s = useScript([900, 1100, 900, 800, 800, 800])
  const b = s.beat
  const phase = b <= 2 ? 0 : b === 3 ? 1 : 2
  const flow = b >= 4 ? Math.min(b - 3, 4) : 0
  return (
    <Shell id="home" s={s} steps={c.steps} phase={phase}>
      <div className="pd__grid">
        <div className="pd__col">
          <In on={b >= 1} className="pd__card hm__job">
            <span className="hm__ic"><Icon name="tool" size={17} /></span>
            <div><b>{c.job}</b><span>{c.when}</span></div>
          </In>
          <div className="hm__board" role="img" aria-label={c.free}>
            <span />
            {c.days.map((d, i) => <span key={d} className={`hm__day${b === 2 && i === 3 ? ' is-hot' : ''}`}>{d}</span>)}
            {c.techs.map((tech, r) => (
              <React.Fragment key={tech}>
                <span className="hm__tech">{tech}</span>
                {c.days.map((d, col) => {
                  const busy = BUSY.some(([x, y]) => x === col && y === r)
                  const free = b === 2 && col === 3 && !busy
                  const mine = b >= 3 && col === 3 && r === 1
                  return (
                    <span key={d} className={`hm__cell${busy ? ' is-busy' : ''}${free ? ' is-free' : ''}`}>
                      {mine && <motion.i className="hm__chip" initial={{ scale: 0.4, opacity: 0, y: -30 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ ...SPRING }} />}
                    </span>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="pd__col">
          <In on={b >= 3} className="pd__done hm__assigned"><span className="hm__av">S</span><div><b>{c.assigned}</b><span>{c.when}</span></div></In>
          <In on={b >= 4} className="pd__card hm__flow">
            {c.flow.map((f, i) => (
              <div key={f} className={`rs__tstep${flow > i ? ' is-done' : ''}${flow === i + 1 && i < 3 ? ' is-now' : ''}`}><i />{f}</div>
            ))}
          </In>
        </div>
      </div>
    </Shell>
  )
}

const DEMOS = { lymit: Lymit, browsemate: Browse, nav: Nav, resto: Resto, home: Home }
export const hasProjectDemo = (id) => !!DEMOS[id]
export const ProjectDemo = ({ id }) => { const D = DEMOS[id]; return D ? <D /> : null }

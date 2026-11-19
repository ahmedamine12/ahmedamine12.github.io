import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform, useVelocity } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Icon, project, toast } from './kit'
import { LINKS } from '../data'
import QRCode from 'qrcode'

/*
  A physical business card.
  - Tap / click: turns over (rotation spring ζ 0.8).
  - Drag: follows the hand 1:1 and swings with the drag velocity; released, it springs home.
  - Phone only: a card slot below. Dropped in (momentum projection decides), the card is swallowed
    and the contact opens in the phone's Contacts app.
  - Computer: no slot. The back of the card carries a small QR, like modern business cards.
*/
const k = (resp, ratio) => { const s = Math.pow(2 * Math.PI / resp, 2); return { type: 'spring', stiffness: s, damping: 2 * ratio * Math.sqrt(s) } }
const TURN = k(0.5, 0.8)
const THROW = k(0.4, 0.8)
const HOME = k(0.45, 1)

const VCARD = [
  'BEGIN:VCARD', 'VERSION:3.0',
  'N:Bouricha;Ahmed Amine;;;', 'FN:Ahmed Amine Bouricha',
  'TITLE:Software Engineer - Full Stack & AI',
  `EMAIL;TYPE=INTERNET:${LINKS.emailLabel}`,
  'TEL;TYPE=CELL:+212677992837',
  'ADR;TYPE=WORK:;;;Casablanca;;;Morocco',
  'URL:https://ahmedamine12.github.io/ImBourichaAhmedAmine.github.io/',
  `X-SOCIALPROFILE;TYPE=linkedin:${LINKS.linkedin}`,
  `X-SOCIALPROFILE;TYPE=github:${LINKS.github}`,
  'END:VCARD',
].join('\r\n')

// compact contact for the QR (MeCard: read as a contact by iPhone and Android cameras)
const MECARD = `MECARD:N:Bouricha,Ahmed Amine;TEL:+212677992837;EMAIL:${LINKS.emailLabel};URL:https://ahmedamine12.github.io/ImBourichaAhmedAmine.github.io/;NOTE:Software Engineer - Full Stack & AI;;`

const saveContact = () => {
  const url = URL.createObjectURL(new Blob([VCARD], { type: 'text/vcard' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'Ahmed_Amine_Bouricha.vcf'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const isPhone = () => window.matchMedia('(pointer: coarse)').matches && Math.min(window.screen.width, window.screen.height) < 820

export const BusinessCard = () => {
  const { t } = useTranslation()
  const stage = useRef(null), slot = useRef(null), card = useRef(null)
  const x = useMotionValue(0), y = useMotionValue(0)
  const r = useMotionValue(0)
  const vx = useVelocity(x)
  const swing = useSpring(useTransform(vx, [-1800, 0, 1800], [-16, 0, 16]), { stiffness: 300, damping: 26 })
  const lift = useTransform(y, [-40, 0, 200], [1.04, 1, 0.98])
  const facing = v => { const a = ((v % 360) + 360) % 360; return a < 90 || a > 270 }
  const frontOn = useTransform(r, v => (facing(v) ? 1 : 0))
  const backOn = useTransform(r, v => (facing(v) ? 0 : 1))
  const frontPE = useTransform(r, v => (facing(v) ? 'auto' : 'none'))
  const backPE = useTransform(r, v => (facing(v) ? 'none' : 'auto'))
  const [phone] = useState(isPhone)
  const [status, setStatus] = useState('idle')   // idle | over | saved
  const [used, setUsed] = useState(false)
  const [qr, setQr] = useState(null)             // computers: QR printed on the back of the card
  const [zoom, setZoom] = useState(false)         // click the QR to enlarge it for the phone camera
  useEffect(() => {
    if (phone) return
    QRCode.toString(MECARD, { type: 'svg', errorCorrectionLevel: 'L', margin: 0, color: { dark: '#1d1d1f', light: '#0000' } }).then(setQr).catch(() => {})
  }, [phone])
  const dragged = useRef(false)

  // the slot's opening line, measured from the card's resting top (card space)
  const mouth = useMotionValue(10000)
  const hgt = useRef(206)
  const measure = () => {
    const c = card.current?.getBoundingClientRect(), sl = slot.current?.getBoundingClientRect()
    if (!c || !sl) return
    hgt.current = card.current.offsetHeight
    mouth.set(sl.top + 8 - (c.top - y.get()))
  }
  // whatever passes the opening is hidden: the card is really swallowed by the slot
  const clip = useTransform([y, mouth], ([yy, m]) => `inset(0 0 ${Math.max(0, yy + hgt.current - m)}px 0 round 16px)`)

  const home = (velocity = { x: 0, y: 0 }) => {
    animate(x, 0, { ...HOME, velocity: velocity.x })
    animate(y, 0, { ...HOME, velocity: velocity.y })
  }

  const drop = (vy) => {
    setStatus('saved'); setUsed(true)
    animate(x, 0, HOME)
    animate(y, mouth.get() + 6, { ...THROW, bounce: undefined, velocity: vy, onComplete: () => {
      saveContact(); navigator.vibrate?.(14); toast(t('card.saved'))
      setTimeout(() => {                                   // the card rises back out of the slot
        animate(y, 0, HOME)
        setTimeout(() => setStatus('idle'), 900)
      }, 1000)
    } })
  }

  return (
    <div className="bcard-stage" ref={stage}>
      <motion.div ref={card} className="bcard" role="button" tabIndex={0} aria-label={t('card.aria')}
        style={{ x, y, rotateZ: swing, scale: lift, clipPath: clip }}
        drag dragMomentum={false} dragElastic={0}
        onPointerDown={() => { dragged.current = false }}
        onClickCapture={(e) => { if (dragged.current) { e.preventDefault(); e.stopPropagation() } }}
        onDragStart={() => { dragged.current = true; if (phone) measure(); setUsed(true) }}
        onDrag={() => phone && setStatus(y.get() + hgt.current > mouth.get() + hgt.current * 0.25 && Math.abs(x.get()) < 150 ? 'over' : 'idle')}
        onDragEnd={(e, info) => {
          const py = y.get() + project(info.velocity.y), px = x.get() + project(info.velocity.x)
          if (phone && py + hgt.current > mouth.get() + hgt.current * 0.3 && Math.abs(px) < 180) drop(info.velocity.y)   // heading into the slot
          else { setStatus('idle'); home(info.velocity) }
        }}
        onTap={(e) => { if (!dragged.current && !e.target.closest('a, .bcard__qr')) { setZoom(false); animate(r, Math.round(r.get() / 180) * 180 + 180, TURN) } }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); animate(r, Math.round(r.get() / 180) * 180 + 180, TURN) }
          if (e.key === 'ArrowDown' && phone) { e.preventDefault(); measure(); drop(0) }
        }}
        onPointerMove={(e) => {
          const b = e.currentTarget.getBoundingClientRect()
          e.currentTarget.style.setProperty('--mx', `${((e.clientX - b.left) / b.width) * 100}%`)
          e.currentTarget.style.setProperty('--my', `${((e.clientY - b.top) / b.height) * 100}%`)
        }}>
        <motion.div className="bcard__flip" style={{ rotateY: r, transformPerspective: 1200 }}>
          <motion.div className="bcard__face bcard__front" style={{ opacity: frontOn, pointerEvents: frontPE }}>
            <span className="bcard__mono">AA</span>
            <span className="bcard__chip" aria-hidden="true" />
            <span className="bcard__sig">Ahmed Amine</span>
            <span className="bcard__role">{t('card.role')}</span>
            <span className="bcard__city">Casablanca · MA</span>
            <span className="bcard__foil" aria-hidden="true" />
          </motion.div>
          <motion.div className="bcard__face bcard__back" style={{ opacity: backOn, pointerEvents: backPE }}>
            <div className="bcard__name">Ahmed Amine Bouricha</div>
            <div className="bcard__title">{t('card.role')}</div>
            <ul className="bcard__lines">
              <li><a draggable="false" href={LINKS.email}><Icon name="mail" size={14} />{LINKS.emailLabel}</a></li>
              <li><a draggable="false" href={LINKS.whatsapp} target="_blank" rel="noreferrer"><Icon name="wa" size={14} />+212 6 77 99 28 37</a></li>
              <li><a draggable="false" href={LINKS.linkedin} target="_blank" rel="noreferrer"><Icon name="in" size={14} />in/ahmed-amine-bouricha</a></li>
              <li><a draggable="false" href={LINKS.github} target="_blank" rel="noreferrer"><Icon name="gh" size={14} />github.com/ahmedamine12</a></li>
            </ul>
            {qr ? (
              <button className={`bcard__qr${zoom ? ' is-zoom' : ''}`} onClick={(e) => { e.stopPropagation(); setZoom(z => !z) }}
                onPointerDownCapture={(e) => e.stopPropagation()} aria-label={t('card.qr')} aria-pressed={zoom}>
                <span className="bcard__qr-code" dangerouslySetInnerHTML={{ __html: qr }} />
                <span className="bcard__qr-t">{t('card.qr')}</span>
              </button>
            ) : <span className="bcard__sig bcard__sig--small">Ahmed Amine</span>}
          </motion.div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {!used && (
          <motion.p className="bcard__hint" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.4 } }} exit={{ opacity: 0, y: 6 }}>
            {phone ? t('card.hint') : t('card.hint_pc')}
            {phone && <svg width="18" height="30" viewBox="0 0 18 30" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M9 2c-4 8 3 14 0 26" /><path d="m4 23 5 5 5-5" /></svg>}
          </motion.p>
        )}
      </AnimatePresence>

      {phone && (
      <div className={`slot slot--${status}`} ref={slot}>
          <div className="slot__mouth" />
          <div className="slot__body">
            <span className="slot__label">
              {status === 'saved' ? <><Icon name="check" size={15} stroke={2.4} />{t('card.slot_saved')}</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>{status === 'over' ? t('card.slot_over') : t('card.slot')}</>}
            </span>
          </div>
        </div>
      )}
      <motion.span className="bcard__sr" aria-live="polite">{status === 'saved' ? t('card.saved') : ''}</motion.span>
    </div>
  )
}

export default BusinessCard

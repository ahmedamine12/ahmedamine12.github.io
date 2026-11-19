import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Icon, SHEET, SNAPPY } from './ui/kit'

const Chatbot = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [busy, setBusy] = useState(false)
  const body = useRef(null)
  const questions = t('chatbot.questions', { returnObjects: true }) || []
  const answers = t('chatbot.answers', { returnObjects: true }) || {}

  useEffect(() => { if (open && msgs.length === 0) setMsgs([{ from: 'bot', text: t('chatbot.greeting') }]) }, [open, msgs.length, t])
  useEffect(() => { if (body.current) body.current.scrollTo({ top: body.current.scrollHeight, behavior: 'smooth' }) }, [msgs, busy])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const ask = (q) => {
    if (busy) return
    setMsgs(m => [...m, { from: 'me', text: q.label }])
    setBusy(true)
    setTimeout(() => { setMsgs(m => [...m, { from: 'bot', text: answers[q.key] || t('chatbot.fallback') }]); setBusy(false) }, 700)
  }

  return (
    <>
      <motion.button className={`bot-fab${open ? ' is-open' : ''}`} onClick={() => setOpen(o => !o)}
        aria-label={open ? t('chatbot.close') : t('chatbot.open')} aria-expanded={open}
        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...SNAPPY, delay: 0.6 }}
        whileTap={{ scale: 0.9, transition: { duration: 0.1 } }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={open ? 'x' : 'c'} initial={{ rotate: -90, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }} transition={SNAPPY} style={{ display: 'grid' }}>
            <Icon name={open ? 'close' : 'chat'} size={22} />
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div className="bot" role="dialog" aria-label={t('chatbot.title')}
            initial={{ opacity: 0, scale: 0.6, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.6, filter: 'blur(10px)' }} transition={SHEET}>
            <div className="bot__head">
              <span className="bot__av">AA</span>
              <div><b>{t('chatbot.title')}</b><small><span className="live-dot" />online</small></div>
            </div>
            <div className="bot__body" ref={body} aria-live="polite">
              {msgs.map((m, i) => (
                <motion.div key={i} className={`bubble bubble--${m.from}`} initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }} transition={SNAPPY}>{m.text}</motion.div>
              ))}
              {busy && <div className="bubble bubble--bot bubble--typing"><i /><i /><i /></div>}
            </div>
            <div className="bot__qs">
              {questions.map(q => <button key={q.key} onClick={() => ask(q)} disabled={busy}>{q.label}</button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chatbot

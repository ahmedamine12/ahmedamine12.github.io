import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Icon, Magnetic, SPRING, toast, useCasaTime } from './kit'
import { LINKS } from '../data'
import { InkOnView } from './Ink'
import { BusinessCard } from './Card'

export const Contact = () => {
  const { t } = useTranslation()
  return (
    <section className="section contact" id="contact">
      <div className="contact__glow" aria-hidden="true" />
      <div className="wrap contact__in">
        <motion.p className="kicker kicker--center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <span className="kicker__n">07</span><span className="kicker__line" />{t('contact.kicker')}
        </motion.p>
        <h2 className="contact__title">
          <motion.span initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={SPRING}>{t('contact.title_a')}</motion.span>
          <motion.span className="grad-text" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...SPRING, delay: 0.08 }}>{t('contact.title_b')}</motion.span>
        </h2>
        <motion.p className="lead lead--center" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...SPRING, delay: 0.15 }}>{t('contact.sub')}</motion.p>

        <BusinessCard />

        <div className="socials">
          {[
            { k: 'write', href: LINKS.email, icon: 'mail' },
            { k: 'linkedin', href: LINKS.linkedin, icon: 'in' },
            { k: 'github', href: LINKS.github, icon: 'gh' },
            { k: 'whatsapp', href: LINKS.whatsapp, icon: 'wa' },
          ].map((s, i) => (
            <Magnetic key={s.k} href={s.href} target={s.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="social"
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...SPRING, delay: 0.25 + i * 0.05 }}>
              <Icon name={s.icon} size={20} /><span>{t(`contact.${s.k}`)}</span>
            </Magnetic>
          ))}
        </div>
      </div>
    </section>
  )
}

export const Footer = () => {
  const { t } = useTranslation()
  const time = useCasaTime()
  return (
    <footer className="footer">
      <div className="wrap footer__in">
        <div className="footer__sig">
          <InkOnView text="Ahmed Amine" duration={1.9} className="ink--footer" fillClass="ink__fill--grad" />
          <span className="note note--end" aria-hidden="true">{t('notes.end')}</span>
        </div>
        <div className="footer__meta">
          <span>{t('footer.made')} · © {new Date().getFullYear()}</span>
          <span className="mono dim">{t('footer.craft')}</span>
        </div>
        <div className="footer__right">
          <span className="mono"><span className="live-dot" />{t('footer.time', { time })}</span>
          <a href="#top" className="btn-mini"><Icon name="up" size={15} />{t('footer.top')}</a>
        </div>
      </div>
    </footer>
  )
}

/* The original "thank you" moment, as a non-blocking toast (no scrim, flow stays intact). */
export const useThanks = () => {
  const { t } = useTranslation()
  useEffect(() => {
    let shown = false
    try { shown = !!sessionStorage.getItem('thanks') } catch { /* ignore */ }
    if (shown) return
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        toast(`${t('thanks.title')} ${t('thanks.text')}`, 'spark')
        try { sessionStorage.setItem('thanks', '1') } catch { /* ignore */ }
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [t])
}

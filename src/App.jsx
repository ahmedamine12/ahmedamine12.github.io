import React, { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import './i18n'
import CV_EN from './assets/CV_EN.pdf'
import CV_FR from './assets/CV_FR.pdf'
import Chatbot from './Chatbot'
import { Aurora, Brand, Intro } from './ui/Intro'
import { Dock, Toasts } from './ui/Dock'
import { Hero } from './ui/Hero'
import { About, Marquee } from './ui/About'
import { PageThread } from './ui/PageThread'
import { Experience } from './ui/Experience'
import { Work } from './ui/Work'
import { Skills, Beyond } from './ui/Skills'
import { Contact, Footer, useThanks } from './ui/Contact'
import { Stage } from './ui/Stage'
import { useToasts } from './ui/kit'
import { FlipProvider } from './ui/Flip'
import CVIMG_EN from './assets/cv_page_en.webp'
import CVIMG_FR from './assets/cv_page_fr.webp'

const CV = { en: CV_EN, fr: CV_FR }
const cvName = (lng) => `Ahmed_Amine_Bouricha_CV_${lng === 'fr' ? 'FR' : 'EN'}.pdf`

// 'full' on a first visit, 'short' (signature only) for returning visitors, nothing again in the same session
const introMode = () => {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
    if (/HeadlessChrome/.test(navigator.userAgent) || navigator.webdriver) return null
    if (sessionStorage.getItem('intro')) return null
    return localStorage.getItem('visited') ? 'short' : 'full'
  } catch { return null }
}

const App = () => {
  const { t, i18n } = useTranslation()
  const lng = i18n.language === 'fr' ? 'fr' : 'en'
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark')
  const [mode] = useState(introMode)
  const [intro, setIntro] = useState(!!mode)
  const [played] = useState(intro)
  const [toasts, dismiss] = useToasts()
  useThanks()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch { /* private mode */ }
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', theme === 'dark' ? '#05060a' : '#f5f5f7'))
  }, [theme])

  const endIntro = useCallback(() => {
    setIntro(false)
    try { sessionStorage.setItem('intro', '1'); localStorage.setItem('visited', '1') } catch { /* ignore */ }
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#about">{t('meta.skip')}</a>
      <Aurora />
      <AnimatePresence>{intro && <Intro key="intro" mode={mode} onDone={endIntro} />}</AnimatePresence>
      {!intro && (
        <FlipProvider cvImg={lng === 'fr' ? CVIMG_FR : CVIMG_EN} cvPdf={CV[lng]} cvName={cvName(lng)}
          outside={<>
            <Brand fromIntro={played} />
            <PageThread />
            <Dock theme={theme} toggleTheme={() => setTheme(x => (x === 'dark' ? 'light' : 'dark'))} />
            <Toasts items={toasts} dismiss={dismiss} />
            <Chatbot />
          </>}>
          <main>
            <Hero />
            <Marquee />
            <About />
            <Experience />
            <Work />
            <Skills />
            <Stage />
            <Beyond />
            <Contact />
          </main>
          <Footer />
        </FlipProvider>
      )}
    </MotionConfig>
  )
}

export default App

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

const saved = (() => { try { return localStorage.getItem('lang'); } catch { return null; } })();
const browser = (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    lng: saved || browser,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false }
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try { localStorage.setItem('lang', lng); } catch { /* private mode */ }
});
document.documentElement.lang = i18n.language;

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';

// Available languages
export const languages = {
  en: { name: 'English', flag: '🇺🇸' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' }
};

const resources = {
  en: {
    translation: en
  },
  es: {
    translation: es
  },
  fr: {
    translation: fr
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already does escaping
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
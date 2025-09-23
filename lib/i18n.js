// Simple i18n utility for multi-language support
// In production, this would be replaced with a more robust i18n library like react-i18next

const translations = {
  en: {
    // Common
    welcome: 'Welcome',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',

    // Navigation
    dashboard: 'Dashboard',
    challenges: 'Challenges',
    positions: 'Positions',
    performance: 'Performance',
    settings: 'Settings',

    // Challenges
    challengeStarted: 'Challenge Started',
    challengeCompleted: 'Challenge Completed!',
    congratulations: 'Congratulations!',
    certificate: 'Certificate',

    // Risk Alerts
    riskAlert: 'Risk Alert',
    drawdownAlert: 'Drawdown Alert',
    exposureAlert: 'Exposure Alert',

    // Emails
    welcomeEmail: 'Welcome to PolyProp!',
    congratsEmail: 'Congratulations on completing your challenge!',
    alertEmail: 'Important account notification'
  },
  es: {
    // Common
    welcome: 'Bienvenido',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    close: 'Cerrar',
    save: 'Guardar',
    delete: 'Eliminar',

    // Navigation
    dashboard: 'Panel',
    challenges: 'Desafíos',
    positions: 'Posiciones',
    performance: 'Rendimiento',
    settings: 'Configuración',

    // Challenges
    challengeStarted: 'Desafío Iniciado',
    challengeCompleted: '¡Desafío Completado!',
    congratulations: '¡Felicitaciones!',
    certificate: 'Certificado',

    // Risk Alerts
    riskAlert: 'Alerta de Riesgo',
    drawdownAlert: 'Alerta de Drawdown',
    exposureAlert: 'Alerta de Exposición',

    // Emails
    welcomeEmail: '¡Bienvenido a PolyProp!',
    congratsEmail: '¡Felicitaciones por completar tu desafío!',
    alertEmail: 'Notificación importante de cuenta'
  },
  fr: {
    // Common
    welcome: 'Bienvenue',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    close: 'Fermer',
    save: 'Sauvegarder',
    delete: 'Supprimer',

    // Navigation
    dashboard: 'Tableau de bord',
    challenges: 'Défis',
    positions: 'Positions',
    performance: 'Performance',
    settings: 'Paramètres',

    // Challenges
    challengeStarted: 'Défi Démarré',
    challengeCompleted: 'Défi Terminé !',
    congratulations: 'Félicitations !',
    certificate: 'Certificat',

    // Risk Alerts
    riskAlert: 'Alerte Risque',
    drawdownAlert: 'Alerte Drawdown',
    exposureAlert: 'Alerte Exposition',

    // Emails
    welcomeEmail: 'Bienvenue sur PolyProp !',
    congratsEmail: 'Félicitations pour avoir terminé votre défi !',
    alertEmail: 'Notification importante de compte'
  }
};

// Default language
let currentLanguage = 'en';

/**
 * Set the current language
 * @param {string} lang - Language code ('en', 'es', 'fr')
 */
export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
  }
};

/**
 * Get the current language
 * @returns {string} Current language code
 */
export const getLanguage = () => currentLanguage;

/**
 * Get translated text for a key
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if key not found
 * @returns {string} Translated text
 */
export const t = (key, fallback = key) => {
  const langTranslations = translations[currentLanguage] || translations.en;
  return langTranslations[key] || fallback;
};

/**
 * Get all available languages
 * @returns {string[]} Array of language codes
 */
export const getAvailableLanguages = () => Object.keys(translations);

/**
 * Get language display name
 * @param {string} langCode - Language code
 * @returns {string} Display name
 */
export const getLanguageName = (langCode) => {
  const names = {
    en: 'English',
    es: 'Español',
    fr: 'Français'
  };
  return names[langCode] || langCode;
};

export default { t, setLanguage, getLanguage, getAvailableLanguages, getLanguageName };

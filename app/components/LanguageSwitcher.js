'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '../../lib/i18n';
import { useUser } from '@clerk/nextjs';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const { user } = useUser();

  const handleLanguageChange = async (event) => {
    const languageCode = event.target.value;

    try {
      // Change i18next language
      await i18n.changeLanguage(languageCode);

      // Update user preference in Supabase if available
      if (isSupabaseConfigured && user) {
        const { error } = await supabase
          .from('users')
          .update({ language: languageCode })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating user language:', error);
        }
      }

      // Store in localStorage as backup
      localStorage.setItem('preferredLanguage', languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const currentLanguage = i18n.language || 'en';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t('language.language')}
        </label>
        <select
          value={currentLanguage}
          onChange={handleLanguageChange}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {Object.entries(languages).map(([code, { name, flag }]) => (
            <option key={code} value={code} className="bg-slate-700 text-white">
              {flag} {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

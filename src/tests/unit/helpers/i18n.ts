import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import pt from '@/locales/pt.json'

export function createTestI18n(locale: 'en' | 'pt' = 'en') {
  return createI18n({
    legacy: true,
    locale,
    fallbackLocale: 'en',
    messages: { en, pt }
  })
}

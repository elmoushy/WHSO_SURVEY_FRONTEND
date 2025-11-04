import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import enTranslations from '../i18n/en.json'
import arTranslations from '../i18n/ar.json'

type Language = 'en' | 'ar'
type Theme = 'night' | 'light'

const translations = {
  en: enTranslations,
  ar: arTranslations
}

export const useAppStore = defineStore('app', () => {
  // State - Release One: Default to Arabic RTL
  const currentLanguage = ref<Language>('ar') // Changed from 'en' to 'ar' for Release One
  const currentTheme = ref<Theme>('light')

  // Initialize from localStorage
  const initializeFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      // Initialize language - Release One: Force Arabic only
      // Force Arabic language for Release One
      currentLanguage.value = 'ar'
      localStorage.setItem('language', 'ar')
      
      // Initialize theme
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme && ['night', 'light'].includes(savedTheme)) {
        currentTheme.value = savedTheme
      }

      // Update document attributes on initialization
      updateDocumentAttributes()
    }
  }

  // Getters
  const isRTL = computed(() => currentLanguage.value === 'ar')
  const isNightMode = computed(() => currentTheme.value === 'night')
  const isLightMode = computed(() => currentTheme.value === 'light')

  // Actions
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[currentLanguage.value]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }

  const toggleLanguage = () => {
    // Release One: Only Arabic supported, no toggle needed
    currentLanguage.value = 'ar'
    localStorage.setItem('language', 'ar')
    updateDocumentAttributes()
  }

  const setLanguage = (_lang: Language) => {
    // Release One: Force Arabic only
    currentLanguage.value = 'ar'
    localStorage.setItem('language', 'ar')
    updateDocumentAttributes()
  }

  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'night' ? 'light' : 'night'
    localStorage.setItem('theme', currentTheme.value)
    updateDocumentAttributes()
  }

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
    updateDocumentAttributes()
  }

  const updateDocumentAttributes = () => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement
      html.setAttribute('lang', currentLanguage.value)
      html.setAttribute('dir', currentLanguage.value === 'ar' ? 'rtl' : 'ltr')
      html.setAttribute('data-theme', currentTheme.value)
      
      // Update font family based on language
      if (currentLanguage.value === 'ar') {
        html.style.fontFamily = '"Tajawal", sans-serif'
      } else {
        html.style.fontFamily = '"Inter", sans-serif'
      }
    }
  }

  // Initialize store
  initializeFromLocalStorage()

  return {
    // State
    currentLanguage: computed(() => currentLanguage.value),
    currentTheme: computed(() => currentTheme.value),
    
    // Getters
    isRTL,
    isNightMode,
    isLightMode,
    
    // Actions
    t,
    toggleLanguage,
    setLanguage,
    toggleTheme,
    setTheme,
    updateDocumentAttributes,
    initializeFromLocalStorage
  }
})

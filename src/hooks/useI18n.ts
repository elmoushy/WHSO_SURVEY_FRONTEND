import { storeToRefs } from 'pinia'
import { useAppStore } from '../stores/useAppStore'

export function useI18n() {
  const appStore = useAppStore()
  const {
    currentLanguage,
    currentTheme,
    isRTL,
    isNightMode,
    isLightMode
  } = storeToRefs(appStore)

  return {
    t: appStore.t,
    toggleLanguage: appStore.toggleLanguage,
    setLanguage: appStore.setLanguage,
    toggleTheme: appStore.toggleTheme,
    setTheme: appStore.setTheme,
    updateDocumentAttributes: appStore.updateDocumentAttributes,
    currentLanguage,
    currentTheme,
    isRTL,
    isNightMode,
    isLightMode
  }
}

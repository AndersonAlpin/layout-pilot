(() => {
  const root = window.LayoutPilotModules ||= {}
  const { STORAGE_KEYS } = root.constants

  const SUPPORTED_LANGUAGES = ['pt-BR', 'en', 'es']
  const AUTO_LANGUAGE = 'auto'
  const FALLBACK_LANGUAGE = 'en'

  let currentLanguage = resolveLanguage(AUTO_LANGUAGE)
  let currentPreference = AUTO_LANGUAGE

  function normalizeLanguage(language) {
    const value = String(language || '').trim().toLowerCase()
    if (!value) return ''
    if (value === 'pt-br' || value === 'pt-pt' || value === 'pt' || value.startsWith('pt-')) return 'pt-BR'
    if (value === 'en' || value.startsWith('en-')) return 'en'
    if (value === 'es' || value.startsWith('es-')) return 'es'
    return ''
  }

  function isSupportedLanguage(language) {
    return SUPPORTED_LANGUAGES.includes(language)
  }

  function normalizePreference(preference) {
    if (preference === AUTO_LANGUAGE) return AUTO_LANGUAGE
    const normalized = normalizeLanguage(preference)
    return isSupportedLanguage(normalized) ? normalized : AUTO_LANGUAGE
  }

  function getBrowserLanguage() {
    return navigator.languages?.[0] || navigator.language || FALLBACK_LANGUAGE
  }

  function resolveLanguage(preference = AUTO_LANGUAGE) {
    const normalizedPreference = normalizePreference(preference)
    if (normalizedPreference !== AUTO_LANGUAGE) return normalizedPreference

    const browserLanguage = normalizeLanguage(getBrowserLanguage()) || FALLBACK_LANGUAGE
    return isSupportedLanguage(browserLanguage) ? browserLanguage : FALLBACK_LANGUAGE
  }

  async function getLanguagePreference() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.LANGUAGE)
      return normalizePreference(result?.[STORAGE_KEYS.LANGUAGE] || AUTO_LANGUAGE)
    } catch {
      return AUTO_LANGUAGE
    }
  }

  async function setLanguagePreference(preference) {
    const normalizedPreference = normalizePreference(preference)
    await chrome.storage.local.set({ [STORAGE_KEYS.LANGUAGE]: normalizedPreference })
    setCurrentLanguage(resolveLanguage(normalizedPreference), normalizedPreference)
    return {
      preference: normalizedPreference,
      language: currentLanguage
    }
  }

  async function loadLanguagePreference() {
    const preference = await getLanguagePreference()
    setCurrentLanguage(resolveLanguage(preference), preference)
    return {
      preference,
      language: currentLanguage
    }
  }

  function setCurrentLanguage(language, preference = currentPreference) {
    currentLanguage = isSupportedLanguage(language) ? language : FALLBACK_LANGUAGE
    currentPreference = normalizePreference(preference)
  }

  function getCurrentLanguage() {
    return currentLanguage
  }

  function getCurrentPreference() {
    return currentPreference
  }

  function interpolate(value, params) {
    if (!params) return value
    return String(value).replace(/\{(\w+)\}/g, (match, key) => {
      if (params[key] === undefined || params[key] === null) return match
      return String(params[key])
    })
  }

  function getByPath(source, path) {
    return String(path || '')
      .split('.')
      .reduce((current, key) => current && current[key] != null ? current[key] : undefined, source)
  }

  function t(key, params) {
    const locales = root.locales || {}
    const dictionary = locales[currentLanguage] || locales[FALLBACK_LANGUAGE] || {}
    const fallback = locales[FALLBACK_LANGUAGE] || {}
    const value = getByPath(dictionary, key) ?? getByPath(fallback, key) ?? key
    return interpolate(typeof value === 'string' ? value : String(value), params)
  }

  root.i18n = {
    SUPPORTED_LANGUAGES,
    AUTO_LANGUAGE,
    FALLBACK_LANGUAGE,
    normalizeLanguage,
    normalizePreference,
    resolveLanguage,
    getLanguagePreference,
    setLanguagePreference,
    loadLanguagePreference,
    setCurrentLanguage,
    getCurrentLanguage,
    getCurrentPreference,
    t
  }
})()

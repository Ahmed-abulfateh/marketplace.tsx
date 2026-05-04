import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  copyByLanguage,
  translateCatalogText,
  translateListingStatus,
  translateOrderStatus,
  translateRoleLabel,
} from '../content/copy'
import type { ListingStatus, MarketplaceRole, OrderStatus } from '../types'

export type Language = 'en' | 'ar'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  locale: string
  direction: 'ltr' | 'rtl'
  copy: (typeof copyByLanguage)[Language]
  formatCurrency: (value: number) => string
  translateCatalogText: (value: string) => string
  translateRoleLabel: (role: MarketplaceRole) => string
  translateListingStatus: (status: ListingStatus) => string
  translateOrderStatus: (status: OrderStatus) => string
}

const LANGUAGE_KEY = 'signal-market-language'

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY)
    return savedLanguage === 'ar' ? 'ar' : 'en'
  })

  useEffect(() => {
    const direction = language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
    document.documentElement.dir = direction
    window.localStorage.setItem(LANGUAGE_KEY, language)
  }, [language])

  const value = useMemo<LanguageContextValue>(() => {
    const locale = language === 'ar' ? 'ar-BH' : 'en-BH'

    return {
      language,
      setLanguage,
      locale,
      direction: language === 'ar' ? 'rtl' : 'ltr',
      copy: copyByLanguage[language],
      formatCurrency: (amount) =>
        new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'BHD',
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }).format(amount),
      translateCatalogText: (value) => translateCatalogText(value, language),
      translateRoleLabel: (role) => translateRoleLabel(role, language),
      translateListingStatus: (status) => translateListingStatus(status, language),
      translateOrderStatus: (status) => translateOrderStatus(status, language),
    }
  }, [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

const useLanguage = () => {
  const value = useContext(LanguageContext)

  if (!value) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }

  return value
}

export { LanguageProvider, useLanguage }
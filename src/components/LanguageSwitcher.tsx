import { useLanguage } from '../context/LanguageContext'

function LanguageSwitcher() {
  const { copy, language, setLanguage } = useLanguage()

  return (
    <div className="language-switch" aria-label={copy.common.language}>
      <button
        type="button"
        className={language === 'en' ? 'role-chip role-chip-active' : 'role-chip'}
        onClick={() => setLanguage('en')}
      >
        {copy.common.english}
      </button>
      <button
        type="button"
        className={language === 'ar' ? 'role-chip role-chip-active' : 'role-chip'}
        onClick={() => setLanguage('ar')}
      >
        {copy.common.arabic}
      </button>
    </div>
  )
}

export default LanguageSwitcher
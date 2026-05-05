import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import type { ProfileInput } from '../types'

const buildProfileForm = (session: {
  username: string
  email: string
  phone: string
  addressLine: string
  city: string
  road: string
  block: string
  country: string
}): ProfileInput => ({
  username: session.username,
  email: session.email,
  phone: session.phone,
  addressLine: session.addressLine,
  city: session.city,
  road: session.road,
  block: session.block,
  country: session.country,
})

function ProfilePage() {
  const { copy, translateRoleLabel } = useLanguage()
  const { isReady, session, updateProfile } = useMarketplace()
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [form, setForm] = useState<ProfileInput | null>(null)

  useEffect(() => {
    if (session) {
      setForm(buildProfileForm(session))
    }
  }, [session])

  if (!isReady) {
    return <main className="loading-shell">{copy.common.loading}</main>
  }

  if (!session || !form) {
    return <Navigate to="/sign-in" replace />
  }

  const handleChange = (field: keyof ProfileInput, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(null)
    setIsSaving(true)

    try {
      await updateProfile(form)
      setNotice({ tone: 'success', message: copy.profile.notices.updated })
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : copy.profile.notices.updateError,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="page-stack">
      <PageHero
        variant="product"
        kicker={copy.profile.kicker}
        title={copy.profile.title(translateRoleLabel(session.role))}
        summary={copy.profile.summary}
        aside={
          <>
            <p className="card-label">{copy.profile.savedAddressLabel}</p>
            <p>{copy.profile.savedAddressSummary}</p>
          </>
        }
      />

      <section className="market-grid">
        <div className="section-heading compact">
          <p className="section-kicker">{copy.profile.formKicker}</p>
          <h2>{copy.profile.formTitle}</h2>
        </div>
        {notice ? (
          <p className={notice.tone === 'success' ? 'form-notice form-notice-success' : 'form-notice form-notice-error'}>
            {notice.message}
          </p>
        ) : null}
        <form className="form-grid" onSubmit={handleSubmit}>
          <input value={form.username} onChange={(event) => handleChange('username', event.target.value)} placeholder={copy.profile.fields.username} required />
          <input value={form.email} onChange={(event) => handleChange('email', event.target.value)} type="email" placeholder={copy.profile.fields.email} required />
          <input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} placeholder={copy.profile.fields.phone} required />
          <input value={form.country} onChange={(event) => handleChange('country', event.target.value)} placeholder={copy.profile.fields.country} />
          <input value={form.city} onChange={(event) => handleChange('city', event.target.value)} placeholder={copy.profile.fields.city} />
          <input value={form.block} onChange={(event) => handleChange('block', event.target.value)} placeholder={copy.profile.fields.block} />
          <input value={form.road} onChange={(event) => handleChange('road', event.target.value)} placeholder={copy.profile.fields.road} />
          <textarea value={form.addressLine} onChange={(event) => handleChange('addressLine', event.target.value)} placeholder={copy.profile.fields.addressLine} />
          <div className="card-actions">
            <button type="submit" className="button button-primary" disabled={isSaving}>
              {copy.profile.save}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default ProfilePage

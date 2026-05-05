import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { useLanguage } from '../context/LanguageContext'
import marketplaceApi from '../lib/marketplaceApi'

function ResetPasswordPage() {
  const { copy } = useLanguage()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <main className="page-stack">
        <PageHero
          variant="product"
          kicker={copy.resetPassword.kicker}
          title={copy.resetPassword.title}
          summary={copy.resetPassword.summary}
          aside={null}
        />
        <section className="market-grid">
          <p className="form-notice form-notice-error">{copy.resetPassword.notices.invalid}</p>
          <Link to="/profile" className="button button-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            ← {copy.profile.kicker}
          </Link>
        </section>
      </main>
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(null)

    if (newPassword !== confirmPassword) {
      setNotice({ tone: 'error', message: copy.resetPassword.notices.mismatch })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await marketplaceApi.resetPassword(token, newPassword)
      setNotice({ tone: 'success', message: result.message || copy.resetPassword.notices.success })
      setDone(true)
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : copy.resetPassword.notices.invalid,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-stack">
      <PageHero
        variant="product"
        kicker={copy.resetPassword.kicker}
        title={copy.resetPassword.title}
        summary={copy.resetPassword.summary}
        aside={null}
      />
      <section className="market-grid">
        <div className="section-heading compact">
          <h2>{copy.resetPassword.title}</h2>
        </div>
        {notice ? (
          <p className={notice.tone === 'success' ? 'form-notice form-notice-success' : 'form-notice form-notice-error'}>
            {notice.message}
          </p>
        ) : null}
        {done ? (
          <Link to="/sign-in" className="button button-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Sign in
          </Link>
        ) : (
          <form className="form-grid" onSubmit={handleSubmit}>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder={copy.resetPassword.newPasswordLabel}
              minLength={8}
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={copy.resetPassword.confirmPasswordLabel}
              minLength={8}
              required
            />
            <div className="card-actions">
              <button type="submit" className="button button-primary" disabled={isSubmitting}>
                {copy.resetPassword.submit}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}

export default ResetPasswordPage

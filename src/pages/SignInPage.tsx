import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import { useState } from 'react'

function SignInPage() {
  const { copy } = useLanguage()
  const { isReady, session, signIn } = useMarketplace()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  if (!isReady) {
    return <main className="loading-shell">{copy.common.loading}</main>
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      await signIn(form)
      navigate(redirectTo, { replace: true })
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : copy.signIn.error)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-header">
          <div>
            <p className="section-kicker">{copy.signIn.kicker}</p>
            <h1>{copy.signIn.title}</h1>
            <p className="lead page-lead">{copy.signIn.summary}</p>
          </div>
          <LanguageSwitcher />
        </div>
        {error ? <p className="form-notice form-notice-error">{error}</p> : null}
        <form className="form-grid auth-form" onSubmit={handleSignIn}>
          <input
            value={form.identifier}
            onChange={(event) => setForm((current) => ({ ...current, identifier: event.target.value }))}
            placeholder={copy.signIn.identifier}
            required
          />
          <input
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            type="password"
            placeholder={copy.signIn.password}
            required
          />
          <div className="card-actions auth-actions">
            <button type="submit" className="button button-primary">{copy.signIn.submit}</button>
            <Link className="button button-ghost" to="/sign-up">{copy.signIn.createAccount}</Link>
          </div>
        </form>
      </section>
    </main>
  )
}

export default SignInPage
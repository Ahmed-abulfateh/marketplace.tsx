import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import type { MarketplaceRole } from '../types'

function SignUpPage() {
  const { copy, translateRoleLabel } = useLanguage()
  const { isReady, session, signUp } = useMarketplace()
  const navigate = useNavigate()
  const publicRoles: MarketplaceRole[] = ['buyer', 'seller']
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'buyer' as MarketplaceRole,
  })
  const [error, setError] = useState<string | null>(null)

  if (!isReady) {
    return <main className="loading-shell">{copy.common.loading}</main>
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    try {
      await signUp(form)
      navigate('/', { replace: true })
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : copy.signUp.error)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-header">
          <div>
            <p className="section-kicker">{copy.signUp.kicker}</p>
            <h1>{copy.signUp.title}</h1>
            <p className="lead page-lead">{copy.signUp.summary}</p>
          </div>
          <LanguageSwitcher />
        </div>
        {error ? <p className="form-notice form-notice-error">{error}</p> : null}
        <form className="form-grid auth-form" onSubmit={handleSubmit}>
          <input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder={copy.signUp.username} required />
          <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} type="email" placeholder={copy.signUp.email} required />
          <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder={copy.signUp.phone} required />
          <input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} type="password" placeholder={copy.signUp.password} required />
          <label className="search-field" htmlFor="role-select">
            <span className="section-kicker">{copy.signUp.role}</span>
            <select
              id="role-select"
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as MarketplaceRole }))}
            >
              {publicRoles.map((role) => (
                <option key={role} value={role}>{translateRoleLabel(role)}</option>
              ))}
            </select>
          </label>
          <div className="card-actions auth-actions">
            <button type="submit" className="button button-primary">{copy.signUp.submit}</button>
            <Link className="button button-ghost" to="/sign-in">{copy.signUp.haveAccount}</Link>
          </div>
        </form>
      </section>
    </main>
  )
}

export default SignUpPage
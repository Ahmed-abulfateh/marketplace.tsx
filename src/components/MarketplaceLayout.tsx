import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import logoSrc from '../assets/logo.png'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function MarketplaceLayout() {
  const { copy, language, setLanguage, translateRoleLabel } = useLanguage()
  const { cartIds, favoriteIds, session, signOut } = useMarketplace()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')

  // Keep header search bar in sync when navigating to /browse with a query
  useEffect(() => {
    if (location.pathname === '/browse') {
      setSearchQuery(searchParams.get('q') ?? '')
    } else if (location.pathname !== '/browse') {
      setSearchQuery('')
    }
  }, [location.pathname, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse')
  }

  const navItems = [
    { to: '/', label: copy.layout.nav.home, end: true },
    { to: '/browse', label: copy.layout.nav.browse },
    ...(session?.role === 'seller' ? [{ to: '/seller', label: copy.layout.nav.seller }] : []),
    ...(session?.role === 'admin' ? [{ to: '/admin', label: copy.layout.nav.admin }] : []),
    ...(session ? [{ to: '/shipments', label: copy.layout.nav.shipments }] : []),
    { to: '/checkout', label: copy.layout.nav.checkout },
  ]

  return (
    <div className="app-shell">
      <header className="site-header">
        {/* Top bar: logo + search + actions */}
        <div className="header-top">
          <Link to="/" className="header-logo-link">
            <img src={logoSrc} alt={copy.layout.brand} className="header-logo" />
          </Link>

          <form className="header-search-form" onSubmit={handleSearch} role="search">
            <input
              className="header-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.browse.searchPlaceholder}
              aria-label={copy.browse.searchKicker}
            />
            <button type="submit" className="header-search-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          <div className="header-actions">
            {/* Language toggle */}
            <button
              type="button"
              className="header-icon-btn header-lang-btn"
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              title={language === 'en' ? copy.common.arabic : copy.common.english}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{language === 'en' ? 'EN' : 'AR'}</span>
            </button>

            {/* Favorites */}
            <Link to="/checkout" className="header-icon-btn" title={copy.common.savedCount(favoriteIds.length)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {favoriteIds.length > 0 && <span className="header-badge">{favoriteIds.length}</span>}
            </Link>

            {/* Cart */}
            <Link to="/checkout" className="header-icon-btn" title={copy.common.cartCount(cartIds.length)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartIds.length > 0 && <span className="header-badge">{cartIds.length}</span>}
            </Link>

            {/* Shipments */}
            {session ? (
              <Link to="/shipments" className="header-icon-btn" title={copy.layout.nav.shipments}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="1.5" />
                  <circle cx="18.5" cy="18.5" r="1.5" />
                </svg>
              </Link>
            ) : null}

            {/* Profile / Auth */}
            {session ? (
              <div className="header-profile">
                <div className="header-icon-btn header-profile-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="header-profile-name">{session.name}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
                <div className="header-profile-dropdown">
                  <span className="dropdown-role">{translateRoleLabel(session.role)}</span>
                  <button type="button" className="dropdown-item" onClick={() => void signOut()}>
                    {copy.layout.signOut}
                  </button>
                </div>
              </div>
            ) : (
              <div className="header-auth-btns">
                <Link className="header-auth-link" to="/sign-in">{copy.layout.signIn}</Link>
                <Link className="header-auth-link header-auth-link-primary" to="/sign-up">{copy.layout.signUp}</Link>
              </div>
            )}
          </div>
        </div>

        {/* Nav bar */}
        <nav className="header-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => isActive ? 'header-nav-link header-nav-link-active' : 'header-nav-link'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Outlet />

      <footer className="site-footer">
      </footer>
    </div>
  )
}

export default MarketplaceLayout
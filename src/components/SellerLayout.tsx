import { NavLink, Outlet } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

function SellerLayout() {
  const { copy } = useLanguage()

  return (
    <main className="page-stack">
      <section className="subnav-panel">
        <p className="section-kicker">{copy.sellerLayout.kicker}</p>
        <nav className="subnav-links" aria-label="Seller pages">
          <NavLink end to="/seller" className={({ isActive }) => (isActive ? 'subnav-link subnav-link-active' : 'subnav-link')}>
            {copy.sellerLayout.dashboard}
          </NavLink>
          <NavLink to="/seller/orders" className={({ isActive }) => (isActive ? 'subnav-link subnav-link-active' : 'subnav-link')}>
            {copy.sellerLayout.orders}
          </NavLink>
        </nav>
      </section>
      <Outlet />
    </main>
  )
}

export default SellerLayout
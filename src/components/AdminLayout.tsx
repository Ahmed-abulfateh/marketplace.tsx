import { NavLink, Outlet } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

function AdminLayout() {
  const { copy } = useLanguage()

  return (
    <main className="page-stack">
      <section className="subnav-panel">
        <p className="section-kicker">{copy.adminLayout.kicker}</p>
        <nav className="subnav-links" aria-label="Admin pages">
          <NavLink end to="/admin" className={({ isActive }) => (isActive ? 'subnav-link subnav-link-active' : 'subnav-link')}>
            {copy.adminLayout.dashboard}
          </NavLink>
          <NavLink to="/admin/consumers" className={({ isActive }) => (isActive ? 'subnav-link subnav-link-active' : 'subnav-link')}>
            {copy.adminLayout.consumers}
          </NavLink>
          <NavLink to="/admin/moderation" className={({ isActive }) => (isActive ? 'subnav-link subnav-link-active' : 'subnav-link')}>
            {copy.adminLayout.moderation}
          </NavLink>
          <NavLink to="/admin/sellers" className={({ isActive }) => (isActive ? 'subnav-link subnav-link-active' : 'subnav-link')}>
            {copy.adminLayout.sellers}
          </NavLink>
        </nav>
      </section>
      <Outlet />
    </main>
  )
}

export default AdminLayout
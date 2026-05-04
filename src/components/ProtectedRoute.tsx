import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import type { MarketplaceRole } from '../types'

type ProtectedRouteProps = {
  roles?: MarketplaceRole[]
}

function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { copy } = useLanguage()
  const { isReady, session } = useMarketplace()
  const location = useLocation()

  if (!isReady) {
    return <main className="loading-shell">{copy.common.loading}</main>
  }

  if (!session) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(session.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
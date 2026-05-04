import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function AdminSellersPage() {
  const { copy } = useLanguage()
  const { pendingSellers, updateSellerStatus } = useMarketplace()
  const [actionNotice, setActionNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleStatus = async (userId: string, status: 'pending' | 'active') => {
    setActionNotice(null)
    setLoadingId(userId)

    try {
      await updateSellerStatus(userId, status)
    } catch {
      setActionNotice({ tone: 'error', message: copy.adminSellers.approveError })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <section className="market-grid">
      <div className="section-heading compact">
        <p className="section-kicker">{copy.adminSellers.kicker}</p>
        <h2>{copy.adminSellers.title}</h2>
        <p>{copy.adminSellers.summary}</p>
      </div>
      {actionNotice ? (
        <p className={actionNotice.tone === 'success' ? 'form-notice form-notice-success' : 'form-notice form-notice-error'}>
          {actionNotice.message}
        </p>
      ) : null}
      {pendingSellers.length === 0 ? (
        <article className="queue-card">
          <p>{copy.adminSellers.noSellers}</p>
        </article>
      ) : (
        <div className="queue-grid admin-order-grid">
          {pendingSellers.map((seller) => (
            <article className="queue-card" key={seller.id}>
              <p className="card-label">{copy.adminSellers.statusLabel}: {seller.accountStatus === 'pending' ? copy.adminSellers.statusPending : copy.adminSellers.statusActive}</p>
              <h3>{seller.username}</h3>
              <p>{seller.email}</p>
              <p style={{ opacity: 0.6, fontSize: '0.85em' }}>{seller.phone}</p>
              <div className="card-actions">
                {seller.accountStatus === 'pending' ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={loadingId === seller.id}
                    onClick={() => void handleStatus(seller.id, 'active')}
                  >
                    {copy.adminSellers.approve}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button-ghost"
                    disabled={loadingId === seller.id}
                    onClick={() => void handleStatus(seller.id, 'pending')}
                  >
                    {copy.adminSellers.reject}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default AdminSellersPage

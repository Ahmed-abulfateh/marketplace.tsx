import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function AdminSellersPage() {
  const { copy } = useLanguage()
  const { pendingSellers, updateSellerStatus } = useMarketplace()
  const [actionNotice, setActionNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [statusDrafts, setStatusDrafts] = useState<Record<string, 'pending' | 'active'>>({})

  useEffect(() => {
    setStatusDrafts((current) => {
      let hasChanges = false
      const next = { ...current }
      const sellerIds = new Set(pendingSellers.map((seller) => seller.id))

      pendingSellers.forEach((seller) => {
        if (next[seller.id] !== seller.accountStatus) {
          next[seller.id] = seller.accountStatus
          hasChanges = true
        }
      })

      Object.keys(next).forEach((sellerId) => {
        if (!sellerIds.has(sellerId)) {
          delete next[sellerId]
          hasChanges = true
        }
      })

      return hasChanges ? next : current
    })
  }, [pendingSellers])

  const handleStatus = async (userId: string, status: 'pending' | 'active') => {
    setActionNotice(null)
    setLoadingId(userId)

    try {
      await updateSellerStatus(userId, status)
      setActionNotice({ tone: 'success', message: `Seller status updated to ${status}.` })
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
              <p className="card-label">{copy.adminSellers.statusLabel}</p>
              <h3>{seller.username}</h3>
              <p>{seller.email}</p>
              <p style={{ opacity: 0.6, fontSize: '0.85em' }}>{seller.phone}</p>
              <div className="form-grid compact-form-grid">
                <select
                  value={statusDrafts[seller.id] ?? seller.accountStatus}
                  onChange={(event) =>
                    setStatusDrafts((current) => ({
                      ...current,
                      [seller.id]: event.target.value as 'pending' | 'active',
                    }))
                  }
                  disabled={loadingId === seller.id}
                >
                  <option value="pending">{copy.adminSellers.statusPending}</option>
                  <option value="active">{copy.adminSellers.statusActive}</option>
                </select>
              </div>
              <div className="card-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={loadingId === seller.id || (statusDrafts[seller.id] ?? seller.accountStatus) === seller.accountStatus}
                  onClick={() => void handleStatus(seller.id, statusDrafts[seller.id] ?? seller.accountStatus)}
                >
                  {copy.common.save}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default AdminSellersPage

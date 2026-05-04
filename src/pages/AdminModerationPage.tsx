import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function AdminModerationPage() {
  const { copy, translateCatalogText, translateListingStatus } = useLanguage()
  const { deleteListing, listingStatuses, listings } = useMarketplace()
  const [actionNotice, setActionNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const handleDeleteListing = async (listingId: string, title: string) => {
    setActionNotice(null)

    if (!window.confirm(copy.common.deletePrompt(translateCatalogText(title)))) {
      return
    }

    try {
      await deleteListing(listingId)
      setActionNotice({ tone: 'success', message: copy.seller.notices.deleted })
    } catch (error) {
      setActionNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : copy.moderation.notices.deleteError,
      })
    }
  }

  return (
    <section className="market-grid">
      <div className="section-heading compact">
        <p className="section-kicker">{copy.moderation.boardKicker}</p>
        <h2>{copy.moderation.boardTitle}</h2>
      </div>
      {actionNotice ? (
        <p className={actionNotice.tone === 'success' ? 'form-notice form-notice-success' : 'form-notice form-notice-error'}>
          {actionNotice.message}
        </p>
      ) : null}
      <div className="queue-grid admin-order-grid">
        {listings.map((listing) => (
          <article className="queue-card" key={listing.id}>
            <p className="card-label">{translateCatalogText(listing.category)}</p>
            <h3>{translateCatalogText(listing.title)}</h3>
            <p>{listing.seller}</p>
            <div className="listing-footer">
              <strong>{translateListingStatus(listingStatuses[listing.id] ?? listing.status)}</strong>
              <span>{translateCatalogText(listing.trust)}</span>
            </div>
            <div className="card-actions">
              <Link className="inline-link" to={`/admin/moderation/${listing.id}`}>
                {copy.moderation.reviewListing}
              </Link>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => void handleDeleteListing(listing.id, listing.title)}
              >
                {copy.moderation.deleteProduct}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default AdminModerationPage
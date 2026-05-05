import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function SellerOrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { copy, formatCurrency, translateCatalogText, translateOrderStatus } = useLanguage()
  const { advanceOrderStatus, isReady, listings, orders, session } = useMarketplace()
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isReady) {
    return <main className="loading-shell">{copy.common.loading}</main>
  }

  const order = orders.find((item) => item.id === orderId)

  if (!order) {
    return <Navigate to="/seller/orders" replace />
  }

  const listing = listings.find((item) => item.id === order.listingId)

  const isManagedBySeller = session?.role !== 'seller' || listing?.seller === session?.name

  if (!isManagedBySeller) {
    return <Navigate to="/seller/orders" replace />
  }

  const handleAdvanceOrder = async () => {
    if (isSubmitting) {
      return
    }

    const wasPending = order.status === 'pending'
    setIsSubmitting(true)

    try {
      await advanceOrderStatus(order.id)

      if (wasPending) {
        navigate('/seller/orders?view=to-ship', {
          replace: true,
          state: { notice: copy.sellerOrders.confirmedNotice },
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="product-layout">
      <article className="product-panel">
        <div className="section-heading compact">
          <p className="section-kicker">{copy.sellerOrderDetail.kicker}</p>
          <h2>{order.id}</h2>
        </div>
        <div className="product-details-grid">
          <div>
            <span className="product-label">{copy.sellerOrderDetail.listing}</span>
            <strong>{listing ? translateCatalogText(listing.title) : order.listingId}</strong>
          </div>
          <div>
            <span className="product-label">{copy.sellerOrderDetail.buyer}</span>
            <strong>{order.buyer}</strong>
          </div>
          <div>
            <span className="product-label">{copy.sellerOrderDetail.status}</span>
            <strong>{translateOrderStatus(order.status)}</strong>
          </div>
        </div>
      </article>
      <aside className="purchase-panel">
        <p className="card-label">{copy.sellerOrderDetail.actionsLabel}</p>
        <strong className="purchase-price">{formatCurrency(order.total)}</strong>
        <p>{copy.sellerOrderDetail.summary}</p>
        <div className="card-actions vertical-actions">
          <button
            type="button"
            className="button button-primary"
            onClick={() => void handleAdvanceOrder()}
            disabled={order.status === 'delivered' || isSubmitting}
          >
            {order.status === 'delivered' ? copy.sellerOrderDetail.delivered : copy.sellerOrderDetail.advance}
          </button>
          <Link className="inline-link" to="/seller/orders">
            {copy.sellerOrderDetail.back}
          </Link>
        </div>
      </aside>
    </section>
  )
}

export default SellerOrderDetailPage
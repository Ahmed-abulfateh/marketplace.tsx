import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function SellerOrderDetailPage() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { copy, formatCurrency, language, translateCatalogText, translateOrderStatus } = useLanguage()
  const { advanceOrderStatus, isReady, listings, orders, sendOrderMessage, session } = useMarketplace()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [chatError, setChatError] = useState<string | null>(null)

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
      const requestedStatus = order.status === 'shipped' ? 'complete' : undefined
      await advanceOrderStatus(order.id, requestedStatus)

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

  const handleSendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const text = messageText.trim()

    if (!text) {
      return
    }

    setChatError(null)

    try {
      await sendOrderMessage(order.id, text)
      setMessageText('')
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Could not send message.')
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
            <strong className={order.status === 'delivered' ? 'order-status order-status-complete' : 'order-status'}>
              {translateOrderStatus(order.status)}
            </strong>
          </div>
        </div>
        <div className="section-heading compact product-section-spacing">
          <p className="section-kicker">Live chat</p>
          <h2>Buyer and seller thread</h2>
        </div>
        <div className="review-grid">
          {(order.messages ?? []).length === 0 ? (
            <article className="review-card">
              <p>No messages yet for this order.</p>
            </article>
          ) : (order.messages ?? []).map((message) => (
            <article className="review-card" key={`${message.senderId}-${message.createdAt}-${message.text}`}>
              <div className="listing-footer review-header-row">
                <div>
                  <strong>{message.senderName}</strong>
                  <p className="microcopy">
                    {new Date(message.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
                <span className="badge">{message.senderRole}</span>
              </div>
              <p>{message.text}</p>
            </article>
          ))}
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
            {order.status === 'delivered'
              ? copy.sellerOrderDetail.delivered
              : order.status === 'shipped'
                ? 'Mark Delivered / Complete'
                : copy.sellerOrderDetail.advance}
          </button>
          <Link className="inline-link" to="/seller/orders">
            {copy.sellerOrderDetail.back}
          </Link>
        </div>
        <form className="form-grid compact-form-grid" onSubmit={handleSendMessage}>
          <textarea
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Write a message to the buyer"
            required
          />
          {chatError ? <p className="form-notice form-notice-error">{chatError}</p> : null}
          <button type="submit" className="button button-secondary">Send message</button>
        </form>
      </aside>
    </section>
  )
}

export default SellerOrderDetailPage
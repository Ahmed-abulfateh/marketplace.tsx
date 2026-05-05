import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import type { OrderStatus } from '../types'

type QueueView = 'all' | 'to-ship' | 'shipped' | 'delivered'

type SellerOrdersLocationState = {
  notice?: string
}

function SellerOrdersPage() {
  const { copy, formatCurrency, translateCatalogText, translateOrderStatus } = useLanguage()
  const { advanceOrderStatus, listings, orders, session } = useMarketplace()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const locationState = location.state as SellerOrdersLocationState | null
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [statusDrafts, setStatusDrafts] = useState<Record<string, OrderStatus>>({})

  const managedListingIds = new Set(
    listings.filter((listing) => listing.seller === session?.name).map((listing) => listing.id),
  )

  const sellerOrders = orders.filter((order) => managedListingIds.has(order.listingId))

  useEffect(() => {
    setStatusDrafts((current) => {
      let hasChanges = false
      const next = { ...current }
      const orderIds = new Set(sellerOrders.map((order) => order.id))

      sellerOrders.forEach((order) => {
        if (next[order.id] !== order.status) {
          next[order.id] = order.status
          hasChanges = true
        }
      })

      Object.keys(next).forEach((orderId) => {
        if (!orderIds.has(orderId)) {
          delete next[orderId]
          hasChanges = true
        }
      })

      return hasChanges ? next : current
    })
  }, [sellerOrders])

  const requestedView = searchParams.get('view') as QueueView | null
  const activeView: QueueView =
    requestedView && ['all', 'to-ship', 'shipped', 'delivered'].includes(requestedView)
      ? requestedView
      : 'all'

  const viewButtons: Array<{ id: QueueView; label: string }> = [
    { id: 'all', label: copy.sellerOrders.filters.all },
    { id: 'to-ship', label: copy.sellerOrders.filters.toShip },
    { id: 'shipped', label: copy.sellerOrders.filters.shipped },
    { id: 'delivered', label: copy.sellerOrders.filters.delivered },
  ]

  const visibleOrders = sellerOrders.filter((order) => {
    if (activeView === 'all') {
      return true
    }

    if (activeView === 'to-ship') {
      return order.status === 'paid'
    }

    return order.status === activeView
  })

  const handleSaveStatus = async (orderId: string, status: OrderStatus) => {
    if (updatingOrderId) {
      return
    }

    setUpdatingOrderId(orderId)

    try {
      await advanceOrderStatus(orderId, status)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <section className="market-grid">
      <div className="section-heading compact">
        <p className="section-kicker">{copy.sellerOrders.kicker}</p>
        <h2>{copy.sellerOrders.title}</h2>
      </div>
      {locationState?.notice ? <p className="form-notice form-notice-success">{locationState.notice}</p> : null}
      <section className="filter-strip">
        {viewButtons.map((button) => (
          <button
            key={button.id}
            type="button"
            className={button.id === activeView ? 'filter-chip filter-chip-active' : 'filter-chip'}
            onClick={() => setSearchParams(button.id === 'all' ? {} : { view: button.id }, { replace: true })}
          >
            {button.label}
          </button>
        ))}
      </section>
      <div className="queue-grid admin-order-grid">
        {visibleOrders.length === 0 ? (
          <article className="queue-card">
            <p>{copy.sellerOrders.noOrders}</p>
          </article>
        ) : visibleOrders.map((order) => {
          const listing = listings.find((item) => item.id === order.listingId)

          return (
            <article className="queue-card" key={order.id}>
              <div className="order-item-meta-grid">
                <div>
                  <span className="product-label">{copy.common.orderId}</span>
                  <strong>{order.id}</strong>
                </div>
                <div>
                  <span className="product-label">{copy.common.product}</span>
                  <p>{listing ? translateCatalogText(listing.title) : order.listingId}</p>
                </div>
                <div>
                  <span className="product-label">{copy.common.buyer}</span>
                  <p>{order.buyer}</p>
                </div>
                <div>
                  <span className="product-label">{copy.common.totalLabel}</span>
                  <strong>{formatCurrency(order.total)}</strong>
                </div>
                <div>
                  <span className="product-label">{copy.common.status}</span>
                  <p className={order.status === 'delivered' ? 'order-status order-status-complete' : 'order-status'}>
                    {translateOrderStatus(order.status)}
                  </p>
                </div>
              </div>
              <div className="card-actions">
                <select
                  value={statusDrafts[order.id] ?? order.status}
                  onChange={(event) =>
                    setStatusDrafts((current) => ({
                      ...current,
                      [order.id]: event.target.value as OrderStatus,
                    }))
                  }
                  disabled={updatingOrderId === order.id}
                >
                  <option value="pending">{translateOrderStatus('pending')}</option>
                  <option value="paid">{translateOrderStatus('paid')}</option>
                  <option value="shipped">{translateOrderStatus('shipped')}</option>
                  <option value="delivered">{translateOrderStatus('delivered')}</option>
                </select>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => void handleSaveStatus(order.id, statusDrafts[order.id] ?? order.status)}
                  disabled={updatingOrderId === order.id || (statusDrafts[order.id] ?? order.status) === order.status}
                >
                  {copy.common.save}
                </button>
                <Link className="inline-link" to={`/seller/orders/${order.id}`}>
                  {copy.sellerOrders.detailLink}
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default SellerOrdersPage
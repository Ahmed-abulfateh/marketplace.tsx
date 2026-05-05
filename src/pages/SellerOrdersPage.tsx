import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

type QueueView = 'all' | 'to-ship' | 'shipped' | 'delivered'

type SellerOrdersLocationState = {
  notice?: string
}

function SellerOrdersPage() {
  const { copy, formatCurrency, translateCatalogText, translateOrderStatus } = useLanguage()
  const { listings, orders, session } = useMarketplace()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const locationState = location.state as SellerOrdersLocationState | null

  const managedListingIds = new Set(
    listings.filter((listing) => listing.seller === session?.name).map((listing) => listing.id),
  )

  const sellerOrders = orders.filter((order) => managedListingIds.has(order.listingId))

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
              <Link className="inline-link" to={`/seller/orders/${order.id}`}>
                {copy.sellerOrders.detailLink}
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default SellerOrdersPage
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function ShipmentsPage() {
  const { copy, formatCurrency, translateCatalogText, translateOrderStatus } = useLanguage()
  const { listings, orders, session } = useMarketplace()

  const buyerOrders = orders.filter(
    (order) =>
      order.buyerId === session?.id ||
      order.buyer === session?.name ||
      (session?.email && order.email === session.email),
  )

  return (
    <section className="market-grid">
      <div className="section-heading compact">
        <p className="section-kicker">{copy.shipments.kicker}</p>
        <h2>{copy.shipments.title}</h2>
      </div>
      <div className="queue-grid admin-order-grid">
        {buyerOrders.length === 0 ? (
          <article className="queue-card">
            <p>{copy.shipments.noOrders}</p>
          </article>
        ) : buyerOrders.map((order) => {
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
              {order.status === 'shipped' || order.status === 'delivered' ? (
                <Link className="inline-link" to={`/browse/${order.listingId}`}>
                  {copy.shipments.reviewCta}
                </Link>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ShipmentsPage

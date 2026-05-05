import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function ShipmentsPage() {
  const { copy, formatCurrency, translateCatalogText, translateOrderStatus } = useLanguage()
  const { listings, orders, session } = useMarketplace()

  const buyerOrders = orders.filter(
    (order) => order.buyerId === session?.id || order.buyer === session?.name,
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
              <p className="card-label">{order.id}</p>
              <h3>{listing ? translateCatalogText(listing.title) : order.listingId}</h3>
              <p>{order.buyer}</p>
              <div className="listing-footer">
                <strong>{formatCurrency(order.total)}</strong>
                <span>{translateOrderStatus(order.status)}</span>
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

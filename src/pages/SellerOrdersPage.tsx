import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function SellerOrdersPage() {
  const { copy, formatCurrency, translateCatalogText, translateOrderStatus } = useLanguage()
  const { listings, orders } = useMarketplace()

  return (
    <section className="market-grid">
      <div className="section-heading compact">
        <p className="section-kicker">{copy.sellerOrders.kicker}</p>
        <h2>{copy.sellerOrders.title}</h2>
      </div>
      <div className="queue-grid admin-order-grid">
        {orders.map((order) => {
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
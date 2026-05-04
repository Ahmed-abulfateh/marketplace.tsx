import { Link, Navigate } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function CheckoutSuccessPage() {
  const { copy } = useLanguage()
  const { clearLastCheckout, lastCheckout } = useMarketplace()

  if (!lastCheckout) {
    return <Navigate to="/browse" replace />
  }

  return (
    <main className="page-stack">
      <PageHero
        variant="product"
        kicker={copy.checkoutSuccess.kicker}
        title={copy.checkoutSuccess.title}
        summary={copy.checkoutSuccess.summary}
        aside={
          <>
            <p className="card-label">{copy.checkoutSuccess.confirmationLabel}</p>
            <ul className="feature-list compact">
              <li>{copy.common.orderCount(lastCheckout.orderIds.length)}</li>
              <li>{lastCheckout.paymentMethod}</li>
              <li>{lastCheckout.emailSent ? copy.checkoutSuccess.emailSent : copy.checkoutSuccess.emailManual}</li>
            </ul>
          </>
        }
      />

      <section className="product-layout">
        <article className="product-panel">
          <div className="section-heading compact">
            <p className="section-kicker">{copy.checkoutSuccess.summaryKicker}</p>
            <h2>{lastCheckout.buyerName}</h2>
          </div>
          <div className="product-details-grid">
            <div>
              <span className="product-label">{copy.checkoutSuccess.emailLabel}</span>
              <strong>{lastCheckout.email}</strong>
            </div>
            <div>
              <span className="product-label">{copy.checkoutSuccess.addressLabel}</span>
              <strong>{lastCheckout.address}</strong>
            </div>
            <div>
              <span className="product-label">{copy.checkoutSuccess.ordersLabel}</span>
              <strong>{lastCheckout.orderIds.join(', ')}</strong>
            </div>
          </div>
        </article>

        <aside className="purchase-panel">
          <p className="card-label">{copy.checkoutSuccess.nextSteps}</p>
          <div className="card-actions vertical-actions">
            <Link className="button button-primary" to="/seller/orders" onClick={clearLastCheckout}>
              {copy.checkoutSuccess.sellerOrders}
            </Link>
            <Link className="button button-ghost" to="/browse" onClick={clearLastCheckout}>
              {copy.checkoutSuccess.backToBrowse}
            </Link>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default CheckoutSuccessPage
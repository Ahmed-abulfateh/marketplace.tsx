import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function CheckoutPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { copy, formatCurrency, translateCatalogText } = useLanguage()
  const { cartIds, checkout, listings, session } = useMarketplace()
  const [form, setForm] = useState({
    buyerName: session?.name ?? '',
    email: 'buyer@example.com',
    address: '24 Market Street, Alexandria',
    paymentMethod: 'Card',
  })

  const checkoutIds = listingId ? [listingId] : cartIds
  const checkoutListings = listings.filter((listing) => checkoutIds.includes(listing.id))

  if (checkoutListings.length === 0) {
    return <Navigate to="/browse" replace />
  }

  const total = checkoutListings.reduce((sum, listing) => sum + listing.price, 0)

  const handleConfirm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await checkout({
      listingIds: checkoutListings.map((listing) => listing.id),
      buyerName: form.buyerName,
      email: form.email,
      address: form.address,
      paymentMethod: form.paymentMethod,
    })
    navigate('/checkout/success', { replace: true })
  }

  return (
    <main className="page-stack">
      <PageHero
        variant="product"
        kicker={copy.checkout.kicker}
        title={listingId ? copy.checkout.singleTitle : copy.checkout.cartTitle}
        summary={copy.checkout.summary}
        aside={
          <>
            <p className="card-label">{copy.checkout.summaryLabel}</p>
            <ul className="feature-list compact">
              <li>{copy.common.itemsCount(checkoutListings.length)}</li>
              <li>{copy.common.total(formatCurrency(total))}</li>
              <li>{copy.checkout.payoutRelease}</li>
            </ul>
          </>
        }
      />

      <form className="product-layout" onSubmit={handleConfirm}>
        <article className="product-panel">
          <div className="section-heading compact">
            <p className="section-kicker">{copy.checkout.orderItemsKicker}</p>
            <h2>{copy.checkout.orderItemsTitle}</h2>
          </div>
          <div className="checkout-list">
            {checkoutListings.map((listing) => (
              <div key={listing.id} className="checkout-row">
                <div>
                  <strong>{translateCatalogText(listing.title)}</strong>
                  <p>{listing.seller}</p>
                </div>
                <span>{formatCurrency(listing.price)}</span>
              </div>
            ))}
          </div>
          <div className="form-grid compact-form-grid">
            <input value={form.buyerName} onChange={(event) => setForm((current) => ({ ...current, buyerName: event.target.value }))} placeholder={copy.checkout.buyerName} required />
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} type="email" placeholder={copy.checkout.email} required />
            <input value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} placeholder={copy.checkout.paymentMethod} required />
            <textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder={copy.checkout.shippingAddress} required />
          </div>
        </article>

        <aside className="purchase-panel">
          <p className="card-label">{copy.checkout.actionsLabel}</p>
          <strong className="purchase-price">{formatCurrency(total)}</strong>
          <p>{copy.checkout.actionsSummary}</p>
          <div className="card-actions vertical-actions">
            <button type="submit" className="button button-primary">
              {copy.checkout.confirm}
            </button>
            <button type="button" className="button button-ghost" onClick={() => navigate('/browse')}>
              {copy.checkout.continueBrowsing}
            </button>
          </div>
        </aside>
      </form>
    </main>
  )
}

export default CheckoutPage
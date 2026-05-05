import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

const buildCheckoutForm = (session: {
  name: string
  email: string
  phone: string
  addressLine: string
  city: string
  road: string
  block: string
  country: string
} | null) => ({
  buyerName: session?.name ?? '',
  email: session?.email ?? '',
  phone: session?.phone ?? '',
  addressLine: session?.addressLine ?? '',
  city: session?.city ?? '',
  road: session?.road ?? '',
  block: session?.block ?? '',
  country: session?.country ?? '',
  paymentMethod: 'Card',
})

function CheckoutPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { copy, formatCurrency, translateCatalogText } = useLanguage()
  const { cartIds, checkout, listings, session } = useMarketplace()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [useSavedAddress, setUseSavedAddress] = useState(true)
  const [form, setForm] = useState(() => buildCheckoutForm(session))

  const checkoutIds = listingId ? [listingId] : cartIds
  const checkoutListings = listings.filter((listing) => checkoutIds.includes(listing.id))

  if (checkoutListings.length === 0) {
    return (
      <main className="page-stack">
        <article className="queue-card">
          <p>{copy.common.noResults}</p>
        </article>
      </main>
    )
  }

  const total = checkoutListings.reduce((sum, listing) => sum + listing.price, 0)

  const handleConfirm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const confirmation = await checkout({
        listingIds: checkoutListings.map((listing) => listing.id),
        buyerName: form.buyerName,
        email: form.email,
        phone: form.phone,
        addressLine: form.addressLine,
        city: form.city,
        road: form.road,
        block: form.block,
        country: form.country,
        paymentMethod: form.paymentMethod,
      })

      navigate('/shipments', {
        replace: true,
        state: { confirmation },
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Checkout failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-stack">
      <form className="product-layout" onSubmit={handleConfirm}>
        <article className="product-panel">
          <div className="section-heading compact">
            <p className="section-kicker">{copy.checkout.orderItemsKicker}</p>
            <h2>{copy.checkout.orderItemsTitle}</h2>
          </div>
          <div className="checkout-list">
            {checkoutListings.map((listing) => (
              <div key={listing.id} className="checkout-row">
                <div className="order-item-meta-grid">
                  <div>
                    <span className="product-label">{copy.common.product}</span>
                    <strong>{translateCatalogText(listing.title)}</strong>
                  </div>
                  <div>
                    <span className="product-label">{copy.common.seller}</span>
                    <p>{listing.seller}</p>
                  </div>
                </div>
                <div>
                  <span className="product-label">{copy.common.totalLabel}</span>
                  <strong>{formatCurrency(listing.price)}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="form-grid compact-form-grid">
            <input value={form.buyerName} onChange={(event) => setForm((current) => ({ ...current, buyerName: event.target.value }))} placeholder={copy.checkout.buyerName} required />
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} type="email" placeholder={copy.checkout.email} required />
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder={copy.checkout.phone} required />
            <label className="form-field checkout-saved-toggle">
              <span className="card-label">{copy.checkout.useSavedAddress}</span>
              <input
                checked={useSavedAddress}
                onChange={(event) => {
                  const checked = event.target.checked
                  setUseSavedAddress(checked)

                  if (checked) {
                    setForm((current) => ({
                      ...current,
                      ...buildCheckoutForm(session),
                      paymentMethod: current.paymentMethod,
                    }))
                  }
                }}
                className="checkout-saved-toggle-input"
                type="checkbox"
              />
            </label>
            <input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} placeholder={copy.checkout.country} required />
            <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder={copy.checkout.city} required />
            <input value={form.block} onChange={(event) => setForm((current) => ({ ...current, block: event.target.value }))} placeholder={copy.checkout.block} required />
            <input value={form.road} onChange={(event) => setForm((current) => ({ ...current, road: event.target.value }))} placeholder={copy.checkout.road} required />
            <textarea value={form.addressLine} onChange={(event) => setForm((current) => ({ ...current, addressLine: event.target.value }))} placeholder={copy.checkout.addressLine} required />
            <input value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} placeholder={copy.checkout.paymentMethod} required />
          </div>
        </article>

        <aside className="purchase-panel">
          <p className="card-label">{copy.checkout.actionsLabel}</p>
          <strong className="purchase-price">{formatCurrency(total)}</strong>
          <p>{copy.checkout.actionsSummary}</p>
          {submitError ? <p role="alert">{submitError}</p> : null}
          <div className="card-actions vertical-actions">
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
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
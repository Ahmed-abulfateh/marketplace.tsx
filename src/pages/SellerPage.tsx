import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import type { Listing, ListingEditorInput, ListingStatus } from '../types'

const sellerCategoryOptions = [
  'Home',
  'Vintage',
  'Textiles',
  'Kitchen',
  'Accessories',
  'Art',
  'Electronics',
  'Jewelry',
  'Clothing',
  'Beauty',
  'Toys',
  'Books',
  'Sports',
  'Garden',
  'Office',
  'Handmade',
  'Furniture',
  'Baby & Kids',
  'Food & Drinks',
  'Collectibles',
]

const sellerQueueCopy = {
  en: {
    readyToShip: 'Ready to ship',
    readyToShipNote: (count: number) =>
      count > 0
        ? 'Paid orders are waiting for label printing and carrier handoff.'
        : 'No paid orders are waiting for shipment right now.',
    readyToShipAction: 'Open seller orders',
    underReview: 'Listings under review',
    underReviewNote: (count: number) =>
      count > 0
        ? 'These products are pending seller review before they can go live.'
        : 'All current products have moved beyond the review queue.',
    underReviewAction: 'Review listing controls',
    payoutHold: 'Awaiting delivery release',
    payoutHoldNote: (count: number) =>
      count > 0
        ? 'Shipped orders are still waiting for delivery confirmation before payout clears.'
        : 'No shipped orders are currently holding payout release.',
    payoutHoldAction: 'Track delivery progress',
  },
  ar: {
    readyToShip: 'جاهزة للشحن',
    readyToShipNote: (count: number) =>
      count > 0
        ? 'طلبات مدفوعة بانتظار طباعة الملصقات وتسليمها لشركة الشحن.'
        : 'لا توجد حاليًا طلبات مدفوعة بانتظار الشحن.',
    readyToShipAction: 'افتح طلبات البائع',
    underReview: 'منتجات تحت المراجعة',
    underReviewNote: (count: number) =>
      count > 0
        ? 'هذه المنتجات ما زالت بانتظار مراجعة البائع قبل نشرها.'
        : 'كل المنتجات الحالية تجاوزت قائمة المراجعة.',
    underReviewAction: 'راجع التحكم في المنتجات',
    payoutHold: 'بانتظار تحرير الدفعة',
    payoutHoldNote: (count: number) =>
      count > 0
        ? 'الطلبات المشحونة ما زالت بانتظار تأكيد التسليم قبل تحرير الدفعة.'
        : 'لا توجد طلبات مشحونة تحجز تحرير الدفعات الآن.',
    payoutHoldAction: 'تابع تقدم التسليم',
  },
} as const

const createInitialForm = (defaults: { category: string; trust: string; shipping: string }): ListingEditorInput => ({
  title: '',
  imageUrl: '',
  category: defaults.category,
  price: 85,
  inventory: 10,
  meta: '',
  description: '',
  trust: defaults.trust,
  shipping: defaults.shipping,
})

const createFormFromListing = (listing: Listing): ListingEditorInput => ({
  title: listing.title,
  imageUrl: listing.imageUrl,
  category: listing.category,
  price: listing.price,
  inventory: listing.inventory,
  meta: listing.meta,
  description: listing.description,
  trust: listing.trust,
  shipping: listing.shipping,
})

function SellerPage() {
  const { copy, formatCurrency, language, translateCatalogText, translateListingStatus } = useLanguage()
  const {
    createListing,
    deleteListing,
    listingStatuses,
    listings,
    orders,
    session,
    updateListing,
    updateListingStatus,
  } = useMarketplace()
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [form, setForm] = useState<ListingEditorInput>(() => createInitialForm(copy.seller.defaultForm))
  const [formNotice, setFormNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [listNotice, setListNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const managedListings = listings.filter((listing) => listing.seller === session?.name)
  const managedListingIds = new Set(managedListings.map((listing) => listing.id))
  const sellerOrders = orders.filter((order) => managedListingIds.has(order.listingId))
  const categoryOptions = Array.from(
    new Set([
      ...sellerCategoryOptions,
      copy.seller.defaultForm.category,
      ...listings.map((listing) => listing.category),
    ]),
  )
  const readyToShipCount = sellerOrders.filter((order) => order.status === 'paid').length
  const reviewQueueCount = managedListings.filter(
    (listing) => (listingStatuses[listing.id] ?? listing.status) === 'review',
  ).length
  const payoutHoldCount = sellerOrders.filter((order) => order.status === 'shipped').length
  const queueCopy = sellerQueueCopy[language]
  const sellerQueueCards = [
    {
      id: 'shipments',
      count: readyToShipCount,
      label: queueCopy.readyToShip,
      note: queueCopy.readyToShipNote(readyToShipCount),
      action: queueCopy.readyToShipAction,
      to: '/seller/orders',
    },
    {
      id: 'review',
      count: reviewQueueCount,
      label: queueCopy.underReview,
      note: queueCopy.underReviewNote(reviewQueueCount),
      action: queueCopy.underReviewAction,
      to: '#seller-listings',
    },
    {
      id: 'payout',
      count: payoutHoldCount,
      label: queueCopy.payoutHold,
      note: queueCopy.payoutHoldNote(payoutHoldCount),
      action: queueCopy.payoutHoldAction,
      to: '/seller/orders',
    },
  ]

  useEffect(() => {
    if (!editingListingId) {
      return
    }

    const listing = managedListings.find((item) => item.id === editingListingId)

    if (!listing) {
      setEditingListingId(null)
      setForm(createInitialForm(copy.seller.defaultForm))
      return
    }

    setForm(createFormFromListing(listing))
  }, [copy.seller.defaultForm, editingListingId, managedListings])

  const sellerMetrics = [
    {
      label: copy.seller.metrics[0].label,
      value: String(
        listings.filter((listing) => (listingStatuses[listing.id] ?? listing.status) === 'live')
          .length,
      ),
      note: copy.seller.metrics[0].note,
    },
    {
      label: copy.seller.metrics[1].label,
      value: formatCurrency(orders.reduce((total, order) => total + order.total, 0)),
      note: copy.seller.metrics[1].note,
    },
    {
      label: copy.seller.metrics[2].label,
      value: String(
        orders.filter((order) => order.status === 'pending' || order.status === 'paid').length,
      ),
      note: copy.seller.metrics[2].note,
    },
  ]

  const setStatus = (listingId: string, status: ListingStatus) => {
    void updateListingStatus(listingId, status)
  }

  const startEditing = (listing: Listing) => {
    setEditingListingId(listing.id)
    setForm(createFormFromListing(listing))
    setFormNotice(null)
  }

  const stopEditing = () => {
    setEditingListingId(null)
    setForm(createInitialForm(copy.seller.defaultForm))
    setFormNotice(null)
  }

  const handleCreateListing = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormNotice(null)

    try {
      if (editingListingId) {
        await updateListing(editingListingId, form)
        stopEditing()
        setFormNotice({ tone: 'success', message: copy.seller.notices.updated })
        return
      }

      await createListing(form)
      setForm(createInitialForm(copy.seller.defaultForm))
      setFormNotice({ tone: 'success', message: copy.seller.notices.created })
    } catch (error) {
      setFormNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : copy.seller.notices.saveError,
      })
    }
  }

  const handleDeleteListing = async (listing: Listing) => {
    setListNotice(null)

    if (!window.confirm(copy.common.deletePrompt(translateCatalogText(listing.title)))) {
      return
    }

    try {
      await deleteListing(listing.id)

      if (editingListingId === listing.id) {
        stopEditing()
      }

      setListNotice({ tone: 'success', message: copy.seller.notices.deleted })
    } catch (error) {
      setListNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : copy.seller.notices.deleteError,
      })
    }
  }

  if (session?.accountStatus === 'pending') {
    return (
      <main className="page-stack">
        <section className="market-grid">
          <article className="queue-card" style={{ maxWidth: '480px', margin: '0 auto' }}>
            <p className="section-kicker">{copy.sellerPending.kicker}</p>
            <h2>{copy.sellerPending.title}</h2>
            <p>{copy.sellerPending.summary}</p>
            <p style={{ marginTop: '0.75rem', opacity: 0.7 }}>{copy.sellerPending.detail}</p>
          </article>
        </section>
      </main>
    )
  }

  return (
    <main className="page-stack">
      <PageHero
        variant="seller"
        kicker={copy.seller.heroKicker}
        title={copy.seller.heroTitle}
        summary={copy.seller.heroSummary}
        aside={
          <>
            <p className="card-label">{copy.seller.readinessLabel}</p>
            <p>{copy.seller.readinessSummary}</p>
          </>
        }
        darkAside
      />

      <section className="metric-grid">
        {sellerMetrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p className="card-label">{metric.label}</p>
            <strong>{metric.value}</strong>
            <p>{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="split-panel">
        <div className="split-copy">
          <p className="section-kicker">{copy.seller.prioritiesKicker}</p>
          <h2>{copy.seller.prioritiesTitle}</h2>
          <ul className="feature-list">
            {copy.seller.priorities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="control-room">
          <div className="control-room-header">
            <p className="card-label">{copy.seller.queueLabel}</p>
            <span>{copy.seller.queueTitle}</span>
          </div>
          {sellerQueueCards.map((item) => (
            <article className={item.count > 0 ? 'control-metric accent' : 'control-metric'} key={item.id}>
              <div className="control-metric-header">
                <strong>{item.count}</strong>
                <span>{item.label}</span>
              </div>
              <p className="control-metric-note">{item.note}</p>
              {item.to.startsWith('#') ? (
                <a className="inline-link control-metric-link" href={item.to}>
                  {item.action}
                </a>
              ) : (
                <Link className="inline-link control-metric-link" to={item.to}>
                  {item.action}
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="market-grid" id="seller-listings">
        <div className="section-heading compact">
          <p className="section-kicker">{copy.seller.listingControlsKicker}</p>
          <h2>{copy.seller.listingControlsTitle}</h2>
        </div>
        {listNotice ? (
          <p className={listNotice.tone === 'success' ? 'form-notice form-notice-success' : 'form-notice form-notice-error'}>
            {listNotice.message}
          </p>
        ) : null}
        <div className="queue-grid seller-queue-grid">
          {managedListings.length === 0 ? (
            <article className="queue-card">
              <p className="card-label">{copy.seller.noListingsLabel}</p>
              <h3>{copy.seller.noListingsTitle}</h3>
              <p className="seller-name">{copy.seller.noListingsSummary}</p>
            </article>
          ) : managedListings.map((listing) => {
            const status = listingStatuses[listing.id] ?? listing.status

            return (
              <article className="queue-card" key={listing.id}>
                <p className="card-label">{translateCatalogText(listing.category)}</p>
                <h3>{translateCatalogText(listing.title)}</h3>
                <p className="seller-name">{listing.seller}</p>
                <div className="status-pill-row">
                  {(['live', 'review', 'paused'] as ListingStatus[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={option === status ? 'role-chip role-chip-active' : 'role-chip'}
                      onClick={() => setStatus(listing.id, option)}
                    >
                      {translateListingStatus(option)}
                    </button>
                  ))}
                </div>
                <div className="card-actions">
                  <button type="button" className="button button-secondary" onClick={() => startEditing(listing)}>
                    {copy.seller.editProduct}
                  </button>
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => void handleDeleteListing(listing)}
                  >
                    {copy.seller.deleteProduct}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="market-grid">
        <div className="section-heading compact">
          <p className="section-kicker">{copy.seller.createKicker}</p>
          <h2>{editingListingId ? copy.seller.editTitle : copy.seller.createTitle}</h2>
        </div>
        {!editingListingId ? <p className="form-helper-text">{copy.seller.createSummary}</p> : null}
        {formNotice ? (
          <p className={formNotice.tone === 'success' ? 'form-notice form-notice-success' : 'form-notice form-notice-error'}>
            {formNotice.message}
          </p>
        ) : null}
        <form className="form-grid" onSubmit={handleCreateListing}>
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder={copy.seller.placeholders.title} required />
          <label className="form-field">
            <span className="card-label">{copy.seller.placeholders.imageUrlLabel} <span className="form-field-optional">(optional)</span></span>
            <input
              value={form.imageUrl}
              onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
              placeholder={copy.seller.placeholders.imageUrl}
              type="url"
            />
            {form.imageUrl.trim() ? (
              <img
                src={form.imageUrl.trim()}
                alt={form.title || 'preview'}
                className="listing-image-preview-img"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.display = '' }}
              />
            ) : null}
          </label>
          <label className="form-field">
            <span className="card-label">{copy.seller.placeholders.category}</span>
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {translateCatalogText(category)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span className="card-label">{copy.seller.placeholders.price}</span>
            <input value={String(form.price)} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} placeholder={copy.seller.placeholders.price} type="number" min="1" step="0.001" required />
          </label>
          <input value={String(form.inventory)} onChange={(event) => setForm((current) => ({ ...current, inventory: Number(event.target.value) }))} placeholder={copy.seller.placeholders.inventory} type="number" min="1" required />
          <input value={form.trust} onChange={(event) => setForm((current) => ({ ...current, trust: event.target.value }))} placeholder={copy.seller.placeholders.trust} required />
          <input value={form.shipping} onChange={(event) => setForm((current) => ({ ...current, shipping: event.target.value }))} placeholder={copy.seller.placeholders.shipping} required />
          <textarea value={form.meta} onChange={(event) => setForm((current) => ({ ...current, meta: event.target.value }))} placeholder={copy.seller.placeholders.meta} required />
          <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder={copy.seller.placeholders.description} required />
          <div className="card-actions">
            <button type="submit" className="button button-primary">
              {editingListingId ? copy.seller.buttons.saveChanges : copy.seller.buttons.submit}
            </button>
            {editingListingId ? (
              <button type="button" className="button button-secondary" onClick={stopEditing}>
                {copy.seller.buttons.cancelEdit}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  )
}

export default SellerPage
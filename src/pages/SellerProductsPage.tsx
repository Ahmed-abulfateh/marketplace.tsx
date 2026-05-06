import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import { getListingImages } from '../lib/listingImages'
import type { Listing, ListingEditorInput } from '../types'

const createFormFromListing = (listing: Listing): ListingEditorInput => {
  const listingImages = getListingImages(listing)

  return {
    title: listing.title,
    imageUrl: listingImages[0] ?? listing.imageUrl,
    imageUrls: Array.from({ length: 6 }, (_, index) => listingImages[index] ?? ''),
    category: listing.category,
    price: listing.price,
    inventory: listing.inventory,
    meta: listing.meta,
    description: listing.description,
    trust: listing.trust,
    shipping: listing.shipping,
  }
}

function SellerProductsPage() {
  const { copy, formatCurrency, translateCatalogText, translateListingStatus } = useLanguage()
  const { listingStatuses, listings, session, updateListing } = useMarketplace()
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [form, setForm] = useState<ListingEditorInput | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const managedListings = listings.filter((listing) => listing.seller === session?.name)
  const editingListing = managedListings.find((listing) => listing.id === editingListingId) ?? null

  const startEditing = (listing: Listing) => {
    setEditingListingId(listing.id)
    setForm(createFormFromListing(listing))
    setNotice(null)
  }

  const stopEditing = () => {
    setEditingListingId(null)
    setForm(null)
  }

  const handleUpdateListing = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingListingId || !form) {
      return
    }

    setNotice(null)

    const imageUrls = form.imageUrls.map((value) => value.trim()).filter(Boolean).slice(0, 6)

    try {
      await updateListing(editingListingId, {
        ...form,
        imageUrl: imageUrls[0] ?? '',
        imageUrls,
      })

      setNotice({ tone: 'success', message: 'Product updated successfully.' })
      stopEditing()
    } catch (error) {
      setNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Could not update product.',
      })
    }
  }

  return (
    <section className="market-grid">
      <div className="section-heading compact">
        <p className="section-kicker">Seller products</p>
        <h2>My Products</h2>
      </div>

      {notice ? (
        <p className={notice.tone === 'success' ? 'form-notice form-notice-success' : 'form-notice form-notice-error'}>
          {notice.message}
        </p>
      ) : null}

      <div className="queue-grid seller-queue-grid">
        {managedListings.length === 0 ? (
          <article className="queue-card">
            <p>{copy.seller.noListingsSummary}</p>
          </article>
        ) : managedListings.map((listing) => {
          const status = listingStatuses[listing.id] ?? listing.status
          const listingImages = getListingImages(listing)

          return (
            <article className="queue-card" key={listing.id}>
              <p className="card-label">{translateCatalogText(listing.category)}</p>
              <h3>{translateCatalogText(listing.title)}</h3>
              <p className="seller-name">{formatCurrency(listing.price)}</p>
              {listingImages[0] ? <img className="listing-image-preview-img" src={listingImages[0]} alt={translateCatalogText(listing.title)} /> : null}
              <div className="product-details-grid">
                <div>
                  <span className="product-label">Status</span>
                  <strong>{translateListingStatus(status)}</strong>
                </div>
                <div>
                  <span className="product-label">Inventory</span>
                  <strong>{copy.common.units(listing.inventory)}</strong>
                </div>
                <div>
                  <span className="product-label">Images</span>
                  <strong>{listingImages.length}</strong>
                </div>
              </div>
              <div className="card-actions">
                <button type="button" className="button button-primary" onClick={() => startEditing(listing)}>
                  Edit product
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {editingListing && form ? (
        <section className="market-grid">
          <div className="section-heading compact">
            <p className="section-kicker">Product editor</p>
            <h2>{translateCatalogText(editingListing.title)}</h2>
          </div>
          <form className="form-grid" onSubmit={handleUpdateListing}>
            <input value={form.title} onChange={(event) => setForm((current) => current ? { ...current, title: event.target.value } : current)} placeholder={copy.seller.placeholders.title} required />
            <div className="listing-image-url-grid">
              {form.imageUrls.map((imageUrl, index) => (
                <input
                  key={`seller-product-image-url-${index}`}
                  value={imageUrl}
                  onChange={(event) => setForm((current) => {
                    if (!current) {
                      return current
                    }

                    const imageUrls = [...current.imageUrls]
                    imageUrls[index] = event.target.value

                    return {
                      ...current,
                      imageUrls,
                      imageUrl: imageUrls.find((value) => value.trim()) ?? '',
                    }
                  })}
                  placeholder={`${copy.seller.placeholders.imageUrl} ${index + 1}`}
                  type="url"
                />
              ))}
            </div>
            <input value={form.category} onChange={(event) => setForm((current) => current ? { ...current, category: event.target.value } : current)} placeholder={copy.seller.placeholders.category} required />
            <input value={String(form.price)} onChange={(event) => setForm((current) => current ? { ...current, price: Number(event.target.value) } : current)} placeholder={copy.seller.placeholders.price} type="number" min="1" step="0.001" required />
            <input value={String(form.inventory)} onChange={(event) => setForm((current) => current ? { ...current, inventory: Number(event.target.value) } : current)} placeholder={copy.seller.placeholders.inventory} type="number" min="0" required />
            <input value={form.trust} onChange={(event) => setForm((current) => current ? { ...current, trust: event.target.value } : current)} placeholder={copy.seller.placeholders.trust} required />
            <input value={form.shipping} onChange={(event) => setForm((current) => current ? { ...current, shipping: event.target.value } : current)} placeholder={copy.seller.placeholders.shipping} required />
            <textarea value={form.meta} onChange={(event) => setForm((current) => current ? { ...current, meta: event.target.value } : current)} placeholder={copy.seller.placeholders.meta} required />
            <textarea value={form.description} onChange={(event) => setForm((current) => current ? { ...current, description: event.target.value } : current)} placeholder={copy.seller.placeholders.description} required />
            <div className="card-actions">
              <button type="submit" className="button button-primary">Save changes</button>
              <button type="button" className="button button-secondary" onClick={stopEditing}>Cancel</button>
            </div>
          </form>
        </section>
      ) : null}
    </section>
  )
}

export default SellerProductsPage

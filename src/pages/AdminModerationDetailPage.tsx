import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import { getListingImages } from '../lib/listingImages'
import type { ListingEditorInput, ListingStatus } from '../types'

const createFormFromListing = (listing: {
  title: string
  imageUrl: string
  imageUrls?: string[]
  price: number
  meta: string
  description: string
  category: string
  trust: string
  shipping: string
  inventory: number
}) => {
  const listingImages = getListingImages(listing)

  return {
    title: listing.title,
    imageUrl: listingImages[0] ?? listing.imageUrl,
    imageUrls: Array.from({ length: 6 }, (_, index) => listingImages[index] ?? ''),
    price: listing.price,
    meta: listing.meta,
    description: listing.description,
    category: listing.category,
    trust: listing.trust,
    shipping: listing.shipping,
    inventory: listing.inventory,
  }
}

function AdminModerationDetailPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { copy, translateCatalogText, translateListingStatus } = useLanguage()
  const {
    addModerationNote,
    deleteListing,
    isReady,
    listingStatuses,
    listings,
    updateListing,
    updateListingStatus,
  } = useMarketplace()
  const [note, setNote] = useState('')
  const [form, setForm] = useState<ListingEditorInput | null>(null)
  const [actionNotice, setActionNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  if (!isReady) {
    return <main className="loading-shell">{copy.common.loading}</main>
  }

  const listing = listings.find((item) => item.id === listingId)

  if (!listing) {
    return <Navigate to="/admin/moderation" replace />
  }

  const currentStatus = listingStatuses[listing.id] ?? listing.status

  useEffect(() => {
    setForm(createFormFromListing(listing))
  }, [listing])

  const handleAddNote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActionNotice(null)

    if (!note.trim()) {
      return
    }

    try {
      await addModerationNote(listing.id, note)
      setNote('')
      setActionNotice({ tone: 'success', message: copy.moderation.notices.noteSaved })
    } catch (error) {
      setActionNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : copy.moderation.notices.noteError,
      })
    }
  }

  const handleUpdateListing = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setActionNotice(null)

    if (!form) {
      return
    }

    try {
      const imageUrls = form.imageUrls.map((value) => value.trim()).filter(Boolean).slice(0, 6)

      await updateListing(listing.id, {
        ...form,
        imageUrl: imageUrls[0] ?? '',
        imageUrls,
      })
      setActionNotice({ tone: 'success', message: copy.moderation.notices.updated })
    } catch (error) {
      setActionNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : copy.moderation.notices.updateError,
      })
    }
  }

  const handleDeleteListing = async () => {
    setActionNotice(null)

    if (!window.confirm(copy.common.deletePrompt(translateCatalogText(listing.title)))) {
      return
    }

    try {
      await deleteListing(listing.id)
      navigate('/admin/moderation')
    } catch (error) {
      setActionNotice({
        tone: 'error',
        message: error instanceof Error ? error.message : copy.moderation.notices.deleteError,
      })
    }
  }

  return (
    <section className="product-layout">
      <article className="product-panel">
        <div className="section-heading compact">
          <p className="section-kicker">{copy.moderation.detailKicker}</p>
          <h2>{translateCatalogText(listing.title)}</h2>
        </div>
        <p>{translateCatalogText(listing.description)}</p>
        <div className="product-details-grid">
          <div>
            <span className="product-label">{copy.moderation.seller}</span>
            <strong>{listing.seller}</strong>
          </div>
          <div>
            <span className="product-label">{copy.moderation.trustSignal}</span>
            <strong>{translateCatalogText(listing.trust)}</strong>
          </div>
          <div>
            <span className="product-label">{copy.moderation.currentState}</span>
            <strong>{translateListingStatus(currentStatus)}</strong>
          </div>
        </div>
        <div className="section-heading compact moderation-section">
          <p className="section-kicker">{copy.moderation.notesKicker}</p>
          <h2>{copy.moderation.notesTitle}</h2>
        </div>
        <div className="checkout-list">
          {listing.moderationNotes.length > 0 ? (
            listing.moderationNotes.map((entry) => (
              <div key={`${entry.author}-${entry.createdAt}`} className="checkout-row">
                <div>
                  <strong>{entry.author}</strong>
                  <p>{entry.note}</p>
                </div>
                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <div className="checkout-row">
              <div>
                <strong>{copy.moderation.noNotesTitle}</strong>
                <p>{copy.moderation.noNotesSummary}</p>
              </div>
            </div>
          )}
        </div>
      </article>
      <aside className="purchase-panel">
        <p className="card-label">{copy.moderation.actionsLabel}</p>
        <p>{copy.moderation.actionsSummary}</p>
        {actionNotice ? (
          <p className={actionNotice.tone === 'success' ? 'form-notice form-notice-success' : 'form-notice form-notice-error'}>
            {actionNotice.message}
          </p>
        ) : null}
        <div className="card-actions vertical-actions">
          {(['live', 'review', 'paused'] as ListingStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              className={status === currentStatus ? 'button button-primary' : 'button button-secondary'}
              onClick={() => void updateListingStatus(listing.id, status)}
            >
              {copy.moderation.setStatus(translateListingStatus(status))}
            </button>
          ))}
        </div>
        <form className="form-grid compact-form-grid" onSubmit={handleUpdateListing}>
          <input value={form?.title ?? ''} onChange={(event) => setForm((current) => current ? { ...current, title: event.target.value } : current)} placeholder={copy.moderation.placeholders.title} required />
          {form?.imageUrls.map((imageUrl, index) => (
            <input
              key={`moderation-image-url-${index}`}
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
              placeholder={`${copy.moderation.placeholders.imageUrl} ${index + 1}`}
              type="url"
            />
          ))}
          <input value={form?.category ?? ''} onChange={(event) => setForm((current) => current ? { ...current, category: event.target.value } : current)} placeholder={copy.moderation.placeholders.category} required />
          <input value={String(form?.price ?? '')} onChange={(event) => setForm((current) => current ? { ...current, price: Number(event.target.value) } : current)} placeholder={copy.moderation.placeholders.price} type="number" min="1" required />
          <input value={String(form?.inventory ?? '')} onChange={(event) => setForm((current) => current ? { ...current, inventory: Number(event.target.value) } : current)} placeholder={copy.moderation.placeholders.inventory} type="number" min="1" required />
          <input value={form?.trust ?? ''} onChange={(event) => setForm((current) => current ? { ...current, trust: event.target.value } : current)} placeholder={copy.moderation.placeholders.trust} required />
          <input value={form?.shipping ?? ''} onChange={(event) => setForm((current) => current ? { ...current, shipping: event.target.value } : current)} placeholder={copy.moderation.placeholders.shipping} required />
          <textarea value={form?.meta ?? ''} onChange={(event) => setForm((current) => current ? { ...current, meta: event.target.value } : current)} placeholder={copy.moderation.placeholders.meta} required />
          <textarea value={form?.description ?? ''} onChange={(event) => setForm((current) => current ? { ...current, description: event.target.value } : current)} placeholder={copy.moderation.placeholders.description} required />
          <button type="submit" className="button button-primary">{copy.moderation.saveEdits}</button>
        </form>
        <form className="form-grid compact-form-grid" onSubmit={handleAddNote}>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={copy.moderation.placeholders.note} required />
          <button type="submit" className="button button-primary">{copy.moderation.saveNote}</button>
        </form>
        <button type="button" className="button button-ghost" onClick={() => void handleDeleteListing()}>
          {copy.moderation.deleteProduct}
        </button>
      </aside>
    </section>
  )
}

export default AdminModerationDetailPage
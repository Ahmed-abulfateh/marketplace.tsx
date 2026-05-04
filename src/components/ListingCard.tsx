import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import type { Listing } from '../types'

type ListingCardProps = {
  listing: Listing
}

function ListingCard({ listing }: ListingCardProps) {
  const { copy, formatCurrency, translateCatalogText, translateListingStatus } = useLanguage()
  const { cartIds, favoriteIds, listingStatuses, toggleCart, toggleFavorite } =
    useMarketplace()

  const isFavorite = favoriteIds.includes(listing.id)
  const isInCart = cartIds.includes(listing.id)
  const currentStatus = listingStatuses[listing.id] ?? listing.status

  return (
    <article className="listing-card">
      <div className="listing-topline">
        <p className="card-label">{translateCatalogText(listing.category)}</p>
        <span className="badge">{translateCatalogText(listing.trust)}</span>
      </div>
      <h3>
        <Link className="listing-link" to={`/browse/${listing.id}`}>
          {translateCatalogText(listing.title)}
        </Link>
      </h3>
      <p className="seller-name">{listing.seller}</p>
      <p>{translateCatalogText(listing.meta)}</p>
      <div className="listing-meta-grid">
        <span>{translateCatalogText(listing.shipping)}</span>
        <span>{copy.common.sellerScore(listing.reviewScore.toFixed(1))}</span>
        <span>{translateListingStatus(currentStatus)}</span>
      </div>
      <div className="listing-footer">
        <strong>{formatCurrency(listing.price)}</strong>
        <span>{copy.common.inStock(listing.inventory)}</span>
      </div>
      <div className="card-actions">
        <button type="button" className="button button-ghost" onClick={() => toggleFavorite(listing.id)}>
          {isFavorite ? copy.product.savedToFavorites : copy.common.save}
        </button>
        <button type="button" className="button button-secondary" onClick={() => toggleCart(listing.id)}>
          {isInCart ? copy.product.removeFromCart : copy.product.addToCart}
        </button>
      </div>
    </article>
  )
}

export default ListingCard
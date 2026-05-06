import type { Listing } from '../types'

const getListingImages = (listing: Pick<Listing, 'imageUrl' | 'imageUrls'>) => {
  const imageUrls = Array.isArray(listing.imageUrls) ? listing.imageUrls.filter(Boolean) : []

  if (imageUrls.length > 0) {
    return imageUrls.slice(0, 6)
  }

  return listing.imageUrl ? [listing.imageUrl] : []
}

export { getListingImages }
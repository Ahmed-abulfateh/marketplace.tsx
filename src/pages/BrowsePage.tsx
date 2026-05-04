import { useDeferredValue, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

// Each chip maps to a filter predicate keyed by chip index.
// 0 = All categories (no filter)
// 1 = Verified sellers  (trust field contains "verified")
// 2 = Tracked shipping   (shipping field contains "tracked" / "متتبع")
// 3 = Flexible returns   (shipping or trust contains "return" / "إرجاع")
const CHIP_FILTERS = [
  null,
  (trust: string) => trust.toLowerCase().includes('verified') || trust.includes('موثق'),
  (shipping: string) => shipping.toLowerCase().includes('tracked') || shipping.includes('متتبع'),
  (shipping: string, trust: string) =>
    shipping.toLowerCase().includes('return') ||
    shipping.includes('إرجاع') ||
    trust.toLowerCase().includes('return') ||
    trust.includes('إرجاع'),
] as const

function BrowsePage() {
  const { copy, translateCatalogText } = useLanguage()
  const { listings } = useMarketplace()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [activeChip, setActiveChip] = useState(0)
  const deferredQuery = useDeferredValue(query)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (value.trim()) {
      setSearchParams({ q: value }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const handleChipClick = (index: number) => {
    setActiveChip(index)
  }

  const visibleListings = listings.filter((listing) => {
    // Text search filter
    const search = deferredQuery.trim().toLowerCase()
    if (search) {
      const matchesSearch = [
        translateCatalogText(listing.title),
        listing.seller,
        translateCatalogText(listing.category),
        translateCatalogText(listing.trust),
      ].some((value) => value.toLowerCase().includes(search))

      if (!matchesSearch) return false
    }

    // Chip filter
    const chipFilter = CHIP_FILTERS[activeChip]
    if (!chipFilter) return true

    if (activeChip === 3) {
      return (chipFilter as (s: string, t: string) => boolean)(listing.shipping, listing.trust)
    }

    const field = activeChip === 1 ? listing.trust : listing.shipping
    return (chipFilter as (f: string) => boolean)(field)
  })

  return (
    <main className="page-stack">
      <section className="search-panel">
        <label className="search-field" htmlFor="listing-search">
          <span className="section-kicker">{copy.browse.searchKicker}</span>
          <input
            id="listing-search"
            type="search"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder={copy.browse.searchPlaceholder}
          />
        </label>
      </section>

      <section className="filter-strip">
        {copy.browse.chips.map((chip, index) => (
          <button
            key={chip}
            type="button"
            className={index === activeChip ? 'filter-chip filter-chip-active' : 'filter-chip'}
            onClick={() => handleChipClick(index)}
          >
            {chip}
          </button>
        ))}
      </section>

      <section className="market-grid">
        <div className="listing-grid">
          {visibleListings.length > 0 ? visibleListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          )) : <article className="queue-card"><p>{copy.common.noResults}</p></article>}
        </div>
      </section>
    </main>
  )
}

export default BrowsePage
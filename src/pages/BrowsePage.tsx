import { useDeferredValue, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function BrowsePage() {
  const { copy, translateCatalogText } = useLanguage()
  const { listings } = useMarketplace()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const deferredQuery = useDeferredValue(query)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (value.trim()) {
      setSearchParams({ q: value }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const visibleListings = listings.filter((listing) => {
    const search = deferredQuery.trim().toLowerCase()

    if (!search) {
      return true
    }

    return [
      translateCatalogText(listing.title),
      listing.seller,
      translateCatalogText(listing.category),
      translateCatalogText(listing.trust),
    ].some((value) =>
      value.toLowerCase().includes(search),
    )
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
        {copy.browse.chips.map((chip) => (
          <span key={chip}>{chip}</span>
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
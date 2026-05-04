import ListingCard from '../components/ListingCard'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function HomePage() {
  const { copy } = useLanguage()
  const { listings } = useMarketplace()

  return (
    <>
      <main>
        <section className="market-grid">
          <div className="listing-grid">
            {listings.length > 0 ? listings.slice(0, 3).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            )) : <article className="queue-card"><p>{copy.common.noResults}</p></article>}
          </div>
        </section>
      </main>
    </>
  )
}

export default HomePage
import { Link } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function HomePage() {
  const { copy } = useLanguage()
  const { listings } = useMarketplace()

  return (
    <>
      <section className="hero-panel">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="section-kicker">{copy.home.kicker}</p>
            <h1>{copy.home.title}</h1>
            <p className="lead">{copy.home.summary}</p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/browse">
                {copy.home.browseCta}
              </Link>
              <Link className="button button-secondary" to="/seller">
                {copy.home.sellerCta}
              </Link>
            </div>
            <dl className="impact-strip">
              {copy.home.impact.map((item) => (
                <div key={item.value}>
                  <dt>{item.value}</dt>
                  <dd>{item.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="hero-card" aria-label="Marketplace pulse">
            <p className="card-label">{copy.home.pulseLabel}</p>
            <h2>{copy.home.pulseTitle}</h2>
            <ol className="workflow-list">
              {copy.home.workflowSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="status-band">
              {copy.home.statusBand.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <main>
        <section className="market-grid">
          <div className="section-heading">
            <p className="section-kicker">{copy.home.featuredKicker}</p>
            <h2>{copy.home.featuredTitle}</h2>
          </div>
          <div className="listing-grid">
            {listings.length > 0 ? listings.slice(0, 3).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            )) : <article className="queue-card"><p>{copy.common.noResults}</p></article>}
          </div>
        </section>

        <section className="split-panel">
          <div className="split-copy">
            <p className="section-kicker">{copy.home.sellerHubKicker}</p>
            <h2>{copy.home.sellerHubTitle}</h2>
            <p>{copy.home.sellerHubSummary}</p>
            <ul className="feature-list">
              {copy.home.sellerFeatures.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="control-room">
            <div className="control-room-header">
              <p className="card-label">{copy.home.railsLabel}</p>
              <span>{copy.home.railsTitle}</span>
            </div>
            {copy.home.operatingRails.map((rail) => (
              <div className="control-metric" key={rail.label}>
                <strong>{rail.label}</strong>
                <span>{rail.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="trust-panel">
          <div>
            <p className="section-kicker">{copy.home.trustKicker}</p>
            <h2>{copy.home.trustTitle}</h2>
          </div>
          <ul className="trust-list">
            {copy.home.trustSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </section>
      </main>
    </>
  )
}

export default HomePage
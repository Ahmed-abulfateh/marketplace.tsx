import PageHero from '../components/PageHero'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'

function AdminPage() {
  const { copy, translateCatalogText, translateListingStatus, translateOrderStatus } = useLanguage()
  const { advanceOrderStatus, listingStatuses, listings, orders } = useMarketplace()

  return (
    <main className="page-stack">
      <PageHero
        variant="admin"
        kicker={copy.admin.heroKicker}
        title={copy.admin.heroTitle}
        summary={copy.admin.heroSummary}
        aside={
          <>
            <p className="card-label">{copy.admin.planeLabel}</p>
            <p>{copy.admin.planeSummary}</p>
          </>
        }
      />

      <section className="ops-board">
        <div className="section-heading compact">
          <p className="section-kicker">{copy.admin.queuesKicker}</p>
          <h2>{copy.admin.queuesTitle}</h2>
        </div>
        <div className="queue-grid">
          {copy.admin.queues.map((item) => (
            <article className="queue-card" key={item}>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="split-panel admin-split-panel">
        <div className="split-copy">
          <p className="section-kicker">{copy.admin.orderKicker}</p>
          <h2>{copy.admin.orderTitle}</h2>
          <div className="queue-grid admin-order-grid">
            {orders.map((order) => {
              const listing = listings.find((item) => item.id === order.listingId)

              return (
                <article className="queue-card" key={order.id}>
                  <p className="card-label">{order.id}</p>
                  <h3>{listing ? translateCatalogText(listing.title) : order.listingId}</h3>
                  <p>{order.buyer}</p>
                  <div className="listing-footer">
                    <strong>{translateOrderStatus(order.status)}</strong>
                    <span>{translateListingStatus(listingStatuses[order.listingId] ?? listing?.status ?? 'live')}</span>
                  </div>
                  <button
                    type="button"
                    className="button button-secondary order-action"
                    onClick={() => void advanceOrderStatus(order.id)}
                    disabled={order.status === 'delivered'}
                  >
                    {order.status === 'delivered' ? copy.admin.orderComplete : copy.admin.advanceOrder}
                  </button>
                </article>
              )
            })}
          </div>
        </div>

        <div className="control-room">
          <div className="control-room-header">
            <p className="card-label">{copy.admin.snapshotLabel}</p>
            <span>{copy.admin.snapshotState}</span>
          </div>
          {listings.map((listing) => (
            <div className="control-metric" key={listing.id}>
              <strong>{translateCatalogText(listing.title)}</strong>
              <span>{translateListingStatus(listingStatuses[listing.id] ?? listing.status)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rails-panel">
        <div className="section-heading compact">
          <p className="section-kicker">{copy.admin.responsibilitiesKicker}</p>
          <h2>{copy.admin.responsibilitiesTitle}</h2>
        </div>
        <div className="rails-grid">
          {copy.admin.rails.map((item) => (
            <article className="rail-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default AdminPage
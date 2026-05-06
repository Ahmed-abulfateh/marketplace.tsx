import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatDateTimeGmt3 } from '../lib/dateTime'
import type { OrderStatus } from '../types'

type QueueView = 'all' | 'to-ship' | 'shipped' | 'delivered'

type SellerOrdersLocationState = {
  notice?: string
}

function SellerOrdersPage() {
  const { copy, formatCurrency, language, translateCatalogText, translateOrderStatus } = useLanguage()
  const { advanceOrderStatus, listings, orders, session } = useMarketplace()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const locationState = location.state as SellerOrdersLocationState | null
  const [updatingOrderIds, setUpdatingOrderIds] = useState<string[]>([])
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [optimisticDeliveredOrderIds, setOptimisticDeliveredOrderIds] = useState<string[]>([])
  const [updateError, setUpdateError] = useState<string | null>(null)

  const managedListingIds = new Set(
    listings.filter((listing) => listing.seller === session?.name).map((listing) => listing.id),
  )

  const sellerOrders = orders.filter((order) => managedListingIds.has(order.listingId))

  const requestedView = searchParams.get('view') as QueueView | null
  const activeView: QueueView =
    requestedView && ['all', 'to-ship', 'shipped', 'delivered'].includes(requestedView)
      ? requestedView
      : 'all'

  const viewButtons: Array<{ id: QueueView; label: string }> = [
    { id: 'all', label: copy.sellerOrders.filters.all },
    { id: 'to-ship', label: copy.sellerOrders.filters.toShip },
    { id: 'shipped', label: copy.sellerOrders.filters.shipped },
    { id: 'delivered', label: copy.sellerOrders.filters.delivered },
  ]

  const getOrderStatus = (orderId: string, currentStatus: OrderStatus): OrderStatus => (
    optimisticDeliveredOrderIds.includes(orderId) ? 'delivered' : currentStatus
  )

  const visibleOrders = sellerOrders.filter((order) => {
    const status = getOrderStatus(order.id, order.status)

    if (activeView === 'all') {
      return true
    }

    if (activeView === 'to-ship') {
      return status === 'paid'
    }

    return status === activeView
  })

  const selectableOrders = visibleOrders
  const selectedDeliverableOrderIds = selectedOrderIds.filter((id) =>
    selectableOrders.some((order) => order.id === id && getOrderStatus(order.id, order.status) !== 'delivered'),
  )
  const selectedPendingOrderIds = selectedOrderIds.filter((id) =>
    selectableOrders.some((order) => order.id === id && getOrderStatus(order.id, order.status) !== 'pending'),
  )
  const isAllSelectableChecked =
    selectableOrders.length > 0 && selectableOrders.every((order) => selectedOrderIds.includes(order.id))

  const handleMarkDelivered = async (orderId: string) => {
    if (updatingOrderIds.length > 0) {
      return
    }

    setUpdateError(null)
    setOptimisticDeliveredOrderIds((current) => (current.includes(orderId) ? current : [...current, orderId]))
    setUpdatingOrderIds([orderId])

    try {
      await advanceOrderStatus(orderId, 'delivered')
      setSelectedOrderIds((current) => current.filter((id) => id !== orderId))
    } catch (error) {
      setOptimisticDeliveredOrderIds((current) => current.filter((id) => id !== orderId))
      setUpdateError(error instanceof Error ? error.message : 'Could not update order status.')
    } finally {
      setUpdatingOrderIds([])
    }
  }

  const handleMarkPending = async (orderId: string) => {
    if (updatingOrderIds.length > 0) {
      return
    }

    setUpdateError(null)
    setUpdatingOrderIds([orderId])

    try {
      await advanceOrderStatus(orderId, 'pending')
      setOptimisticDeliveredOrderIds((current) => current.filter((id) => id !== orderId))
      setSelectedOrderIds((current) => current.filter((id) => id !== orderId))
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Could not update order status.')
    } finally {
      setUpdatingOrderIds([])
    }
  }

  const handleToggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((current) => (
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId]
    ))
  }

  const handleToggleSelectAll = () => {
    if (isAllSelectableChecked) {
      setSelectedOrderIds((current) => (
        current.filter((id) => !selectableOrders.some((order) => order.id === id))
      ))
      return
    }

    setSelectedOrderIds((current) => {
      const withAll = [...current]

      selectableOrders.forEach((order) => {
        if (!withAll.includes(order.id)) {
          withAll.push(order.id)
        }
      })

      return withAll
    })
  }

  const handleBulkMarkDelivered = async () => {
    if (updatingOrderIds.length > 0 || selectedDeliverableOrderIds.length === 0) {
      return
    }

    const approved = window.confirm(`Approve delivery for ${selectedDeliverableOrderIds.length} selected orders?`)

    if (!approved) {
      return
    }

    setUpdateError(null)
    setOptimisticDeliveredOrderIds((current) => {
      const next = [...current]

      selectedDeliverableOrderIds.forEach((id) => {
        if (!next.includes(id)) {
          next.push(id)
        }
      })

      return next
    })
    setUpdatingOrderIds(selectedDeliverableOrderIds)

    try {
      await Promise.all(selectedDeliverableOrderIds.map((orderId) => advanceOrderStatus(orderId, 'delivered')))
      setSelectedOrderIds((current) => current.filter((id) => !selectedDeliverableOrderIds.includes(id)))
    } catch (error) {
      setOptimisticDeliveredOrderIds((current) => (
        current.filter((id) => !selectedDeliverableOrderIds.includes(id))
      ))
      setUpdateError(error instanceof Error ? error.message : 'Could not update selected orders.')
    } finally {
      setUpdatingOrderIds([])
    }
  }

  const handleBulkMarkPending = async () => {
    if (updatingOrderIds.length > 0 || selectedPendingOrderIds.length === 0) {
      return
    }

    const approved = window.confirm(`Set ${selectedPendingOrderIds.length} selected orders to pending?`)

    if (!approved) {
      return
    }

    setUpdateError(null)
    setUpdatingOrderIds(selectedPendingOrderIds)

    try {
      await Promise.all(selectedPendingOrderIds.map((orderId) => advanceOrderStatus(orderId, 'pending')))
      setOptimisticDeliveredOrderIds((current) => (
        current.filter((id) => !selectedPendingOrderIds.includes(id))
      ))
      setSelectedOrderIds((current) => current.filter((id) => !selectedPendingOrderIds.includes(id)))
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Could not update selected orders.')
    } finally {
      setUpdatingOrderIds([])
    }
  }

  return (
    <section className="market-grid">
      <div className="section-heading compact">
        <p className="section-kicker">{copy.sellerOrders.kicker}</p>
        <h2>{copy.sellerOrders.title}</h2>
      </div>
      {locationState?.notice ? <p className="form-notice form-notice-success">{locationState.notice}</p> : null}
      {updateError ? <p className="form-notice form-notice-error">{updateError}</p> : null}
      <section className="filter-strip">
        {viewButtons.map((button) => (
          <button
            key={button.id}
            type="button"
            className={button.id === activeView ? 'filter-chip filter-chip-active' : 'filter-chip'}
            onClick={() => setSearchParams(button.id === 'all' ? {} : { view: button.id }, { replace: true })}
          >
            {button.label}
          </button>
        ))}
      </section>
      <div className="table-toolbar">
        <p className="table-count-text">
          Rows: {visibleOrders.length} | Selected: {selectedDeliverableOrderIds.length}
        </p>
        <div className="table-toolbar-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void handleBulkMarkPending()}
            disabled={selectedPendingOrderIds.length === 0 || updatingOrderIds.length > 0}
          >
            Set Pending For Checked
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => void handleBulkMarkDelivered()}
            disabled={selectedDeliverableOrderIds.length === 0 || updatingOrderIds.length > 0}
          >
            Approve Delivered For Checked
          </button>
        </div>
      </div>
      <div className="table-shell">
        {visibleOrders.length === 0 ? (
          <article className="queue-card">
            <p>{copy.sellerOrders.noOrders}</p>
          </article>
        ) : (
          <>
            <table className="orders-table orders-table-desktop">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={isAllSelectableChecked}
                      onChange={handleToggleSelectAll}
                      disabled={selectableOrders.length === 0}
                      aria-label="Select all orders"
                    />
                  </th>
                  <th>{copy.common.orderId}</th>
                  <th>{copy.common.product}</th>
                  <th>{copy.common.buyer}</th>
                  <th>{copy.common.totalLabel}</th>
                  <th>{copy.common.status}</th>
                  <th>Ordered At (GMT+3)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => {
                  const status = getOrderStatus(order.id, order.status)
                  const listing = listings.find((item) => item.id === order.listingId)
                  const isDelivered = status === 'delivered'
                  const isUpdating = updatingOrderIds.includes(order.id)

                  return (
                    <tr key={order.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={() => handleToggleOrderSelection(order.id)}
                          disabled={isUpdating}
                          aria-label={`Select order ${order.id}`}
                        />
                      </td>
                      <td>{order.id}</td>
                      <td>{listing ? translateCatalogText(listing.title) : order.listingId}</td>
                      <td>{order.buyer}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>
                        <span className={isDelivered ? 'order-status order-status-complete' : 'order-status'}>
                          {translateOrderStatus(status)}
                        </span>
                      </td>
                      <td>{formatDateTimeGmt3(order.createdAt, language)}</td>
                      <td>
                        <div className="table-row-actions">
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => void handleMarkPending(order.id)}
                            disabled={isUpdating || status === 'pending' || updatingOrderIds.length > 0}
                          >
                            {status === 'pending' ? 'Pending' : 'Set Pending'}
                          </button>
                          <button
                            type="button"
                            className="button button-primary"
                            onClick={() => void handleMarkDelivered(order.id)}
                            disabled={isUpdating || isDelivered || updatingOrderIds.length > 0}
                          >
                            {isDelivered ? copy.sellerOrderDetail.delivered : copy.sellerOrders.deliverAction}
                          </button>
                          <Link className="inline-link" to={`/seller/orders/${order.id}`}>
                            {copy.sellerOrders.detailLink}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="orders-mobile-list" aria-label="Orders list">
              <label className="orders-mobile-select-all">
                <input
                  type="checkbox"
                  checked={isAllSelectableChecked}
                  onChange={handleToggleSelectAll}
                  disabled={selectableOrders.length === 0}
                  aria-label="Select all orders"
                />
                <span>Select all visible orders</span>
              </label>
              {visibleOrders.map((order) => {
                const status = getOrderStatus(order.id, order.status)
                const listing = listings.find((item) => item.id === order.listingId)
                const isDelivered = status === 'delivered'
                const isUpdating = updatingOrderIds.includes(order.id)

                return (
                  <article key={order.id} className="orders-mobile-card">
                    <label className="orders-mobile-select">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={() => handleToggleOrderSelection(order.id)}
                        disabled={isUpdating}
                        aria-label={`Select order ${order.id}`}
                      />
                      <span>Select order</span>
                    </label>
                    <div className="orders-mobile-card-grid">
                      <div>
                        <p className="orders-mobile-label">{copy.common.orderId}</p>
                        <p className="orders-mobile-value">{order.id}</p>
                      </div>
                      <div>
                        <p className="orders-mobile-label">{copy.common.status}</p>
                        <span className={isDelivered ? 'order-status order-status-complete' : 'order-status'}>
                          {translateOrderStatus(status)}
                        </span>
                      </div>
                      <div>
                        <p className="orders-mobile-label">{copy.common.product}</p>
                        <p className="orders-mobile-value">{listing ? translateCatalogText(listing.title) : order.listingId}</p>
                      </div>
                      <div>
                        <p className="orders-mobile-label">{copy.common.buyer}</p>
                        <p className="orders-mobile-value">{order.buyer}</p>
                      </div>
                      <div>
                        <p className="orders-mobile-label">{copy.common.totalLabel}</p>
                        <p className="orders-mobile-value">{formatCurrency(order.total)}</p>
                      </div>
                      <div>
                        <p className="orders-mobile-label">Ordered At (GMT+3)</p>
                        <p className="orders-mobile-value">{formatDateTimeGmt3(order.createdAt, language)}</p>
                      </div>
                    </div>
                    <div className="orders-mobile-actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => void handleMarkPending(order.id)}
                        disabled={isUpdating || status === 'pending' || updatingOrderIds.length > 0}
                      >
                        {status === 'pending' ? 'Pending' : 'Set Pending'}
                      </button>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => void handleMarkDelivered(order.id)}
                        disabled={isUpdating || isDelivered || updatingOrderIds.length > 0}
                      >
                        {isDelivered ? copy.sellerOrderDetail.delivered : copy.sellerOrders.deliverAction}
                      </button>
                      <Link className="button button-ghost orders-mobile-detail-link" to={`/seller/orders/${order.id}`}>
                        {copy.sellerOrders.detailLink}
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default SellerOrdersPage
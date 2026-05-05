import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { formatCurrency } from '../data'
import marketplaceApi from '../lib/marketplaceApi'
import type {
  AuthCredentials,
  CheckoutConfirmation,
  Listing,
  ListingEditorInput,
  ListingStatus,
  MarketplaceStore,
  Order,
  OrderStatus,
  ProfileInput,
  SellerAccount,
  Session,
  SignUpInput,
} from '../types'

type CheckoutPayload = {
  listingIds: string[]
  buyerName: string
  email: string
  phone: string
  addressLine: string
  city: string
  road: string
  block: string
  country: string
  paymentMethod: string
}

type MarketplaceContextValue = {
  isReady: boolean
  session: Session | null
  listings: Listing[]
  favoriteIds: string[]
  cartIds: string[]
  cartTotal: number
  listingStatuses: Record<string, ListingStatus>
  orders: Order[]
  pendingSellers: SellerAccount[]
  cartTotalLabel: string
  lastCheckout: CheckoutConfirmation | null
  signIn: (payload: AuthCredentials) => Promise<void>
  signUp: (payload: SignUpInput) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (payload: ProfileInput) => Promise<void>
  toggleFavorite: (listingId: string) => Promise<void>
  toggleCart: (listingId: string) => Promise<void>
  checkout: (payload: CheckoutPayload) => Promise<CheckoutConfirmation>
  createListing: (payload: ListingEditorInput) => Promise<void>
  updateListing: (listingId: string, payload: ListingEditorInput) => Promise<void>
  deleteListing: (listingId: string) => Promise<void>
  updateListingStatus: (listingId: string, status: ListingStatus) => Promise<void>
  addModerationNote: (listingId: string, note: string) => Promise<void>
  advanceOrderStatus: (orderId: string) => Promise<void>
  sendOrderMessage: (orderId: string, text: string) => Promise<void>
  addListingReview: (listingId: string, payload: { rating: number; comment: string }) => Promise<void>
  updateSellerStatus: (userId: string, status: 'pending' | 'active') => Promise<void>
  clearLastCheckout: () => void
  getOrderStatusLabel: (status: OrderStatus) => string
}

const MarketplaceContext = createContext<MarketplaceContextValue | undefined>(undefined)

function MarketplaceProvider({ children }: PropsWithChildren) {
  const [store, setStore] = useState<MarketplaceStore | null>(null)
  const [lastCheckout, setLastCheckout] = useState<CheckoutConfirmation | null>(null)

  useEffect(() => {
    void marketplaceApi.getStore().then(setStore)
  }, [])

  const listings = store?.listings ?? []
  const favoriteIds = store?.favoriteIds ?? []
  const cartIds = store?.cartIds ?? []
  const orders = store?.orders ?? []
  const pendingSellers = store?.pendingSellers ?? []
  const listingStatuses = Object.fromEntries(listings.map((listing) => [listing.id, listing.status]))

  const cartTotal = cartIds.reduce((total, listingId) => {
    const listing = listings.find((item) => item.id === listingId)
    return total + (listing?.price ?? 0)
  }, 0)

  const updateFromApi = async (operation: Promise<MarketplaceStore>) => {
    const nextStore = await operation
    setStore(nextStore)
  }

  const value: MarketplaceContextValue = {
    isReady: store !== null,
    session: store?.session ?? null,
    listings,
    favoriteIds,
    cartIds,
    cartTotal,
    listingStatuses,
    orders,
    pendingSellers,
    cartTotalLabel: formatCurrency(cartTotal),
    lastCheckout,
    signIn: async (payload) => updateFromApi(marketplaceApi.signIn(payload)),
    signUp: async (payload) => updateFromApi(marketplaceApi.signUp(payload)),
    signOut: async () => updateFromApi(marketplaceApi.signOut()),
    updateProfile: async (payload) => updateFromApi(marketplaceApi.updateProfile(payload)),
    toggleFavorite: async (listingId) => updateFromApi(marketplaceApi.toggleFavorite(listingId)),
    toggleCart: async (listingId) => updateFromApi(marketplaceApi.toggleCart(listingId)),
    checkout: async (payload) => {
      const response = await marketplaceApi.checkout(payload)
      setStore(response.store)
      setLastCheckout(response.confirmation)
      return response.confirmation
    },
    createListing: async (payload) => updateFromApi(marketplaceApi.createListing(payload)),
    updateListing: async (listingId, payload) => updateFromApi(marketplaceApi.updateListing(listingId, payload)),
    deleteListing: async (listingId) => updateFromApi(marketplaceApi.deleteListing(listingId)),
    updateListingStatus: async (listingId, status) => updateFromApi(marketplaceApi.updateListingStatus(listingId, status)),
    addModerationNote: async (listingId, note) => updateFromApi(marketplaceApi.addModerationNote(listingId, note)),
    advanceOrderStatus: async (orderId) => updateFromApi(marketplaceApi.advanceOrderStatus(orderId)),
    sendOrderMessage: async (orderId, text) => updateFromApi(marketplaceApi.sendOrderMessage(orderId, text)),
    addListingReview: async (listingId, payload) => updateFromApi(marketplaceApi.addListingReview(listingId, payload)),
    updateSellerStatus: async (userId, status) => updateFromApi(marketplaceApi.updateSellerStatus(userId, status)),
    clearLastCheckout: () => setLastCheckout(null),
    getOrderStatusLabel: (status) => status.replace(/^./, (char) => char.toUpperCase()),
  }

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>
}

const useMarketplace = () => {
  const value = useContext(MarketplaceContext)

  if (!value) {
    throw new Error('useMarketplace must be used within MarketplaceProvider')
  }

  return value
}

export { MarketplaceProvider, useMarketplace }
export type MarketplaceRole = 'buyer' | 'seller' | 'admin'

export type AuthCredentials = {
  identifier: string
  password: string
}

export type SignUpInput = {
  username: string
  email: string
  phone: string
  password: string
  role: MarketplaceRole
}

export type ListingStatus = 'live' | 'review' | 'paused'

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered'

export type ModerationNote = {
  author: string
  note: string
  createdAt: string
}

export type Listing = {
  id: string
  title: string
  imageUrl: string
  seller: string
  price: number
  meta: string
  description: string
  category: string
  trust: string
  shipping: string
  reviewScore: number
  inventory: number
  status: ListingStatus
  moderationNotes: ModerationNote[]
}

export type ListingEditorInput = {
  title: string
  imageUrl: string
  price: number
  meta: string
  description: string
  category: string
  trust: string
  shipping: string
  inventory: number
}

export type Order = {
  id: string
  listingId: string
  buyer: string
  total: number
  status: OrderStatus
  email: string
  shippingAddress: string
  paymentMethod: string
}

export type Session = {
  id: string
  name: string
  username: string
  email: string
  phone: string
  role: MarketplaceRole
  accountStatus: 'pending' | 'active'
}

export type SellerAccount = {
  id: string
  username: string
  email: string
  phone: string
  accountStatus: 'pending' | 'active'
}

export type MarketplaceStore = {
  session: Session | null
  listings: Listing[]
  favoriteIds: string[]
  cartIds: string[]
  orders: Order[]
  pendingSellers?: SellerAccount[]
}

export type CheckoutConfirmation = {
  buyerName: string
  email: string
  address: string
  paymentMethod: string
  emailSent: boolean
  orderIds: string[]
}
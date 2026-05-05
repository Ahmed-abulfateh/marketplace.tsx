import type {
  AuthCredentials,
  CheckoutConfirmation,
  ListingEditorInput,
  ListingStatus,
  MarketplaceStore,
  OrderStatus,
  ProfileInput,
  SignUpInput,
} from '../types'

const TOKEN_KEY = 'signal-market-token'
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

const readToken = () => window.localStorage.getItem(TOKEN_KEY)

const writeToken = (token: string | null) => {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token)
    return
  }

  window.localStorage.removeItem(TOKEN_KEY)
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = readToken()
  let response: Response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new Error('Could not reach the marketplace server. Check that the backend is running and try again.')
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`

    try {
      const errorBody = await response.json()

      if (typeof errorBody?.message === 'string') {
        message = errorBody.message
      }
    } catch {
      // Keep the fallback message when the response has no JSON body.
    }

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

type StoreResponse = { store: MarketplaceStore }
type SignInResponse = { token: string; store: MarketplaceStore }
type CheckoutResponse = { store: MarketplaceStore; confirmation: CheckoutConfirmation }

const marketplaceApi = {
  getStore: async () => {
    const response = await request<StoreResponse>('/api/bootstrap')
    return response.store
  },

  signIn: async (payload: AuthCredentials) => {
    const response = await request<SignInResponse>('/api/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    writeToken(response.token)
    return response.store
  },

  signUp: async (payload: SignUpInput) => {
    const response = await request<SignInResponse>('/api/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    writeToken(response.token)
    return response.store
  },

  signOut: async () => {
    writeToken(null)
    const response = await request<StoreResponse>('/api/bootstrap')
    return response.store
  },

  updateProfile: async (payload: ProfileInput) => {
    const response = await request<StoreResponse>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return response.store
  },

  toggleFavorite: async (listingId: string) => {
    const response = await request<StoreResponse>(`/api/favorites/${listingId}/toggle`, {
      method: 'POST',
    })
    return response.store
  },

  toggleCart: async (listingId: string) => {
    const response = await request<StoreResponse>(`/api/cart/${listingId}/toggle`, {
      method: 'POST',
    })
    return response.store
  },

  createListing: async (payload: ListingEditorInput) => {
    const response = await request<StoreResponse>('/api/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return response.store
  },

  updateListing: async (listingId: string, payload: ListingEditorInput) => {
    const response = await request<StoreResponse>(`/api/listings/${listingId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return response.store
  },

  deleteListing: async (listingId: string) => {
    const response = await request<StoreResponse>(`/api/listings/${listingId}`, {
      method: 'DELETE',
    })
    return response.store
  },

  updateListingStatus: async (listingId: string, status: ListingStatus) => {
    const response = await request<StoreResponse>(`/api/listings/${listingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    return response.store
  },

  addModerationNote: async (listingId: string, note: string) => {
    const response = await request<StoreResponse>(`/api/listings/${listingId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    })
    return response.store
  },

  advanceOrderStatus: async (orderId: string, status?: OrderStatus | 'complete') => {
    const response = await request<StoreResponse>(`/api/orders/${orderId}/advance`, {
      method: 'PATCH',
      body: JSON.stringify(status ? { status } : {}),
    })
    return response.store
  },

  sendOrderMessage: async (orderId: string, text: string) => {
    const response = await request<StoreResponse>(`/api/orders/${orderId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    return response.store
  },

  addListingReview: async (listingId: string, payload: { rating: number; comment: string }) => {
    const response = await request<StoreResponse>(`/api/listings/${listingId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return response.store
  },

  updateSellerStatus: async (userId: string, status: 'pending' | 'active') => {
    const response = await request<StoreResponse>(`/api/admin/sellers/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    return response.store
  },

  checkout: async (payload: {
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
  }) => request<CheckoutResponse>('/api/checkout', { method: 'POST', body: JSON.stringify(payload) }),

  requestPasswordReset: async () =>
    request<{ message: string; resetUrl?: string }>('/api/auth/request-password-reset', { method: 'POST' }),

  resetPassword: async (token: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
}

export default marketplaceApi
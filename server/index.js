import cors from 'cors'
import crypto from 'crypto'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import path from 'path'
import { fileURLToPath } from 'url'
import { hashPassword, verifyPassword } from './lib/auth.js'
import AppState from './models/AppState.js'
import Listing from './models/Listing.js'
import Order from './models/Order.js'
import User from './models/User.js'
import {
  defaultAppStateByRole,
  demoListingIds,
  demoOrderIds,
  initialListings,
  initialOrders,
  initialUsers,
} from './seed/initialData.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.resolve(__dirname, '../dist')
const hasBuiltFrontend = fs.existsSync(path.join(distDir, 'index.html'))

const app = express()
const port = Number(process.env.PORT ?? 4000)
const jwtSecret = process.env.JWT_SECRET || 'dev-secret'
const orderStatusFlow = {
  pending: 'paid',
  paid: 'shipped',
  shipped: 'delivered',
  delivered: 'delivered',
}

const allowedOrigins = Array.from(
  new Set([
    process.env.FRONTEND_URL,
    'https://ahmed-abulfateh.github.io',
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5178',
    'http://127.0.0.1:5178',
  ].filter(Boolean)),
)

const isAllowedOrigin = (origin) => {
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    return true
  }

  try {
    const parsedOrigin = new URL(origin)
    const isLocalhost = ['localhost', '127.0.0.1'].includes(parsedOrigin.hostname)
    const hasDevPort = /^\d+$/.test(parsedOrigin.port)

    return isLocalhost && hasDevPort
  } catch {
    return false
  }
}

const mailTransport =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null

app.use(
  '/api',
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Origin is not allowed by CORS.'))
    },
  }),
)
app.use(express.json())

if (hasBuiltFrontend) {
  app.use(express.static(distDir))
}

const cleanDocument = (document) => {
  if (!document) {
    return document
  }

  const { _id, __v, ...rest } = document
  return rest
}

const createSession = (user) => ({
  id: user.id,
  name: user.username,
  username: user.username,
  email: user.email,
  phone: user.phone,
  addressLine: user.addressLine ?? '',
  city: user.city ?? '',
  road: user.road ?? '',
  block: user.block ?? '',
  country: user.country ?? '',
  role: user.role,
  accountStatus: user.accountStatus ?? 'active',
})

const ensureSeedData = async () => {
  if (demoListingIds.length > 0) {
    await Listing.deleteMany({ id: { $in: demoListingIds } })
    await Order.deleteMany({ $or: [{ id: { $in: demoOrderIds } }, { listingId: { $in: demoListingIds } }] })
    await AppState.updateMany(
      {},
      {
        $pull: {
          favoriteIds: { $in: demoListingIds },
          cartIds: { $in: demoListingIds },
        },
      },
    )
  }

  if ((await Listing.countDocuments()) === 0) {
    await Listing.insertMany(initialListings)
  }

  if ((await Order.countDocuments()) === 0) {
    await Order.insertMany(initialOrders)
  }

  for (const user of initialUsers) {
    await User.updateOne(
      { email: user.email },
      {
        $setOnInsert: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          addressLine: user.addressLine ?? '',
          city: user.city ?? '',
          road: user.road ?? '',
          block: user.block ?? '',
          country: user.country ?? '',
          passwordHash: hashPassword(user.password),
          role: user.role,
          accountStatus: 'active',
        },
      },
      { upsert: true },
    )
  }

  // Ensure any existing users without accountStatus are migrated to active.
  await User.updateMany({ accountStatus: { $exists: false } }, { $set: { accountStatus: 'active' } })
}

const ensureUserState = async (session) => {
  const defaults = defaultAppStateByRole[session.role] ?? { favoriteIds: [], cartIds: [] }
  const state = await AppState.findOneAndUpdate(
    { ownerId: session.id },
    { $setOnInsert: { ownerId: session.id, role: session.role, ...defaults } },
    { returnDocument: 'after', upsert: true },
  ).lean()

  return cleanDocument(state)
}

const buildStore = async (session = null) => {
  let activeSession = session

  if (session?.id) {
    const user = await User.findOne({ id: session.id }).lean()
    activeSession = user ? createSession(user) : null
  }

  const listings = (await Listing.find().sort({ createdAt: -1 }).lean()).map(cleanDocument)
  const orders = (await Order.find().sort({ createdAt: -1 }).lean()).map(cleanDocument)
  const appState = activeSession ? await ensureUserState(activeSession) : null

  const pendingSellers =
    activeSession?.role === 'admin'
      ? (await User.find({ role: 'seller' }).sort({ createdAt: -1 }).lean()).map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          accountStatus: u.accountStatus ?? 'active',
        }))
      : undefined

  return {
    session: activeSession,
    listings,
    favoriteIds: appState?.favoriteIds ?? [],
    cartIds: appState?.cartIds ?? [],
    orders,
    ...(pendingSellers !== undefined ? { pendingSellers } : {}),
  }
}

const parseSession = (req) => {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  try {
    return jwt.verify(authorization.slice(7), jwtSecret)
  } catch {
    return null
  }
}

const authRequired = (roles) => async (req, res, next) => {
  const tokenSession = parseSession(req)

  if (!tokenSession) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

  const user = await User.findOne({ id: tokenSession.id }).lean()

  if (!user) {
    return res.status(401).json({ message: 'User session is no longer valid.' })
  }

  const session = createSession(user)

  if (roles && !roles.includes(session.role)) {
    return res.status(403).json({ message: 'Role is not allowed for this action.' })
  }

  req.session = session
  next()
}

const sellerApproved = async (req, res, next) => {
  if (req.session.role === 'admin') {
    return next()
  }

  if (req.session.accountStatus !== 'active') {
    return res.status(403).json({ message: 'Your seller account is pending admin approval.' })
  }

  next()
}

const issueToken = (session) => jwt.sign(session, jwtSecret, { expiresIn: '7d' })

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const editableListingFields = [
  'title',
  'imageUrl',
  'imageUrls',
  'price',
  'meta',
  'description',
  'category',
  'trust',
  'shipping',
  'inventory',
]

const pickListingUpdates = (payload = {}) =>
  Object.fromEntries(
    editableListingFields
      .filter((field) => payload[field] !== undefined)
      .map((field) => {
        if (field === 'price' || field === 'inventory') {
          return [field, Number(payload[field])]
        }

        if (field === 'imageUrl') {
          return [field, String(payload[field] ?? '').trim()]
        }

        if (field === 'imageUrls') {
          const imageUrls = Array.isArray(payload[field])
            ? payload[field].map((value) => String(value ?? '').trim()).filter(Boolean).slice(0, 6)
            : []

          return [field, imageUrls]
        }

        return [field, payload[field]]
      }),
  )

const isValidListingImageUrl = (value) => {
  if (!value) {
    return true
  }

  try {
    const parsed = new URL(String(value))
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const normalizeListingImageUrls = (payload = {}) => {
  const imageUrls = Array.isArray(payload.imageUrls)
    ? payload.imageUrls.map((value) => String(value ?? '').trim()).filter(Boolean).slice(0, 6)
    : []
  const fallbackImageUrl = String(payload.imageUrl ?? '').trim()

  if (fallbackImageUrl && !imageUrls.includes(fallbackImageUrl)) {
    imageUrls.unshift(fallbackImageUrl)
  }

  return imageUrls.slice(0, 6)
}

const hasOnlyValidListingImages = (imageUrls) => imageUrls.every((value) => isValidListingImageUrl(value))

const findManagedListing = async (req, res) => {
  const listing = await Listing.findOne({ id: req.params.listingId }).lean()

  if (!listing) {
    res.status(404).json({ message: 'Listing not found.' })
    return null
  }

  const isAdmin = req.session.role === 'admin'
  const isOwner = listing.seller === req.session.name

  if (!isAdmin && !isOwner) {
    res.status(403).json({ message: 'You cannot manage this listing.' })
    return null
  }

  return listing
}

const canManageOrder = async (session, order) => {
  if (session.role === 'admin') {
    return true
  }

  // Any role: order placed by this user (buyer side).
  if (
    order.buyerId === session.id ||
    order.buyer === session.name ||
    (session.email && order.email === session.email)
  ) {
    return true
  }

  // Seller: also allowed if they own the listing (seller side).
  if (session.role === 'seller') {
    const listing = await Listing.findOne({ id: order.listingId }).lean()
    return listing?.seller === session.name
  }

  return false
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/bootstrap', async (req, res) => {
  const session = parseSession(req)
  res.json({ store: await buildStore(session) })
})

app.post('/api/auth/sign-in', async (req, res) => {
  const identifier = String(req.body?.identifier ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email or phone and password are required.' })
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  }).lean()

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }

  const session = createSession(user)
  res.json({ token: issueToken(session), store: await buildStore(session) })
})

app.post('/api/auth/sign-up', async (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const phone = String(req.body?.phone ?? '').trim()
  const addressLine = String(req.body?.addressLine ?? '').trim()
  const city = String(req.body?.city ?? '').trim()
  const road = String(req.body?.road ?? '').trim()
  const block = String(req.body?.block ?? '').trim()
  const country = String(req.body?.country ?? '').trim()
  const password = String(req.body?.password ?? '')
  const role = req.body?.role
  const publicRoles = ['buyer', 'seller']

  if (!username || !email || !phone || !password || !publicRoles.includes(role)) {
    return res.status(400).json({ message: 'Username, email, phone, password, and role are required.' })
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }],
  }).lean()

  if (existingUser) {
    return res.status(409).json({ message: 'An account with that email or phone already exists.' })
  }

  const user = await User.create({
    id: `usr-${Date.now()}`,
    username,
    email,
    phone,
    addressLine,
    city,
    road,
    block,
    country,
    passwordHash: hashPassword(password),
    role,
    accountStatus: role === 'seller' ? 'pending' : 'active',
  })

  const session = createSession(user)
  res.status(201).json({ token: issueToken(session), store: await buildStore(session) })
})

app.post('/api/auth/request-password-reset', authRequired(['buyer', 'seller', 'admin']), async (req, res) => {
  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  const user = await User.findOneAndUpdate(
    { id: req.session.id },
    { $set: { passwordResetToken: token, passwordResetExpiry: expiry } },
    { new: true },
  ).lean()

  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
  const resetUrl = `${frontendUrl}/marketplace.tsx/reset-password?token=${token}`

  if (mailTransport) {
    await mailTransport.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: 'Reset your Signal Market password',
      html: `<p>Click the link below to reset your Signal Market password. It expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`,
    })
    res.json({ message: 'Password reset email sent.' })
  } else {
    res.json({ message: 'Password reset link generated.', resetUrl })
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  const token = String(req.body?.token ?? '').trim()
  const newPassword = String(req.body?.newPassword ?? '')

  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Token and a password of at least 8 characters are required.' })
  }

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpiry: { $gt: new Date() },
  }).lean()

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' })
  }

  await User.findOneAndUpdate(
    { id: user.id },
    { $set: { passwordHash: hashPassword(newPassword), passwordResetToken: null, passwordResetExpiry: null } },
  )

  res.json({ message: 'Password updated successfully. You can now sign in with your new password.' })
})

app.patch('/api/profile', authRequired(['buyer', 'seller', 'admin']), async (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const phone = String(req.body?.phone ?? '').trim()
  const addressLine = String(req.body?.addressLine ?? '').trim()
  const city = String(req.body?.city ?? '').trim()
  const road = String(req.body?.road ?? '').trim()
  const block = String(req.body?.block ?? '').trim()
  const country = String(req.body?.country ?? '').trim()

  if (!username || !email || !phone) {
    return res.status(400).json({ message: 'Username, email, and phone are required.' })
  }

  const conflictingUser = await User.findOne({
    id: { $ne: req.session.id },
    $or: [{ email }, { phone }],
  }).lean()

  if (conflictingUser) {
    return res.status(409).json({ message: 'Another account already uses that email or phone.' })
  }

  const user = await User.findOneAndUpdate(
    { id: req.session.id },
    {
      $set: {
        username,
        email,
        phone,
        addressLine,
        city,
        road,
        block,
        country,
      },
    },
    { new: true },
  ).lean()

  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  const session = createSession(user)
  res.json({ store: await buildStore(session) })
})

app.post('/api/favorites/:listingId/toggle', authRequired(['buyer', 'seller', 'admin']), async (req, res) => {
  const state = await ensureUserState(req.session)
  const favoriteIds = state.favoriteIds.includes(req.params.listingId)
    ? state.favoriteIds.filter((id) => id !== req.params.listingId)
    : [...state.favoriteIds, req.params.listingId]

  await AppState.updateOne({ ownerId: req.session.id }, { $set: { favoriteIds, role: req.session.role } })
  res.json({ store: await buildStore(req.session) })
})

app.post('/api/cart/:listingId/toggle', authRequired(['buyer', 'seller', 'admin']), async (req, res) => {
  const state = await ensureUserState(req.session)
  const cartIds = state.cartIds.includes(req.params.listingId)
    ? state.cartIds.filter((id) => id !== req.params.listingId)
    : [...state.cartIds, req.params.listingId]

  await AppState.updateOne({ ownerId: req.session.id }, { $set: { cartIds, role: req.session.role } })
  res.json({ store: await buildStore(req.session) })
})

app.post('/api/listings', authRequired(['seller', 'admin']), sellerApproved, async (req, res) => {
  const payload = req.body ?? {}
  const imageUrls = normalizeListingImageUrls(payload)
  const imageUrl = imageUrls[0] ?? ''

  if (!hasOnlyValidListingImages(imageUrls)) {
    return res.status(400).json({ message: 'Image URL must be a valid http(s) URL.' })
  }

  await Listing.create({
    id: slugify(payload.title || `listing-${Date.now()}`),
    title: payload.title,
    imageUrl,
    imageUrls,
    seller: req.session.name,
    price: Number(payload.price),
    meta: payload.meta,
    description: payload.description,
    category: payload.category,
    trust: payload.trust,
    shipping: payload.shipping,
    reviewScore: Number(payload.reviewScore ?? 4.8),
    inventory: Number(payload.inventory),
    status: 'review',
    moderationNotes: [],
  })

  res.status(201).json({ store: await buildStore(req.session) })
})

app.patch('/api/listings/:listingId', authRequired(['seller', 'admin']), sellerApproved, async (req, res) => {
  const listing = await findManagedListing(req, res)

  if (!listing) {
    return
  }

  const imageUrls = normalizeListingImageUrls(req.body)

  if ((req.body?.imageUrl !== undefined || req.body?.imageUrls !== undefined) && !hasOnlyValidListingImages(imageUrls)) {
    return res.status(400).json({ message: 'Image URL must be a valid http(s) URL.' })
  }

  const updates = pickListingUpdates({
    ...req.body,
    ...(req.body?.imageUrl !== undefined || req.body?.imageUrls !== undefined
      ? { imageUrl: imageUrls[0] ?? '', imageUrls }
      : {}),
  })

  await Listing.updateOne({ id: listing.id }, { $set: updates })
  res.json({ store: await buildStore(req.session) })
})

app.delete('/api/listings/:listingId', authRequired(['seller', 'admin']), sellerApproved, async (req, res) => {
  const listing = await findManagedListing(req, res)

  if (!listing) {
    return
  }

  await Listing.deleteOne({ id: listing.id })
  await AppState.updateMany(
    {},
    {
      $pull: {
        favoriteIds: listing.id,
        cartIds: listing.id,
      },
    },
  )

  res.json({ store: await buildStore(req.session) })
})

app.patch('/api/listings/:listingId/status', authRequired(['seller', 'admin']), sellerApproved, async (req, res) => {
  const listing = await findManagedListing(req, res)

  if (!listing) {
    return
  }

  await Listing.updateOne({ id: listing.id }, { $set: { status: req.body?.status } })
  res.json({ store: await buildStore(req.session) })
})

app.post('/api/listings/:listingId/notes', authRequired(['admin']), async (req, res) => {
  await Listing.updateOne(
    { id: req.params.listingId },
    {
      $push: {
        moderationNotes: {
          author: req.session.name,
          note: req.body?.note,
        },
      },
    },
  )

  res.json({ store: await buildStore(req.session) })
})

app.patch('/api/orders/:orderId/advance', authRequired(['seller', 'admin']), async (req, res) => {
  const order = await Order.findOne({ id: req.params.orderId }).lean()

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  const canManage = await canManageOrder(req.session, order)

  if (!canManage) {
    return res.status(403).json({ message: 'You cannot manage this order.' })
  }

  const requestedStatus = String(req.body?.status ?? '').trim().toLowerCase()
  const allowedManualStatuses = ['pending', 'paid', 'shipped', 'delivered', 'complete']

  if (requestedStatus && !allowedManualStatuses.includes(requestedStatus)) {
    return res.status(400).json({ message: 'Status must be pending, paid, shipped, or delivered.' })
  }

  const nextStatus = requestedStatus
    ? requestedStatus === 'complete' ? 'delivered' : requestedStatus
    : orderStatusFlow[order.status] ?? order.status

  await Order.updateOne(
    { id: req.params.orderId },
    { $set: { status: nextStatus } },
  )

  if (mailTransport && order.email && nextStatus !== order.status) {
    try {
      await mailTransport.sendMail({
        from: process.env.WORKSPACE_EMAIL || process.env.SMTP_USER,
        to: order.email,
        subject: `Signal Market order ${order.id} status updated`,
        text: `Your order ${order.id} is now ${nextStatus}.`,
      })
    } catch (error) {
      console.error('Order status email failed:', error)
    }
  }

  res.json({ store: await buildStore(req.session) })
})

app.post('/api/orders/:orderId/messages', authRequired(['buyer', 'seller', 'admin']), async (req, res) => {
  const order = await Order.findOne({ id: req.params.orderId }).lean()

  if (!order) {
    return res.status(404).json({ message: 'Order not found.' })
  }

  const canManage = await canManageOrder(req.session, order)

  if (!canManage) {
    return res.status(403).json({ message: 'You cannot message on this order.' })
  }

  const text = String(req.body?.text ?? '').trim()

  if (!text) {
    return res.status(400).json({ message: 'Message text is required.' })
  }

  await Order.updateOne(
    { id: req.params.orderId },
    {
      $push: {
        messages: {
          senderId: req.session.id,
          senderName: req.session.name,
          senderRole: req.session.role,
          text,
        },
      },
    },
  )

  res.status(201).json({ store: await buildStore(req.session) })
})

app.post('/api/listings/:listingId/reviews', authRequired(['buyer', 'admin']), async (req, res) => {
  const listing = await Listing.findOne({ id: req.params.listingId }).lean()

  if (!listing) {
    return res.status(404).json({ message: 'Listing not found.' })
  }

  const rating = Number(req.body?.rating)
  const comment = String(req.body?.comment ?? '').trim()

  if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !comment) {
    return res.status(400).json({ message: 'Rating (1-5) and comment are required.' })
  }

  const deliveredOrders = await Order.find({ listingId: listing.id, status: 'delivered' }).lean()
  const matchingOrder = deliveredOrders.find(
    (order) => order.buyerId === req.session.id || order.buyer === req.session.name,
  )

  if (!matchingOrder) {
    return res.status(403).json({ message: 'Only buyers with delivered orders can add reviews.' })
  }

  if (listing.reviews?.some((review) => review.orderId === matchingOrder.id)) {
    return res.status(409).json({ message: 'Review already submitted for this order.' })
  }

  const nextReviews = [
    ...(listing.reviews ?? []),
    {
      orderId: matchingOrder.id,
      buyerId: req.session.id,
      author: req.session.name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    },
  ]
  const nextScore = nextReviews.reduce((sum, review) => sum + review.rating, 0) / nextReviews.length

  await Listing.updateOne(
    { id: listing.id },
    {
      $set: { reviewScore: Number(nextScore.toFixed(1)) },
      $push: {
        reviews: {
          orderId: matchingOrder.id,
          buyerId: req.session.id,
          author: req.session.name,
          rating,
          comment,
        },
      },
    },
  )

  res.status(201).json({ store: await buildStore(req.session) })
})

app.get('/api/admin/sellers', authRequired(['admin']), async (req, res) => {
  const sellers = await User.find({ role: 'seller' }).sort({ createdAt: -1 }).lean()
  res.json({
    sellers: sellers.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      phone: u.phone,
      accountStatus: u.accountStatus ?? 'active',
    })),
  })
})

app.patch('/api/admin/sellers/:userId/status', authRequired(['admin']), async (req, res) => {
  const { status } = req.body ?? {}

  if (!['pending', 'active'].includes(status)) {
    return res.status(400).json({ message: 'Status must be pending or active.' })
  }

  const user = await User.findOneAndUpdate(
    { id: req.params.userId, role: 'seller' },
    { $set: { accountStatus: status } },
    { new: true },
  ).lean()

  if (!user) {
    return res.status(404).json({ message: 'Seller not found.' })
  }

  res.json({ store: await buildStore(req.session) })
})

app.post('/api/checkout', authRequired(['buyer', 'seller', 'admin']), async (req, res) => {
  const {
    addressLine,
    block,
    buyerName,
    city,
    country,
    email,
    listingIds,
    paymentMethod,
    phone,
    road,
  } = req.body ?? {}
  const requestedListingIds = Array.isArray(listingIds) ? listingIds : []

  if (requestedListingIds.length === 0) {
    return res.status(400).json({ message: 'At least one listing is required for checkout.' })
  }

  const listingQuantityMap = requestedListingIds.reduce((map, id) => {
    const key = String(id)
    map.set(key, (map.get(key) ?? 0) + 1)
    return map
  }, new Map())

  const listings = await Listing.find({ id: { $in: Array.from(listingQuantityMap.keys()) } }).lean()

  if (listings.length !== listingQuantityMap.size) {
    return res.status(404).json({ message: 'One or more selected listings were not found.' })
  }

  const outOfStockListing = listings.find((listing) => listing.inventory < (listingQuantityMap.get(listing.id) ?? 0))

  if (outOfStockListing) {
    return res.status(409).json({ message: `Insufficient stock for ${outOfStockListing.title}.` })
  }

  const decrementedListings = []

  try {
    for (const listing of listings) {
      const requestedQuantity = listingQuantityMap.get(listing.id) ?? 0

      if (requestedQuantity <= 0) {
        continue
      }

      const updatedListing = await Listing.findOneAndUpdate(
        { id: listing.id, inventory: { $gte: requestedQuantity } },
        { $inc: { inventory: -requestedQuantity } },
        { new: true },
      ).lean()

      if (!updatedListing) {
        throw new Error(`Insufficient stock for ${listing.title}.`)
      }

      decrementedListings.push({ id: listing.id, quantity: requestedQuantity })
    }
  } catch (error) {
    await Promise.all(
      decrementedListings.map(({ id, quantity }) =>
        Listing.updateOne({ id }, { $inc: { inventory: quantity } }),
      ),
    )

    return res.status(409).json({
      message: error instanceof Error ? error.message : 'Unable to confirm order due to stock availability.',
    })
  }

  try {
    const count = await Order.countDocuments()
    const shippingAddress = [addressLine, city, road, block, country].filter(Boolean).join(', ')
    const createdOrders = await Order.insertMany(
      requestedListingIds.map((listingId, index) => {
        const listing = listings.find((item) => item.id === String(listingId))

        if (!listing) {
          throw new Error('Could not build orders for checkout.')
        }

        return {
          id: `ord-${1044 + count + index}`,
          listingId: listing.id,
          buyerId: req.session.id,
          buyer: buyerName,
          total: listing.price,
          status: 'pending',
          email,
          phone,
          addressLine,
          city,
          road,
          block,
          country,
          shippingAddress,
          paymentMethod,
          messages: [],
        }
      }),
    )

    await AppState.updateOne({ ownerId: req.session.id }, { $set: { cartIds: [] } })

    let emailSent = false

    if (mailTransport && email) {
      try {
        await mailTransport.sendMail({
          from: process.env.WORKSPACE_EMAIL || process.env.SMTP_USER,
          to: email,
          subject: 'Signal Market order confirmation',
          text: `Your order has been created for ${createdOrders.length} item(s).`,
        })
        emailSent = true
      } catch (error) {
        console.error('Email send failed:', error)
      }
    }

    res.status(201).json({
      store: await buildStore(req.session),
      confirmation: {
        buyerName,
        email,
        address: shippingAddress,
        paymentMethod,
        emailSent,
        orderIds: createdOrders.map((order) => order.id),
      },
    })
  } catch (error) {
    await Promise.all(
      decrementedListings.map(({ id, quantity }) =>
        Listing.updateOne({ id }, { $inc: { inventory: quantity } }),
      ),
    )

    res.status(500).json({ message: error instanceof Error ? error.message : 'Checkout failed.' })
  }
})

if (hasBuiltFrontend) {
  app.get(/^\/(?!api(?:\/|$))(?!.*\.[a-zA-Z0-9]+$).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    await AppState.deleteMany({ ownerId: { $exists: false } })
    await User.deleteMany({
      $or: [
        { email: { $exists: false } },
        { email: null },
        { phone: { $exists: false } },
        { phone: null },
        { passwordHash: { $exists: false } },
        { passwordHash: null },
      ],
    })
    await Promise.all([AppState.syncIndexes(), User.syncIndexes()])
    await ensureSeedData()
    app.listen(port, () => {
      console.log(`Marketplace server listening on port ${port}`)
    })
  } catch (error) {
    console.error('Server startup failed:', error)
    process.exit(1)
  }
}

start()
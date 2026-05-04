import cors from 'cors'
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
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
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
  const listings = (await Listing.find().sort({ createdAt: -1 }).lean()).map(cleanDocument)
  const orders = (await Order.find().sort({ createdAt: -1 }).lean()).map(cleanDocument)
  const appState = session ? await ensureUserState(session) : null

  const pendingSellers =
    session?.role === 'admin'
      ? (await User.find({ role: 'seller' }).sort({ createdAt: -1 }).lean()).map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          accountStatus: u.accountStatus ?? 'active',
        }))
      : undefined

  return {
    session,
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
  const session = parseSession(req)

  if (!session) {
    return res.status(401).json({ message: 'Authentication required.' })
  }

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
      .map((field) => [field, field === 'price' || field === 'inventory' ? Number(payload[field]) : payload[field]]),
  )

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
    passwordHash: hashPassword(password),
    role,
    accountStatus: role === 'seller' ? 'pending' : 'active',
  })

  const session = createSession(user)
  res.status(201).json({ token: issueToken(session), store: await buildStore(session) })
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
  await Listing.create({
    id: slugify(payload.title || `listing-${Date.now()}`),
    title: payload.title,
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

  await Listing.updateOne({ id: listing.id }, { $set: pickListingUpdates(req.body) })
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

  await Order.updateOne(
    { id: req.params.orderId },
    { $set: { status: orderStatusFlow[order.status] ?? order.status } },
  )

  res.json({ store: await buildStore(req.session) })
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
  const { address, buyerName, email, listingIds, paymentMethod } = req.body ?? {}
  const listings = await Listing.find({ id: { $in: listingIds ?? [] } }).lean()
  const count = await Order.countDocuments()
  const createdOrders = await Order.insertMany(
    listings.map((listing, index) => ({
      id: `ord-${1044 + count + index}`,
      listingId: listing.id,
      buyer: buyerName,
      total: listing.price,
      status: 'pending',
      email,
      shippingAddress: address,
      paymentMethod,
    })),
  )

  await AppState.updateOne({ ownerId: req.session.id }, { $pull: { cartIds: { $in: listingIds ?? [] } } })

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
      address,
      paymentMethod,
      emailSent,
      orderIds: createdOrders.map((order) => order.id),
    },
  })
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
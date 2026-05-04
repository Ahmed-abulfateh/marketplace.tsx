import mongoose from 'mongoose'

const moderationNoteSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    note: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: false },
)

const listingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    seller: { type: String, required: true },
    price: { type: Number, required: true },
    meta: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    trust: { type: String, required: true },
    shipping: { type: String, required: true },
    reviewScore: { type: Number, required: true },
    inventory: { type: Number, required: true },
    status: { type: String, enum: ['live', 'review', 'paused'], required: true },
    moderationNotes: { type: [moderationNoteSchema], default: [] },
  },
  { timestamps: true },
)

export default mongoose.model('Listing', listingSchema)
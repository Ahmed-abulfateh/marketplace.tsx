import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    listingId: { type: String, required: true },
    buyer: { type: String, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered'],
      required: true,
    },
    email: { type: String, default: '' },
    shippingAddress: { type: String, default: '' },
    paymentMethod: { type: String, default: '' },
  },
  { timestamps: true },
)

export default mongoose.model('Order', orderSchema)
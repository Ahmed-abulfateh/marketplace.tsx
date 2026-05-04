import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'seller', 'admin'], required: true },
    accountStatus: { type: String, enum: ['pending', 'active'], default: 'active' },
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
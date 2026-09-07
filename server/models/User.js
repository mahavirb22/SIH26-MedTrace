import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['patient', 'pharmacist', 'manufacturer', 'admin'],
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
    },
    manufacturerId: { type: String, default: null },
  },
  { timestamps: true }
);

// Don't return passwordHash in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;

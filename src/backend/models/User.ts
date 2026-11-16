/**
 * User Mongoose Model
 * Multi-role user model supporting Customer, Vendor, Admin, Super Admin.
 */

import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUserDocument, UserRole } from '@/backend/types';


// Mongoose instance methods (comparePassword, hasRole, save) are attached via schema.methods

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address.'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required.'],
    },
    role: {
      type: String,
      enum: ['customer', 'vendor', 'admin', 'super_admin'],
      default: 'customer',
    },
    avatar: {
      type: String,
      default: '',
    },
    addresses: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        phone: { type: String, required: true },
        alternatePhone: { type: String },
        pincode: { type: String, required: true },
        locality: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        landmark: { type: String },
        type: { type: String, enum: ['home', 'work'], default: 'home' },
        isDefault: { type: Boolean, default: false },
      },
    ],
    defaultAddressId: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpiresAt: { type: Date },
    emailVerificationToken: { type: String },
    emailVerificationExpiresAt: { type: Date },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    vendorApplicationStatus: { type: String, default: 'Draft' },
    isVendorApproved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        return ret;
      },
    },
  },
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

/**
 * Instance method: compare password with stored hash.
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Instance method: check if user has a specific role or higher.
 */
userSchema.methods.hasRole = function (minRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    customer: 1,
    vendor: 2,
    admin: 3,
    super_admin: 4,
  };
  return (hierarchy[this.role as UserRole] || 0) >= (hierarchy[minRole] || 0);
};

/**
 * Static method: find by email.
 */
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).exec();
};

/**
 * Static method: find by phone.
 */
userSchema.statics.findByPhone = function (phone: string) {
  return this.findOne({ phone }).exec();
};

const UserModel: Model<IUserDocument> =
  (mongoose.models.User as Model<IUserDocument> | undefined) ||
  mongoose.model<IUserDocument>('User', userSchema);

export default UserModel;
export { UserModel };

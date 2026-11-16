/**
 * Seed Data Script
 * Populates the database with sample records for development and testing.
 * Run with: node src/backend/scripts/seed.ts
 * Or via: npm run seed (after adding to package.json scripts)
 */

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '@/backend/config/db';
import { UserModel } from '@/backend/models';
import { AddressModel } from '@/backend/models';
import { CategoryModel } from '@/backend/models';
import { BrandModel } from '@/backend/models';
import { ProductModel } from '@/backend/models';
import { CouponModel } from '@/backend/models';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password for seed data.
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Seed all collections with sample data.
 */
export async function seedDatabase(): Promise<void> {
  await connectDB();

  try {
    // Clear existing data (development only)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot seed database in production environment.');
    }

    await mongoose.connection.dropDatabase();
    console.log('[Seed] Existing data cleared.');

    // 1. Create Users
    const customerPassword = await hashPassword('Customer@123');
    const vendorPassword = await hashPassword('Vendor@123');
    const adminPassword = await hashPassword('Admin@123');

    const customer = await UserModel.create({
      name: 'Aarav Mehta',
      email: 'aarav.mehta@example.com',
      phone: '9876543210',
      passwordHash: customerPassword,
      role: 'customer',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
    });

    const vendor = await UserModel.create({
      name: 'Rahul Sharma',
      email: 'rahul.sharma@electrohub.in',
      phone: '9876543211',
      passwordHash: vendorPassword,
      role: 'vendor',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
    });

    const admin = await UserModel.create({
      name: 'Admin Superuser',
      email: 'admin@flipstore.in',
      phone: '9999988888',
      passwordHash: adminPassword,
      role: 'admin',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
    });

    console.log('[Seed] Users created:', customer.id, vendor.id, admin.id);

    // 2. Create Addresses
    const address1 = await AddressModel.create({
      userId: customer._id,
      name: 'Aarav Mehta',
      phone: '9876543210',
      pincode: '560034',
      locality: 'Koramangala 4th Block',
      street: 'Flat 402, Green Glen Apartments, 17th Main Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      landmark: 'Near Sony World Signal',
      type: 'home',
      isDefault: true,
    });

    const address2 = await AddressModel.create({
      userId: vendor._id,
      name: 'Rahul Sharma',
      phone: '9876543211',
      pincode: '560034',
      locality: 'Koramangala 4th Block',
      street: 'Flat 402, Green Glen Apartments, 17th Main Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      type: 'business',
      isDefault: true,
    });

    console.log('[Seed] Addresses created:', address1.id, address2.id);

    // 3. Create Categories
    const electronics = await CategoryModel.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      isFeatured: true,
      isActive: true,
    });

    const fashion = await CategoryModel.create({
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Clothing and fashion accessories',
      isFeatured: true,
      isActive: true,
    });

    const home = await CategoryModel.create({
      name: 'Home & Kitchen',
      slug: 'home-kitchen',
      description: 'Home appliances and kitchen essentials',
      isFeatured: false,
      isActive: true,
    });

    console.log('[Seed] Categories created:', electronics.id, fashion.id, home.id);

    // 4. Create Brands
    const samsung = await BrandModel.create({
      name: 'Samsung',
      slug: 'samsung',
      description: 'South Korean electronics manufacturer',
      isPopular: true,
      isActive: true,
    });

    const oneplus = await BrandModel.create({
      name: 'OnePlus',
      slug: 'oneplus',
      description: 'Smartphone manufacturer',
      isPopular: true,
      isActive: true,
    });

    console.log('[Seed] Brands created:', samsung.id, oneplus.id);

    // 5. Create Products (vendor-owned)
    const product1 = await ProductModel.create({
      sellerId: vendor._id,
      name: 'Samsung Galaxy S24 5G 256GB',
      slug: 'samsung-galaxy-s24-5g-256gb',
      sku: 'ELE-SAM-S24-256',
      barcode: '8901234567890',
      category: 'Electronics',
      categoryId: electronics._id,
      subcategory: 'Smartphones',
      brand: 'Samsung',
      brandId: samsung._id,
      description: 'Latest flagship smartphone with 6.2" Dynamic AMOLED display',
      shortDescription: 'Flagship 5G smartphone',
      highlights: ['6.2" AMOLED Display', 'Snapdragon 8 Gen 3', '50MP Camera'],
      specifications: {
        display: '6.2 inch Dynamic AMOLED 2X',
        processor: 'Snapdragon 8 Gen 3',
        ram: '8 GB',
        storage: '256 GB',
      },
      price: 74999,
      mrp: 79999,
      discountPercentage: 6,
      taxPercentage: 18,
      stock: 34,
      lowStockThreshold: 10,
      status: 'PUBLISHED',
      images: [
        {
          id: 'img-1',
          url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
          alt: 'Samsung Galaxy S24 front',
          isPrimary: true,
        },
      ],
      variants: [
        {
          id: 'var-1',
          sku: 'ELE-SAM-S24-256-BLK',
          color: 'Onyx Black',
          price: 74999,
          mrp: 79999,
          stock: 15,
        },
      ],
      seoTitle: 'Samsung Galaxy S24 5G 256GB - Best Price in India',
      seoDescription: 'Buy Samsung Galaxy S24 5G 256GB online at best price.',
      unitsSold: 142,
      totalRevenue: 10649858,
      rating: 4.5,
      reviewCount: 128,
      isAssured: true,
      isFreeDelivery: true,
      estimatedDeliveryDays: 2,
    });

    console.log('[Seed] Products created:', product1.id);

    // 6. Create Coupons
    await CouponModel.create({
      sellerId: vendor._id,
      code: 'ELEC10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderValue: 5000,
      maxDiscount: 2000,
      startDate: new Date('2026-10-01'),
      expiryDate: new Date('2026-12-31'),
      usageLimit: 500,
      usedCount: 142,
      status: 'ACTIVE',
    });

    console.log('[Seed] Coupons created.');

    console.log('[Seed] Database seeded successfully!');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    throw error;
  } finally {
    await disconnectDB();
  }
}

// Run if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[Seed] Process completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Seed] Process failed:', error);
      process.exit(1);
    });
}

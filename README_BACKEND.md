# FlipStore India - Backend Documentation (Part 1)

## Overview

This document describes the backend architecture for the FlipStore India multi-vendor e-commerce platform. The backend is built as part of the existing Next.js App Router project and follows REST API principles.

> **Status: Part 1 Complete** — Foundation layer only. Business modules (products, orders, etc.) will be added in Part 2.

---

## 1. Backend Folder Structure

All backend code lives under `src/backend/`, keeping it separate from frontend code while sharing TypeScript types and path aliases.

```
src/
├── backend/
│   ├── config/
│   │   ├── db.ts          # MongoDB connection with connection caching
│   │   └── env.ts         # Lazy environment variable validation
│   ├── constants/
│   │   └── index.ts       # HTTP status codes, response messages, user roles
│   ├── controllers/
│   │   └── authController.ts  # Auth route handlers (register, login, logout, etc.)
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication middleware (withAuth, withOptionalAuth)
│   │   ├── connectDb.ts       # Database connection middleware wrapper
│   │   ├── errorHandler.ts    # Centralized error handling (AppError, errorHandler)
│   │   ├── rbac.ts            # Role-based access control (withRole, withRoles)
│   │   └── validate.ts        # Request validation (validateBody, validateParams)
│   ├── models/
│   │   ├── index.ts           # Central model exports
│   │   └── User.ts            # Mongoose User model (multi-role)
│   ├── services/
│   │   └── authService.ts     # Auth business logic (register, login, password reset)
│   ├── types/
│   │   └── index.ts           # Backend TypeScript interfaces
│   ├── utils/
│   │   ├── asyncHandler.ts    # Async route wrapper
│   │   ├── jwt.ts             # JWT sign/verify utilities
│   │   ├── password.ts        # bcrypt hash/compare + strength validation
│   │   └── response.ts        # API response envelope helpers
│   └── validations/
│       ├── auth.schema.ts     # Zod schemas for auth (register, login, etc.)
│       └── common.schema.ts   # Common schemas (pagination, ObjectId)
├── app/
│   └── api/v1/
│       └── auth/
│           ├── register/
│           │   └── route.ts           # POST /api/v1/auth/register
│           ├── vendor/
│           │   └── register/
│           │       └── route.ts       # POST /api/v1/auth/vendor/register
│           ├── login/
│           │   └── route.ts           # POST /api/v1/auth/login
│           ├── logout/
│           │   └── route.ts           # POST /api/v1/auth/logout
│           ├── me/
│           │   └── route.ts           # GET /api/v1/auth/me
│           ├── forgot-password/
│           │   └── route.ts           # POST /api/v1/auth/forgot-password
│           ├── reset-password/
│           │   └── route.ts           # POST /api/v1/auth/reset-password
│           └── change-password/
│               └── route.ts           # POST /api/v1/auth/change-password
├── types/
│   └── index.ts               # Shared frontend/backend types
├── lib/
│   └── utils.ts               # Shared utilities
└── store/
    └── useAuthStore.ts        # Frontend auth state (Zustand)
```

---

## 2. Environment Configuration

### .env.example

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/flipstore?retryWrites=true&w=majority` |
| `JWT_SECRET` | Access token signing secret (min 16 chars) | `your_access_secret_here` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (min 16 chars) | `your_refresh_secret_here` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `MONGODB_DB_NAME` | `flipstore` | Database name |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token expiry |
| `CLOUDINARY_CLOUD_NAME` | `` | Cloudinary cloud name (for image uploads) |
| `CLOUDINARY_API_KEY` | `` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `` | Cloudinary API secret |
| `BCRYPT_SALT_ROUNDS` | `12` | bcrypt cost factor |
| `COOKIE_SAME_SITE` | `lax` | Cookie same-site policy |
| `COOKIE_SECURE` | `false` | Cookie secure flag (set `true` in production) |
| `COOKIE_DOMAIN` | `` | Cookie domain |

> ⚠️ `.env.local` is already in `.gitignore` and must never be committed.

---

## 3. Database Connection

### MongoDB Utility (`src/backend/config/db.ts`)

- Uses Mongoose with **connection caching** via a global variable to prevent excessive connections during Next.js hot reload.
- `connectDB()` returns the existing connection if already established, otherwise creates a new one.
- Connection options include `serverSelectionTimeoutMS`, `socketTimeoutMS`, `maxPoolSize`, and `retryWrites`.
- Database name is configurable via `MONGODB_DB_NAME` (default: `flipstore`).

### Usage in API Routes

```typescript
import { withDatabase } from '@/backend/middleware/connectDb';

export const GET = withDatabase(async (req) => {
  // MongoDB is connected before this handler runs
  return NextResponse.json({ success: true });
});
```

---

## 4. API Response Format

All API responses follow a consistent envelope structure:

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasMore?: boolean;
  };
  timestamp: string;
  requestId?: string;
}
```

### Example Success Response

```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "user": { "id": "...", "name": "...", "email": "..." },
    "tokens": { "accessToken": "...", "refreshToken": "..." }
  },
  "timestamp": "2026-11-13T04:42:00.000Z"
}
```

### Example Error Response

```json
{
  "success": false,
  "message": "An account with this email already exists.",
  "error": {
    "code": "ACCOUNT_EXISTS"
  },
  "timestamp": "2026-11-13T04:42:00.000Z"
}
```

### Helper Functions

- `createSuccessResponse(data, options?)` — Create a success response
- `createPaginatedResponse(data, meta, options?)` — Create a paginated response
- `createErrorResponse(message, options?)` — Create an error response
- `ResponseMessages` — Predefined message constants

---

## 5. Authentication & Security

### Password Hashing (`src/backend/utils/password.ts`)

- Uses **bcryptjs** with configurable salt rounds (default: 12)
- `hashPassword(password)` — Hash a plain-text password
- `comparePassword(plain, hash)` — Compare password against hash
- `validatePasswordStrength(password)` — Validate: 8+ chars, upper, lower, digit, special

### JWT Tokens (`src/backend/utils/jwt.ts`)

- Access tokens: short-lived (default 15 min)
- Refresh tokens: longer-lived (default 7 days)
- Tokens include `issuer` and `audience` claims
- `signAccessToken(payload)`, `signRefreshToken(payload)`
- `verifyAccessToken(token)`, `verifyRefreshToken(token)`
- Tokens are stored in **HTTP-only cookies** (`access_token`, `refresh_token`)

### Authentication Middleware (`src/backend/middleware/auth.ts`)

- `withAuth(handler)` — Requires valid JWT; attaches `req.user`
- `withOptionalAuth(handler)` — Optional auth; attaches `req.user` if available
- Token extracted from `Authorization: Bearer <token>` header or `access_token` cookie

### Role-Based Access Control (`src/backend/middleware/rbac.ts`)

Four user roles with hierarchy:

| Role | Level | Description |
|------|-------|-------------|
| `customer` | 1 | Browse products, place orders, manage profile |
| `vendor` | 2 | Manage store, products, inventory, orders, earnings |
| `admin` | 3 | Manage vendors, products, orders, coupons, platform |
| `super_admin` | 4 | Full platform access |

Middleware:
- `withRole(minRole)` — Require role at or above level
- `withRoles(allowedRoles)` — Require specific role(s)
- `canAccessResource(requesterRole, requesterId, resourceOwnerId)` — Resource ownership check

---

## 6. API Routes (`/api/v1/`)

### Authentication Endpoints

| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register customer account | No |
| `POST` | `/api/v1/auth/vendor/register` | Register vendor account | No |
| `POST` | `/api/v1/auth/login` | Login & get tokens | No |
| `POST` | `/api/v1/auth/logout` | Logout & clear cookies | No |
| `GET` | `/api/v1/auth/me` | Get current user profile | Yes |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset | No |
| `POST` | `/api/v1/auth/reset-password` | Reset password with token | No |
| `POST` | `/api/v1/auth/change-password` | Change password | Yes |

### Request Validation

All request bodies are validated using **Zod** schemas. Validation errors return `422 Unprocessable Entity` with field-level error details.

### Error Handling

All errors are caught by `errorHandler` middleware and returned as consistent API responses:
- `AppError` — Custom application errors with status code and code
- JWT errors — `401 Unauthorized` with appropriate code
- Mongoose errors — Duplicate key (`409`), validation (`422`), cast (`400`)
- Zod errors — `422 Unprocessable Entity` with field details
- Unknown errors — `500 Internal Server Error`

---

## 7. User Roles & Authorization

### Role Hierarchy

```
customer (1) → vendor (2) → admin (3) → super_admin (4)
```

Higher roles inherit all permissions of lower roles.

### Role-Based Route Access

| Route Pattern | Min Role |
|---------------|----------|
| `/api/v1/auth/*` | customer |
| `/api/v1/vendor/*` | vendor |
| `/api/v1/admin/*` | admin |
| `/api/v1/super-admin/*` | super_admin |

---

## 8. Database Models

### User Model (`src/backend/models/User.ts`)

Multi-role model supporting all four user types. Fields:

- `name`, `email` (unique), `phone`, `passwordHash`
- `role`: `customer` \| `vendor` \| `admin` \| `super_admin`
- `avatar`, `addresses[]`, `defaultAddressId`
- `isEmailVerified`, `isPhoneVerified`, `isActive`
- `lastLoginAt`, `passwordResetToken`, `passwordResetExpiresAt`
- `emailVerificationToken`, `emailVerificationExpiresAt`
- `timestamps` (createdAt, updatedAt)

Instance methods:
- `comparePassword(password)` — Compare password with hash
- `hasRole(minRole)` — Check role level

Static methods:
- `findByEmail(email)` — Find user by email
- `findByPhone(phone)` — Find user by phone

Indexes: `email` (unique), `phone`, `role`, `isActive`

---

## 9. How to Start

### Prerequisites

- Node.js 18+
- MongoDB database (local or MongoDB Atlas)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
```

### Development

```bash
npm run dev
```

Starts the Next.js development server at `http://localhost:3000`.

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Linting

```bash
npm run lint
```

---

## 10. Testing API Endpoints

### Register a Customer

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "Password123!"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "john@example.com",
    "password": "Password123!"
  }'
```

### Get Profile (with auth)

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

---

## 11. Security Notes

- ❌ **No plain-text passwords** — All passwords are hashed with bcrypt
- ✅ **HTTP-only cookies** — Tokens stored in HTTP-only cookies to prevent XSS
- ✅ **Input validation** — All inputs validated with Zod schemas
- ✅ **Role-based access** — Route-level and resource-level authorization
- ✅ **Consistent error handling** — No stack traces leaked to client
- ⚠️ **Frontend auth still uses localStorage** — Existing frontend auth (`src/services/authService.ts`) is frontend-only mock. Backend auth is ready for integration but not yet connected to frontend.

---

## 12. Future Integration Points

The following frontend services are currently mock-only and can be replaced with backend API calls:

| Frontend Service | Backend Endpoint |
|------------------|------------------|
| `authService.loginWithPassword` | `POST /api/v1/auth/login` |
| `authService.register` | `POST /api/v1/auth/register` |
| `authService.logout` | `POST /api/v1/auth/logout` |
| `authService.getCurrentUser` | `GET /api/v1/auth/me` |
| `authService.sendPasswordReset` | `POST /api/v1/auth/forgot-password` |
| `authService.resetPassword` | `POST /api/v1/auth/reset-password` |

Seller-specific services (`sellerAuthService`, `sellerDashboardService`, etc.) can similarly be backed by `/api/v1/vendor/*` and `/api/v1/seller/*` routes in Part 2.

---

## 13. Project Integrity

- ✅ Existing frontend code is **unchanged**
- ✅ All existing customer shopping routes continue to work
- ✅ All existing seller dashboard routes continue to work
- ✅ Backend is additive — new files only, no modifications to existing frontend files
- ✅ TypeScript build passes
- ✅ Production build passes
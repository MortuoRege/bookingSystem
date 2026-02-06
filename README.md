Appointment Management System
A secure, full-stack appointment booking application built with Next.js 14+, featuring role-based access control, JWT authentication, and comprehensive security measures.<br>

**working on the project:**<br>
**MortuoRege** Beka Buachidze <br>
**ereklesigua** Sigu <br>
**xBrROxx** Ibrahim Jabour <br>

**Table of Contents:**

Features
Security Features<br>
Technology Stack<br>
Getting Started<br>
Project Structure<br>
Authentication & Authorization<br>
API Routes<br>
Environment Variables<br>
Database Schema<br>
Security Best Practices<br>
Contributing<br>
License<br>

**Features**<br>
Core Functionality<br>

Multi-Role System: Support for Admin, Staff, and User roles with distinct dashboards<br>
Appointment Booking: Seamless scheduling system with availability management<br>
Staff Management: Complete CRUD operations for staff profiles and schedules<br>
User Management: Admin control over user accounts and permissions<br>
Real-time Availability: Dynamic scheduling based on staff availability<br>

**User Roles**<br>
User/Customer<br>

Browse available healthcare providers<br>
Book appointments with preferred staff<br>
View and manage personal appointments<br>
Cancel/reschedule appointments<br>

**Staff/Provider**<br>

Manage professional profile (bio, specialty, title)<br>
Set weekly availability schedules<br>
View and manage assigned appointments<br>
Update appointment statuses<br>

**Admin**<br>

Complete user management (create, update, delete)<br>
Staff oversight and management<br>
View all appointments across the system<br>
Access to system-wide statistics and analytics<br>

**Security Features**<br>
This application implements enterprise-grade security measures:<br>
JWT Authentication<br>

Secure Token Generation: Uses jose library for JWT creation and verification<br>
HttpOnly Cookies: Tokens stored in httpOnly cookies to prevent XSS attacks<br>
Token Expiration: 7-day token lifetime with automatic expiration<br>
Issuer/Audience Verification: Additional JWT claims validation<br>
Algorithm: HS256 signing algorithm<br>

**Route Protection**<br>

Middleware-Based Authentication: Next.js middleware validates all protected routes<br>
Role-Based Access Control (RBAC): Automatic redirection based on user roles<br>
Public Route Whitelist: Defined public routes (login, register, homepage)<br>
Invalid Token Handling: Automatic logout and redirect on token verification failure<br>

**Password Security**<br>

BCrypt Hashing: Industry-standard password hashing with bcryptjs<br>
Salt Rounds: Automatic salting for password protection<br>
No Plain-text Storage: Passwords never stored in plain text<br>

**HTTP Security Headers**<br>

X-Frame-Options: DENY (prevents clickjacking)<br>
X-Content-Type-Options: nosniff (prevents MIME sniffing)<br>
X-XSS-Protection: Enabled with blocking mode<br>
Content Security Policy (CSP): Strict policy preventing XSS attacks<br>
Strict-Transport-Security (HSTS): Forces HTTPS in production<br>
Referrer-Policy: Strict origin policy<br>
Permissions-Policy: Disables unnecessary browser features<br>

**Additional Security Measures**<br>

Rate Limiting: Login attempt throttling (5 attempts per 15 minutes)<br>
Email Validation: Server-side email format validation<br>
Input Sanitization: All user inputs validated and sanitized<br>
Database Parameterization: Prisma ORM prevents SQL injection<br>
Secure Cookie Configuration:<br>

httpOnly: true - Prevents JavaScript access<br>
secure: true (production) - HTTPS-only transmission<br>
sameSite: 'strict' - CSRF protection<br>
maxAge: 7 days - Automatic expiration<br>



**Environment-Based Security**<br>

Production vs Development: Different CSP rules for development convenience<br>
Automatic HTTPS Enforcement: HSTS enabled only in production<br>
Environment Variable Protection: Sensitive keys stored in environment variables<br>

Technology Stack<br>
**Frontend**<br>

Framework: Next.js 14+ (App Router)<br>
UI: React 18+ with JSX<br>
Styling: CSS Modules<br>
State Management: React Hooks<br>

**Backend**<br>

Runtime: Node.js<br>
API: Next.js API Routes (serverless functions)<br>
Authentication: JWT with jose library<br>
Password Hashing: bcryptjs<br>

**Database**<br>

Database: PostgreSQL<br>
ORM: Prisma<br>
Schema Management: Prisma Schema<br>
Type Safety: Prisma Client with TypeScript support<br>

**Security**<br>

JWT Tokens: jose (ES6-compatible JWT library)<br>
Password Hashing: bcryptjs<br>
Security Headers: Custom middleware implementation<br>
Rate Limiting: In-memory rate limiting<br>

**Getting Started**<br>
Prerequisites<br>

Node.js 18+ installed<br>
PostgreSQL database<br>
npm or yarn package manager<br>

Installation<br>

**Clone the repository**<br>

``` bash
git clone https://github.com/yourusername/appointment-system.git
cd appointment-system
```

**Install dependencies**<br>

``` bash
npm install
# or
yarn install
```

**Set up environment variables**<br>

``` env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/appointment_db"
POSTGRES_URL="your_postgres_connection_string"

# JWT Secret (generate a strong random string)
JWT_SECRET="your-super-secure-jwt-secret-key-minimum-32-characters"

# Environment
NODE_ENV="development"
```

**Set up the database**<br>

``` bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```
**Run the development server**<br>

``` bash
npm run dev
# or
yarn dev
```

**Open your browser**<br>

Navigate to http://localhost:3000<br>
Default Admin Account<br>
After seeding, you can log in with:<br>

Email: admin@example.com<br>
Password: (check your seed file or create manually)<br>

**project structure:**<br>
```
app/
├── api/                          # API routes
│   ├── auth/                     # Authentication endpoints
│   │   ├── login/               # Login route
│   │   ├── register/            # Registration route
│   │   └── logout/              # Logout route
│   ├── admin/                   # Admin-only endpoints
│   ├── staff/                   # Staff-only endpoints
│   ├── appointments/            # Appointment management
│   ├── providers/               # Provider/staff listings
│   └── me/                      # Current user info
├── components/                   # Reusable React components
│   ├── admin/                   # Admin dashboard components
│   ├── staff/                   # Staff dashboard components
│   └── user/                    # User dashboard components
├── lib/                         # Utility functions and configurations
│   ├── auth.js                  # JWT authentication logic
│   ├── auth-api.js              # Auth API helpers (rate limiting, validation)
│   ├── security-headers.js      # Security headers configuration
│   ├── api-client.js            # API client utilities
│   └── logout.js                # Logout utilities
├── prisma/                      # Database configuration
│   └── schema.prisma            # Database schema
├── admin/                       # Admin pages
├── staff/                       # Staff pages
├── user/                        # User pages
├── appointments/                # Appointment pages
├── providers/                   # Provider listing/booking pages
├── login/                       # Login page
├── register/                    # Registration page
├── middleware.js                # Route protection middleware
└── layout.jsx                   # Root layout component
```

**Authentication & Authorization**<br>
How It Works<br>

User Login<br>

User submits credentials to /api/auth/login<br>
Server validates credentials against database<br>
Password compared using bcrypt<br>
JWT token generated and stored in httpOnly cookie<br>
User redirected to role-specific dashboard<br>


Route Protection<br>

Middleware intercepts all requests<br>
Validates JWT token from cookie<br>
Verifies user role matches route requirements<br>
Redirects unauthorized users<br>


Role-Based Access<br>

Admin Routes: /admin/*, /users/*<br>
Staff Routes: /staff/*, /staff-*, /availability<br>
User Routes: /user/*, /my-appointments, /appointments/*, /providers/*<br>



Secure Cookie Configuration<br>

``` javascript
{
  httpOnly: true,           // Prevents JavaScript access
  secure: true,             // HTTPS-only (production)
  sameSite: 'strict',       // CSRF protection
  path: '/',                // Available site-wide
  maxAge: 60 * 60 * 24 * 7  // 7 days
}
```
API Routes<br>
Authentication<br>

POST /api/auth/login - User login<br>
POST /api/auth/register - New user registration<br>
POST /api/auth/logout - User logout<br>

User Management (Admin Only)<br>

GET /api/admin/users - List all users<br>
PUT /api/admin/users/[id] - Update user<br>
DELETE /api/admin/users/[id] - Delete user<br>

Staff Management<br>

GET /api/admin/staff - List all staff (Admin)<br>
POST /api/admin/staff - Create staff member (Admin)<br>
GET /api/staff/profile - Get staff profile (Staff)<br>
PUT /api/staff/profile - Update staff profile (Staff)<br>
GET /api/staff/availability - Get availability (Staff)<br>
PUT /api/staff/availability - Update availability (Staff)<br>

Appointments<br>

GET /api/appointments - List appointments<br>
POST /api/appointments - Create appointment<br>
PUT /api/appointments/[id] - Update appointment<br>
DELETE /api/appointments/[id] - Cancel appointment<br>
GET /api/staff/appointments - Staff appointments (Staff)<br>
GET /api/admin/appointments - All appointments (Admin)<br>

Providers<br>

GET /api/providers - List all providers<br>
GET /api/providers/[id] - Get provider details<br>

Current User<br>

GET /api/me - Get current user info<br>

Database Schema<br>

User table<br>
``` prisma
model users {
  id            BigInt      @id @default(autoincrement())
  email         String      @unique
  full_name     String
  role          String      @default("user")
  password_hash String
  created_at    DateTime    @default(now())
  appointments  appointments[]
  staff         staff?
}
```
Staff Table<br>
``` prisma
model staff {
  user_id   BigInt   @id
  specialty String
  title     String?
  bio       String?
  // Weekly availability (mon_start, mon_end, tue_start, etc.)
  users     users    @relation(fields: [user_id], references: [id])
}
```
Appointments Table<br>
```prisma
model appointments {
  id          BigInt   @id @default(autoincrement())
  customer_id BigInt
  staff_id    BigInt
  starts_at   DateTime
  ends_at     DateTime
  status      String   @default("pending")
  created_at  DateTime @default(now())
  customer    users    @relation("customer", ...)
  staff       users    @relation("staff", ...)
}
```


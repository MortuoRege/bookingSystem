Booking System
A professional appointment booking system with role-based access control (Admin, Staff, User).
Features

Admin Panel: Manage users, staff, and appointments
Staff Portal: Manage availability and appointments
User Portal: Browse providers and book appointments
Calendar Integration: Full month view for bookings
Secure Authentication: JWT-based auth with httpOnly cookies

Prerequisites

Node.js 18+
PostgreSQL database
npm or yarn

Environment Setup

Create a .env file in the root directory:

``` env
# Database
POSTGRES_URL="postgresql://username:password@localhost:5432/booking_system"

# JWT Secret (generate a random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Node Environment
NODE_ENV="development"
```
Installation

Install dependencies:

``` bash
npm install
```

Start the development server (automatically sets up database):

``` bash
npm run dev
```
This will:

Push the database schema to PostgreSQL
Seed the database with sample data
Start the Next.js development server on http://localhost:3000


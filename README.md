# Gym Management System

A comprehensive web application for managing gym members, billing, and administration.

## Features
- **Admin Dashboard**: Manage members, create bills, view payment history.
- **Member Dashboard**: View profile, membership status, pay bills, and download receipts.
- **Billing System**: Automated billing for Monthly, Quarterly, and Yearly plans.
- **PDF Receipts**: Instant generation of payment receipts using `jspdf`.
- **Authentication**: secure login for Admins and Members via Supabase.

## Tech Stack
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Build Tool**: Vite
- **Routing**: Navigo
- **Backend**: Supabase (PostgreSQL, Auth)
- **PDF Generation**: jsPDF

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd gym_ms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## Usage

### Admin Access
- **Signup URL**: `/signup/admin`
- **Special Key**: `2004` (Required to register as an Admin)
- **Capabilities**: Add members, generate bills manually, view all revenue, manage user profiles.

### Member Access
- **Signup URL**: `/signup/member`
- **Dashboard**: View active plan, pay functionality, download history.

## Database Structure

The system uses Supabase (PostgreSQL) with the following core tables:
- `auth.users`: Managed by Supabase Auth.
- `public.profiles`: Stores roles (admin/member).
- `public.gym_members`: Detailed member info (Age, Weight, Package, etc.).
- `public.gym_bills`: Transaction history, linked to members.
- `public.notifications`: System alerts for users.

## Project Structure
```
gym_ms/
├── src/
│   ├── lib/          # Database & Auth helpers (supabase.js, db.js)
│   ├── pages/        # Views for Admin and Member
│   │   ├── admin/    # Admin-specific pages (Dashboard, Bills, Members)
│   │   └── member/   # Member-specific pages (Dashboard)
│   ├── main.js       # App entry point & Routing
│   └── style.css     # Global styles
├── public/           # Static assets
└── index.html        # Main HTML file
```
## special key
 2004

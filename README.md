# E-Ticket Check-in System

A simple internal system for generating and scanning event tickets with QR code validation, built with Next.js and Supabase.

## 🚀 Features

- **Authentication**: Supabase email/password authentication with role-based access
- **Admin Dashboard**: 
  - Create tickets with auto-generated QR codes
  - View all tickets with status tracking
  - Export QR codes as images or URLs
- **Staff Scanner**: 
  - Real-time QR code scanning using device camera
  - Instant ticket validation
  - Visual feedback for valid/invalid/already used tickets
- **Ticket Validation**: 
  - Unique UUID-based tickets
  - Status tracking (unused/used)
  - Check-in timestamp recording

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Backend**: Next.js API Routes + Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: TailwindCSS
- **QR Code**: qrcode (generation), html5-qrcode (scanning)

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- npm or yarn package manager

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the following schema:

```sql
-- Create profiles table
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('admin', 'staff')),
  created_at timestamp default now()
);

-- Create tickets table
create table tickets (
  id bigint primary key generated always as identity,
  ticket_id uuid unique not null,
  name text not null,
  status text check (status in ('unused', 'used')) default 'unused',
  created_at timestamp default now(),
  checked_in_at timestamp
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table tickets enable row level security;

-- Profiles policies
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Tickets policies (authenticated users can read all tickets)
create policy "Authenticated users can read tickets"
  on tickets for select
  using (auth.role() = 'authenticated');

create policy "Admin users can insert tickets"
  on tickets for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Authenticated users can update tickets"
  on tickets for update
  using (auth.role() = 'authenticated');
```

3. Create test users:

**Admin User:**
```sql
-- After creating the user in Supabase Auth Dashboard
insert into profiles (id, role)
values ('USER_UUID_FROM_AUTH', 'admin');
```

**Staff User:**
```sql
-- After creating the user in Supabase Auth Dashboard
insert into profiles (id, role)
values ('USER_UUID_FROM_AUTH', 'staff');
```

Or create users via the Supabase Dashboard:
- Go to Authentication → Users → Add User
- Create users with emails: `admin@example.com` and `staff@example.com`
- After creation, add their roles to the `profiles` table using the SQL above

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get your Supabase credentials from:
- Project Settings → API → Project URL
- Project Settings → API → Project API keys (anon/public key)

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Admin Access
1. Login with admin credentials
2. Create new tickets by entering guest names
3. View generated QR codes and URLs
4. Monitor all tickets and their status

### Staff Access
1. Login with staff credentials
2. Click "Start Scanning"
3. Scan QR codes with device camera
4. View validation results:
   - ✅ Green = Valid ticket (first scan)
   - ⚠️ Yellow = Already checked in
   - ❌ Red = Invalid ticket

## 📱 Routes

- `/` - Redirects to login
- `/login` - Authentication page
- `/admin` - Admin dashboard (admin only)
- `/scanner` - QR scanner (staff + admin)
- `/validate/[ticket_id]` - Ticket information page

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Role-based route protection via middleware
- Server-side validation for all ticket operations
- Secure session management with Supabase Auth

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel domain)
4. Deploy!

### Update QR Codes
After deployment, update `NEXT_PUBLIC_APP_URL` to your production domain and regenerate tickets if needed.

## 📝 Database Schema

### profiles
- `id` (uuid, PK) - References auth.users
- `role` (text) - 'admin' or 'staff'
- `created_at` (timestamp)

### tickets
- `id` (bigint, PK, auto-increment)
- `ticket_id` (uuid, unique) - Auto-generated
- `name` (text) - Guest name
- `status` (text) - 'unused' or 'used'
- `created_at` (timestamp)
- `checked_in_at` (timestamp, nullable)

## 🤝 Support

For issues or questions, please check:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

## 📄 License

This is an internal tool. Modify as needed for your organization.


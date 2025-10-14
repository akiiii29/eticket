# 🚀 Quick Setup Guide

## Step-by-Step Setup (5 minutes)

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Fill in project details and wait for database to initialize (~2 min)

### 3️⃣ Setup Database

1. In your Supabase project, go to **SQL Editor**
2. Copy the entire content of `supabase-schema.sql` file
3. Paste and click **Run**
4. You should see "Success. No rows returned"

### 4️⃣ Create Test Users

1. Go to **Authentication** → **Users** → **Add User**
2. Create admin user:
   - Email: `admin@example.com`
   - Password: `admin123` (or your choice)
   - Click **Create User**
   - Copy the User UID

3. Go back to **SQL Editor** and run:
   ```sql
   insert into profiles (id, role) 
   values ('PASTE_ADMIN_USER_UID_HERE', 'admin');
   ```

4. Create staff user:
   - Email: `staff@example.com`
   - Password: `staff123` (or your choice)
   - Copy the User UID
   
5. Run in SQL Editor:
   ```sql
   insert into profiles (id, role) 
   values ('PASTE_STAFF_USER_UID_HERE', 'staff');
   ```

### 5️⃣ Configure Environment

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Get your Supabase credentials:
   - Go to **Project Settings** → **API**
   - Copy **Project URL** and **anon/public key**

3. Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 6️⃣ Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 Testing the System

### Test Admin Features
1. Login with `admin@example.com`
2. You'll be redirected to `/admin`
3. Create a ticket:
   - Enter a guest name
   - Click "Create Ticket"
   - View the generated QR code
   - Copy the QR URL

### Test Staff Scanner
1. Logout and login with `staff@example.com`
2. You'll be redirected to `/scanner`
3. Click "Start Scanning"
4. Scan the QR code you generated (or use the QR image)
5. See the validation result

### Test Ticket Page
1. Open the QR URL in browser (e.g., `http://localhost:3000/validate/xxxxx`)
2. View ticket information

## 📱 QR Code Testing Tips

If you don't have a physical device to scan:

1. **Print the QR code** from admin dashboard
2. **Save QR image** and scan with phone camera
3. **Use online QR reader** - paste the QR URL
4. **Test validation directly** - visit `/validate/[ticket_id]` in browser

## ⚠️ Troubleshooting

### "Unauthorized" or "Forbidden" errors
- Check that user exists in both `auth.users` AND `profiles` table
- Verify the role is set correctly ('admin' or 'staff')

### Camera not working
- **iOS Safari**: Requires HTTPS! Use ngrok (`npx ngrok http 3000`) or deploy to production
- Ensure HTTPS (or localhost) for camera permissions  
- Allow camera access when browser prompts
- Try a different browser (Chrome/Safari work best on desktop)

### "Failed to create ticket"
- Check RLS policies are created correctly
- Verify admin user has 'admin' role in profiles table

### Build errors
- Delete `node_modules` and `.next` folder
- Run `npm install` again
- Clear browser cache

## 🚀 Deployment to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` → your Vercel URL
5. Deploy!

After deployment, update any existing QR codes to use the new production URL.

## 📚 Next Steps

- Customize the UI colors in `tailwind.config.ts`
- Add more ticket fields (email, phone, etc.)
- Implement ticket export (CSV/PDF)
- Add analytics dashboard
- Set up email notifications
- Configure custom domain

## 🔗 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)


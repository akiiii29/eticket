# 🚀 Vercel Deployment Guide

## Quick Deploy (5 minutes)

### Step 1: Setup Git & GitHub

```bash
# Configure git (if not already done)
git config user.email "your-email@example.com"
git config user.name "Your Name"

# Commit your code
git add .
git commit -m "Initial commit: E-Ticket system"

# Create GitHub repo and push
gh repo create eticket --private --source=. --remote=origin --push
```

### Step 2: Deploy to Vercel

**Option A: Vercel CLI (Fastest)**

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? eticket
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

**Option B: Vercel Dashboard (Easiest)**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository `eticket`
4. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `next build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

5. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   ```

6. Click **Deploy**!

### Step 3: Get Your Production URL

After deployment completes:
- Your app will be live at: `https://eticket-xxxxx.vercel.app`
- Copy this URL

### Step 4: Update Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
3. Redeploy (Dashboard → Deployments → ⋯ → Redeploy)

### Step 5: Test on iPhone

1. Open Safari on your iPhone
2. Visit your Vercel URL
3. Login and go to `/scanner`
4. Camera should work now! 📸

## Updating After Changes

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push

# Vercel auto-deploys from main branch!
```

## Custom Domain (Optional)

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Redeploy

## Troubleshooting

### Build fails on Vercel
- Check build logs in Vercel Dashboard
- Ensure all environment variables are set
- Verify `.env.local` is in `.gitignore` (it should be)

### "Unauthorized" errors in production
- Double-check Supabase URL and anon key
- Ensure RLS policies are correctly set
- Check Supabase logs

### Camera still not working
- Verify you're using HTTPS (Vercel URL)
- Check browser console for errors
- Try clearing Safari cache

## Environment Variables Reference

You need these 3 environment variables in Vercel:

| Variable | Example | Where to get it |
|----------|---------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abc123.supabase.co` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase → Settings → API → anon/public key |
| `NEXT_PUBLIC_APP_URL` | `https://eticket.vercel.app` | Your Vercel deployment URL |

## Done! 🎉

Your ticket system is now live and accessible from any device with HTTPS!


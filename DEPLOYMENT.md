# ACENEXA CBT Portal - Production Deployment Guide

Complete guide for deploying the ACENEXA CBT Portal to production using Render (backend), Vercel (frontend), and Supabase (database).

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Vercel        │      │   Render        │      │   Supabase      │
│   (Frontend)    │─────▶│   (Backend)     │─────▶│   (Database)    │
│   React + Vite  │      │   Node + Express│      │   PostgreSQL    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   Paystack      │
                         │   (Payments)    │
                         └─────────────────┘
```

---

## Part 1: Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in details:
   - Name: `acenexa-cbt`
   - Database Password: (Create a strong password - save it!)
   - Region: Choose closest to your users
4. Click "Create new project" (takes 1-2 minutes)

### Step 2: Run Database Schema

1. In Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Open the file: `database/schema.sql`
4. Copy the ENTIRE contents
5. Paste into Supabase SQL Editor
6. Click "Run" (green play button)
7. Verify success: Go to "Database" → "Tables" → Should see 5 tables:
   - `subjects`
   - `users`
   - `access_tokens`
   - `questions`
   - `results`

### Step 3: Get Database Credentials

1. In Supabase dashboard, go to "Settings" → "API"
2. Copy these three values (you'll need them later):
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (keep this SECRET!)
   ```

---

## Part 2: Backend Deployment (Render)

### Step 1: Prepare Backend

1. Ensure your backend code is in the `backend/` folder
2. Verify `backend/package.json` exists
3. Verify `backend/server.js` exists

### Step 2: Deploy to Render

1. Go to [https://render.com](https://render.com)
2. Sign up / Login (can use GitHub)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   ```
   Name: acenexa-cbt-backend
   Region: Choose closest to your users
   Branch: main (or your default branch)
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```
6. Click "Advanced" → "Add Environment Variable"

### Step 3: Add Environment Variables

Add each of these in Render:

```env
PORT=5000
NODE_ENV=production

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key

FRONTEND_URL=https://your-app.vercel.app
```

**Important Notes:**
- `PORT` - Render may auto-set this, if so, skip it
- `SUPABASE_*` - Use values from Part 1, Step 3
- `PAYSTACK_SECRET_KEY` - Use **LIVE** key for production (`sk_live_...`)
- `FRONTEND_URL` - Use your Vercel URL (from Part 3)

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment (2-3 minutes)
3. Once deployed, copy your backend URL:
   ```
   https://acenexa-cbt-backend.onrender.com
   ```

### Step 5: Test Backend

Test your backend is working:
```bash
curl https://acenexa-cbt-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-10T..."
}
```

---

## Part 3: Frontend Deployment (Vercel)

### Step 1: Update Frontend Configuration

1. Open `services/config.ts`
2. Verify it uses environment variables (should already be done)
3. Create `.env.local` file:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_test_key
   ```

### Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up / Login (use GitHub)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure:
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

### Step 3: Add Environment Variables

In Vercel, go to "Settings" → "Environment Variables":

Add these variables:

```env
VITE_API_BASE_URL=https://acenexa-cbt-backend.onrender.com
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key
```

**Important:**
- `VITE_API_BASE_URL` - Your Render backend URL (from Part 2, Step 4)
- `VITE_PAYSTACK_PUBLIC_KEY` - Use **LIVE** public key (`pk_live_...`)

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment (1-2 minutes)
3. Once deployed, copy your frontend URL:
   ```
   https://your-app.vercel.app
   ```

### Step 5: Update Backend CORS

Go back to Render:
1. Go to your backend service → "Environment"
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Click "Save Changes"
4. Backend will redeploy automatically

---

## Part 4: Payment Setup (Paystack)

### Step 1: Get Live Keys

1. Go to [https://paystack.com/dashboard](https://paystack.com/dashboard)
2. Complete business verification (required for live mode)
3. Go to "Settings" → "API Keys & Webhooks"
4. Copy your LIVE keys:
   - Public Key: `pk_live_xxxxx`
   - Secret Key: `sk_live_xxxxx`

### Step 2: Update Environment Variables

Update in Render (Backend):
```env
PAYSTACK_SECRET_KEY=sk_live_your_actual_live_secret_key
```

Update in Vercel (Frontend):
```env
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_actual_live_public_key
```

Both will auto-redeploy.

---

## Part 5: Verification & Testing

### Test Checklist

1. **Database Connection**
   ```bash
   curl https://your-backend.onrender.com/health
   ```
   Should return: `"status": "ok", "database": "connected"`

2. **Frontend Loads**
   - Open: `https://your-app.vercel.app`
   - Should see login page
   - Check browser console for errors

3. **Admin Login**
   - Click lock icon (admin mode)
   - Username: `admin`
   - Password: `admin`
   - Should login successfully

4. **Test Payment**
   - Logout from admin
   - Click "Purchase Access Now"
   - Use LIVE Paystack keys
   - Make a test transaction (can use ₦100)
   - Should receive access code

5. **Student Login**
   - Use the access code from payment
   - Should prompt to bind device
   - Confirm binding
   - Should show expiry date (1 year from now)

---

## Part 6: Post-Deployment Security

### Immediate Actions

1. **Change Default Admin Password**
   - Login as admin
   - Settings → Update Profile
   - Change from default `admin/admin`

2. **Secure Environment Variables**
   - Never commit `.env` files to Git
   - Rotate secrets regularly
   - Use different keys for dev/prod

3. **Monitor Logs**
   - Render: Dashboard → Logs
   - Vercel: Deployments → View Logs
   - Supabase: Dashboard → Logs

### Recommended Settings

1. **Render (Backend)**
   - Auto-Deploy: ON (for main branch)
   - Health Check Path: `/health`
   - Instance Type: Starter (can upgrade later)

2. **Vercel (Frontend)**
   - Auto-Deploy: ON
   - Production Branch: main
   - Preview Deployments: ON (optional)

3. **Supabase**
   - Enable 2FA on your account
   - Review RLS policies regularly
   - Monitor database usage

---

## Troubleshooting

### Issue: Backend Health Check Fails

**Symptoms:** `/health` returns error or timeout

**Solutions:**
1. Check Render logs for errors
2. Verify all environment variables are set
3. Check Supabase connection string
4. Verify database tables exist

### Issue: CORS Errors in Frontend

**Symptoms:** Browser console shows CORS errors

**Solutions:**
1. Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
2. Check that both URLs use `https://`
3. Redeploy backend after changing CORS settings

### Issue: Payment Fails

**Symptoms:** Payment popup doesn't appear or fails

**Solutions:**
1. Verify Paystack keys are LIVE keys (start with `pk_live_` and `sk_live_`)
2. Check business verification is complete in Paystack
3. Test with small amount first (₦100)
4. Check Paystack dashboard for transaction logs

### Issue: Database Connection Fails

**Symptoms:** Backend logs show database errors

**Solutions:**
1. Verify Supabase URL and keys are correct
2. Check Supabase project is active (not paused)
3. Verify RLS policies allow public access where needed
4. Run schema.sql again if tables are missing

---

## Maintenance

### Regular Tasks

1. **Weekly:**
   - Check error logs in Render and Vercel
   - Review Supabase database usage
   - Monitor payment transactions

2. **Monthly:**
   - Review and respond to user feedback
   - Update dependencies if needed
   - Check for security updates

3. **Quarterly:**
   - Rotate API keys and secrets
   - Review and optimize database queries
   - Analyze usage patterns

### Scaling

When to upgrade:

1. **Render:**
   - Upgrade if response times > 1s consistently
   - Consider Standard plan for auto-scaling

2. **Supabase:**
   - Free tier: 500 MB database, 2 GB bandwidth
   - Upgrade when approaching limits

3. **Vercel:**
   - Free tier: 100 GB bandwidth/month
   - Upgrade for custom domains, more bandwidth

---

## Quick Reference

### URLs

```bash
# Production
Frontend: https://your-app.vercel.app
Backend: https://acenexa-cbt-backend.onrender.com
Database: https://xxxxx.supabase.co

# Local Development
Frontend: http://localhost:5173
Backend: http://localhost:5000
```

### Default Credentials

```
Admin Login:
  Username: admin
  Password: admin
  (CHANGE IMMEDIATELY!)
```

### Support

- Render: https://docs.render.com
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Paystack: https://paystack.com/docs

---

## Success Criteria

Your deployment is successful when:

- [ ] Backend health check returns `"status": "ok"`
- [ ] Frontend loads without console errors
- [ ] Admin can login and access admin panel
- [ ] Test payment completes successfully
- [ ] Student can login with access code
- [ ] Access code shows 1-year expiry date
- [ ] Exam simulation works correctly
- [ ] Results are saved and retrievable

---

**Congratulations!** Your ACENEXA CBT Portal is now live in production.

For questions or issues, review the logs in Render, Vercel, and Supabase dashboards.

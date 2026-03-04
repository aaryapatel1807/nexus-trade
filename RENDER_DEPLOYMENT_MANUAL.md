# Render Blueprint Deployment - Step by Step

## Prerequisites
✅ Render account created
✅ GitHub connected to Render
✅ render.yaml file configured (already done)
✅ All code committed to GitHub main branch (already done)

---

## STEP 1: Go to Render Dashboard
**URL:** https://render.com/dashboard

Click the link or open your Render account in browser.

---

## STEP 2: Start Blueprint Creation
1. Click **"New +"** button (top right)
2. Select **"Blueprint"** from the dropdown

---

## STEP 3: Select Repository
1. Look for **"aaryapatel1807/nexus-trade"** in the list
2. If not visible, search for "nexus-trade"
3. Click to select it

---

## STEP 4: Choose Branch
1. Make sure **"main"** is selected (should be default)
2. Click **"Create from Blueprint"**

---

## STEP 5: Review & Deploy
Render will show:
- PostgreSQL (database)
- Backend service (Node.js)
- Frontend service (React)

Click **"Deploy"** button at bottom right.

⏳ **Wait 5-10 minutes** while Render provisions services.

---

## STEP 6: Set API Keys (CRITICAL!)
Once Backend service is deployed:

1. Go to **Backend Service** in Render Dashboard
2. Click **"Settings"** tab
3. Scroll to **"Environment"**
4. Click **"Add Environment Variable"**

**Add these 2 variables:**

### Variable 1: GEMINI_API_KEY
- **Key:** `GEMINI_API_KEY`
- **Value:** (Get from https://aistudio.google.com/apikey)
- Copy your Google API key and paste here
- Click **"Save"**

### Variable 2: FINNHUB_API_KEY (Optional)
- **Key:** `FINNHUB_API_KEY`
- **Value:** (Get from https://finnhub.io/register if you want)
- Leave blank if you don't have one
- Click **"Save"**

⏳ **Render will restart backend service** (1-2 minutes)

---

## STEP 7: Verify Deployment

Once all services show **"Live"** status:

### Test Backend
Open in browser:
```
https://nexus-trade-backend.onrender.com/api/stocks/top
```
Should return JSON with stock data ✅

### Test Frontend
Open in browser:
```
https://nexus-trade-frontend.onrender.com
```
Should show login page ✅

### Test Full Functionality
1. Login with your credentials
2. Go to Portfolio page
3. Check stock prices display (should NOT be 50k anymore! 🎉)
4. Try creating a trade

---

## STEP 8: If Something Goes Wrong

### Check Logs
1. Go to Render Dashboard
2. Click service name (backend-service or frontend-service)
3. Click **"Logs"** tab
4. Read error messages

### Common Issues & Fixes

**❌ "GEMINI_API_KEY not provided"**
- Solution: Add the env var (Step 6)
- Restart backend service

**❌ "Connection refused to database"**
- Solution: Wait longer (database takes 2-3 min to be ready)
- Or redeploy

**❌ "Frontend showing 404"**
- Solution: Check build completed successfully
- Restart frontend service from dashboard

**❌ "Prices still showing as 50k"**
- Solution: Verify API keys are set correctly
- Check logs for API errors

---

## Your Live URLs (After Deployment)

| Service | URL |
|---------|-----|
| **Frontend** | https://nexus-trade-frontend.onrender.com |
| **Backend** | https://nexus-trade-backend.onrender.com |
| **API Health Check** | https://nexus-trade-backend.onrender.com/api/stocks/top |

---

## Expected Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Repository selection | < 1 min | ⏱️ |
| Blueprint parsing | 1-2 min | ⏳ |
| Database provisioning | 2-3 min | ⏳ |
| Backend deployment | 3-5 min | ⏳ |
| Frontend build & deploy | 3-5 min | ⏳ |
| **Total** | **5-10 min** | ✅ |

---

## Configuration Summary

What's already configured in render.yaml:

✅ PostgreSQL database (auto-created)
✅ Backend build command: `npm ci && npx prisma migrate deploy`
✅ Backend start command: `node server.js`
✅ Frontend build command: `npm ci && npm run build`
✅ Frontend output directory: `dist/`
✅ Auto HTTPS/SSL certificates
✅ Auto domain names
✅ Health checks configured
✅ Restart policy (auto-restart on crash)

---

## Next Steps After Deployment

1. ✅ Test login functionality
2. ✅ Verify stock prices display correctly
3. ✅ Test buying/selling stocks
4. ✅ Check chat AI advisor
5. ✅ Monitor logs for 24 hours
6. ✅ Share with friends!

---

## Support

If deployment fails or you need help:
1. Check logs in Render Dashboard
2. See "Common Issues & Fixes" section above
3. Contact Render support: https://render.com/support

---

**You're ready! Start at: https://render.com/dashboard**

# Quick Start: Deploy Backend to Render

## Problem
Your frontend is deployed on GitHub Pages, but it can't reach your backend. The frontend needs a live backend URL to connect to.

## Solution: Deploy to Render

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (recommended for easier deployment)

### Step 2: Deploy Backend Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository (ahmed-abulfateh/marketplace)
3. Fill in the configuration:
   - **Name**: `marketplace-backend` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Paid if you need)

### Step 3: Set Environment Variables

In the Render dashboard, add these environment variables to your service:

```
MONGODB_URI=<your MongoDB Atlas URI>
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=https://ahmed-abulfateh.github.io
PORT=10000
```

### Step 3.5: ⚠️ **CRITICAL - Whitelist Render IPs in MongoDB Atlas**

**Before deploying**, add Render's outbound IPs to MongoDB Atlas:

1. Go to MongoDB Atlas → Network Access
2. Add these IP ranges:
   - `74.220.48.0/24`
   - `74.220.56.0/24`
3. Click "Confirm" for each
4. Wait 1-2 minutes for propagation

**See `MONGODB_IP_WHITELIST.md` for detailed instructions**

If you skip this, the backend will fail to connect to MongoDB!

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (takes 2-3 minutes)
3. Copy the live service URL shown by Render from the service dashboard.

### Step 5: Update Frontend Configuration

After your backend is deployed:

1. Set a GitHub repository secret or variable named `VITE_API_URL` to the exact Render service URL from the Render dashboard.
   Example:
   ```env
   VITE_API_URL=https://your-render-service.onrender.com
   ```
   The GitHub Pages workflow now fails if this value is missing, which prevents shipping a frontend that points at the wrong backend.

2. Rebuild the frontend:
   ```bash
   npm run build
   ```

3. Commit and push to GitHub:
   ```bash
   git add .github/workflows/deploy.yml .env
   git commit -m "Update backend deployment configuration"
   git push origin main
   ```

4. GitHub Pages will automatically rebuild and deploy

### Step 6: Test

1. Go to: `https://ahmed-abulfateh.github.io/marketplace.tsx/`
2. Try signing in with the admin account:
   - Email: `admin@test.com`
   - Password: `TestPass123!`
3. Navigate to `/deployment` page to check status

---

## Alternative: Deploy on Same Server

If you want frontend + backend on same domain:

1. Keep both frontend and backend deployed together on Render
2. Remove `VITE_API_URL` from `.env.production` (uses relative URLs)
3. Frontend and backend will be served from the same domain

---

## Troubleshooting

### Still Showing "Loading"?
- Check browser console (F12 → Console tab)
- Look for CORS errors or 404 errors
- Verify the API URL is correct in `.env.production`

### CORS Errors?
The backend is configured to accept requests from:
- `https://ahmed-abulfateh.github.io`
- `http://localhost:*`

If deploying elsewhere, the CORS might need updates in `server/index.js`

### API Returns 404?
Make sure your Render service is fully deployed and the URL is correct

---

## Need Help?

1. Check Render dashboard logs for backend errors
2. Check browser Network tab (F12 → Network) to see API requests
3. Verify MongoDB connection is working with `/api/health` endpoint

Visit your deployment page: `https://ahmed-abulfateh.github.io/marketplace.tsx/deployment`

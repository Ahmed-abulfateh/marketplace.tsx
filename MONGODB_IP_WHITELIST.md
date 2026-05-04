# MongoDB Atlas IP Whitelist for Render

## Problem
When you deploy to Render, the backend needs to connect to MongoDB Atlas. MongoDB Atlas requires you to whitelist the IP addresses that can connect to your database.

## Solution: Add Render IPs to MongoDB Atlas

### Render Outbound IP Addresses
When deploying to Render, your services will use these IP ranges:
```
74.220.48.0/24
74.220.56.0/24
```

### Step 1: Go to MongoDB Atlas

1. Visit https://cloud.mongodb.com/
2. Sign in with your account
3. Go to your cluster (MarketPlace)

### Step 2: Add IP Whitelist Entries

1. In left sidebar, click **"Network Access"**
2. Click **"Add IP Address"** button
3. Add the following entries:

**Entry 1:**
- IP Address: `74.220.48.0/24`
- Description: `Render US East`
- Click "Confirm"

**Entry 2:**
- IP Address: `74.220.56.0/24`
- Description: `Render US East`
- Click "Confirm"

### Step 3: Verify Connection

After adding the IPs:
1. Wait 1-2 minutes for changes to propagate
2. Deploy your backend to Render
3. Check server logs for successful MongoDB connection
4. Test API endpoint: `https://your-render-url/api/health`

---

## Current IP Whitelist

Your MongoDB Atlas connection string already includes `retryWrites=true`, so it should handle temporary connection issues gracefully.

If you see connection errors in Render logs like:
- `connection refused`
- `IP not whitelisted`
- `unable to establish connection`

Then you need to add the IPs above.

---

## Quick Reference: MongoDB Atlas Dashboard

1. **Security** → **Network Access**
2. Look for your existing whitelist entries
3. Add the two Render IP ranges above
4. Wait for "Propagating" status to complete
5. Test connection

---

## Alternative: Allow All IPs (Not Recommended for Production)

For testing only, you can allow all IPs:
- IP Address: `0.0.0.0/0`

⚠️ **Warning**: This is NOT secure for production. Only use for testing.

---

## Troubleshooting

### Still Can't Connect?
1. Check MongoDB Atlas logs in "Activity" section
2. Verify the IP addresses are correctly entered
3. Wait 5 minutes for propagation
4. Restart the Render service

### How to Check If Connected?
Visit: `https://your-render-url/api/health`
- ✅ Green/working = Connected
- ❌ Error = Check IPs and logs

---

## Next Steps After IP Whitelisting

1. Update `.env.production` with your Render API URL
2. Rebuild frontend
3. Push to GitHub
4. Test authentication at `https://ahmed-abulfateh.github.io/marketplace.tsx/`

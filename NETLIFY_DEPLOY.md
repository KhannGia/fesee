# Netlify Deployment Guide for FESEE

## 🚀 Quick Deploy to Netlify

### Method 1: Netlify UI (Recommended for first time)

1. **Prepare Repository**
   ```bash
   # Ensure code is pushed to GitHub
   git add .
   git commit -m "chore: Add Netlify configuration"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and authorize
   - Select repository: `angianguyen/FESE`

3. **Configure Build Settings**
   ```
   Build command: cd frontend && npm run build
   Publish directory: frontend/.next
   ```

4. **Add Environment Variables**
   Go to Site Settings → Environment Variables, add:
   ```
   MONGODB_URI = mongodb+srv://...
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID = 92f14403e88a8dec5c0662056f2d63a2
   NEXT_PUBLIC_STREAM_CREDIT_ADDRESS = 0xD56e705D58F597B448610c17Da11598539917910
   NEXT_PUBLIC_COLLATERAL_NFT_ADDRESS = 0xae4857b09B590905A8eFc4AaDa4b169ACe335701
   NEXT_PUBLIC_MOCK_USDC_ADDRESS = 0xF2349DF62365B214b5a8BD654D9CD8f47fe26009
   NEXT_PUBLIC_MOCK_VERIFIER_ADDRESS = 0x1E2905cCc01D83DF8074BdBa8a8bf839B69e6fE3
   NEXT_PUBLIC_API_URL = https://your-site.netlify.app
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait 2-3 minutes
   - Your site will be live at `https://random-name.netlify.app`

---

### Method 2: Netlify CLI (Faster for updates)

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**
   ```bash
   netlify login
   ```

3. **Initialize (First time only)**
   ```bash
   cd E:\fesee-main
   netlify init
   
   # Choose: "Create & configure a new site"
   # Team: Select your team
   # Site name: fesee-credit (or custom name)
   # Build command: cd frontend && npm run build
   # Publish directory: frontend/.next
   ```

4. **Set Environment Variables**
   ```bash
   # MongoDB
   netlify env:set MONGODB_URI "mongodb+srv://..."
   
   # Thirdweb
   netlify env:set NEXT_PUBLIC_THIRDWEB_CLIENT_ID "92f14403e88a8dec5c0662056f2d63a2"
   
   # Contract Addresses
   netlify env:set NEXT_PUBLIC_STREAM_CREDIT_ADDRESS "0xD56e705D58F597B448610c17Da11598539917910"
   netlify env:set NEXT_PUBLIC_COLLATERAL_NFT_ADDRESS "0xae4857b09B590905A8eFc4AaDa4b169ACe335701"
   netlify env:set NEXT_PUBLIC_MOCK_USDC_ADDRESS "0xF2349DF62365B214b5a8BD654D9CD8f47fe26009"
   netlify env:set NEXT_PUBLIC_MOCK_VERIFIER_ADDRESS "0x1E2905cCc01D83DF8074BdBa8a8bf839B69e6fE3"
   
   # API URL (update after first deploy)
   netlify env:set NEXT_PUBLIC_API_URL "https://fesee-credit.netlify.app"
   ```

5. **Deploy**
   ```bash
   # Production deploy
   netlify deploy --prod
   
   # Or draft deploy first
   netlify deploy
   ```

---

## ⚠️ Important Notes

### Next.js API Routes on Netlify

Netlify doesn't fully support Next.js API routes out of the box. You have 2 options:

**Option A: Use Netlify Functions (Recommended)**
- API routes will be converted to Netlify Functions automatically
- Install: `npm install -D @netlify/plugin-nextjs`
- Add to `netlify.toml`:
  ```toml
  [[plugins]]
    package = "@netlify/plugin-nextjs"
  ```

**Option B: External API**
- Deploy API separately (Vercel, Railway, Render)
- Update `NEXT_PUBLIC_API_URL` to external API endpoint

### MongoDB Connection
- Ensure MongoDB Atlas allows connections from `0.0.0.0/0`
- Or whitelist Netlify IPs (check Netlify docs)

---

## 🔧 Post-Deployment Checklist

After first deploy:

1. **Update API URL**
   ```bash
   # Get your Netlify URL
   netlify sites:list
   
   # Update environment variable
   netlify env:set NEXT_PUBLIC_API_URL "https://your-site.netlify.app"
   
   # Redeploy
   netlify deploy --prod
   ```

2. **Test Features**
   - [ ] Connect wallet
   - [ ] Mint collateral NFT
   - [ ] Generate ZK proof
   - [ ] Borrow USDC
   - [ ] Repay loan
   - [ ] Check MongoDB persistence

3. **Custom Domain (Optional)**
   ```bash
   netlify domains:add yourdomain.com
   ```

4. **Enable HTTPS**
   - Automatic with Netlify
   - Check SSL certificate status

---

## 🐛 Troubleshooting

### Build fails
```bash
# Check build logs
netlify logs
```

### API routes return 404
- Ensure `@netlify/plugin-nextjs` is installed
- Check `netlify.toml` configuration
- Verify environment variables are set

### MongoDB connection timeout
- Whitelist Netlify IPs in MongoDB Atlas
- Or use `0.0.0.0/0` for all IPs (development only)

### Images not loading
- Check IPFS gateway URLs
- Verify Thirdweb client ID is correct

---

## 📊 Monitoring

### View Logs
```bash
netlify logs
```

### View Site
```bash
netlify open
```

### Deploy Status
```bash
netlify status
```

---

## 🔄 Continuous Deployment

Netlify automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "feat: Add new feature"
git push origin main
# 🚀 Auto-deploys to Netlify!
```

---

**Your FESEE app will be live at:** `https://fesee-credit.netlify.app` 🎉

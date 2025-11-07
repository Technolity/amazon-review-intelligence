# Deployment Guide

Complete guide for deploying the Amazon Review Intelligence application to production.

## 🎯 Overview

- **Frontend**: Next.js app deployed on Vercel
- **Backend**: FastAPI app deployed on Render
- **CI/CD**: GitHub Actions for automated testing

---

## 📋 Prerequisites

1. **GitHub Account** - For code repository and CI/CD
2. **Vercel Account** - For frontend hosting (free tier available)
3. **Render Account** - For backend hosting (free tier available)
4. **Apify Account** - For Amazon review scraping (free tier: 5,000 requests/month)

---

## 🚀 Quick Deployment

### 1. Backend Deployment (Render)

#### Option A: Using render.yaml (Recommended)

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`

3. **Set Environment Secrets**
   - Go to your service settings
   - Add these secret environment variables:
     - `APIFY_API_TOKEN` - Your Apify API token
     - `ALLOWED_ORIGINS` - Your Vercel frontend URL

#### Option B: Manual Setup

1. Go to Render Dashboard → New Web Service
2. Connect your repository
3. Configure:
   - **Name**: `amazon-review-intelligence-api`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2`

4. Add all environment variables from `.env.example`

5. Deploy!

#### Verify Backend

```bash
curl https://your-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-...",
  "services": {
    "api": "operational",
    "apify": "connected",
    "ai": "enabled"
  }
}
```

---

### 2. Frontend Deployment (Vercel)

#### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from frontend directory**
   ```bash
   cd frontend
   vercel
   ```

3. **Follow prompts**:
   - Link to existing project or create new
   - Set project name: `amazon-review-intelligence`
   - Deploy!

4. **Set Production Environment Variable**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL production
   ```
   Enter your Render backend URL: `https://your-backend.onrender.com`

#### Option B: Using Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-backend.onrender.com`

6. Deploy!

#### Verify Frontend

Visit your Vercel URL and test:
- Input an ASIN (e.g., `B08N5WRWNW`)
- Click "Analyze Reviews"
- Check that data loads correctly

---

## 🔧 Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

### Backend (.env)

**Required:**
```env
APIFY_API_TOKEN=your_apify_token
ALLOWED_ORIGINS=https://your-frontend.vercel.app
EXPORT_FOLDER=/tmp/exports
```

**Recommended:**
```env
ENVIRONMENT=production
DEBUG=false
ENABLE_AI=true
USE_MOCK_FALLBACK=true
```

**Optional:**
```env
OPENAI_API_KEY=sk-...
HUGGINGFACE_API_KEY=hf_...
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The `.github/workflows/ci.yml` automatically:
1. ✅ Runs TypeScript type checks on frontend
2. ✅ Validates Python syntax on backend
3. ✅ Builds both applications
4. ✅ Runs on every push to `main`, `develop`, or `claude/**` branches

### Automatic Deployments

- **Vercel**: Deploys automatically on push to `main`
- **Render**: Deploys automatically on push to `main`

To disable auto-deploy:
- **Vercel**: Project Settings → Git → Uncheck "Automatically deploy"
- **Render**: Service Settings → Auto-Deploy → Disable

---

## 🐛 Troubleshooting

### Backend Issues

#### "AttributeError: 'Settings' object has no attribute 'EXPORT_FOLDER'"
**Solution**: Ensure `EXPORT_FOLDER=/tmp/exports` is set in environment variables

#### "Apify client not initialized"
**Solution**: Set `APIFY_API_TOKEN` in Render environment variables

#### "No module named 'app.services.exporter'"
**Solution**: Check that all files are committed and pushed to GitHub

### Frontend Issues

#### "API request failed: Network Error"
**Solution**:
1. Check `NEXT_PUBLIC_API_URL` is set correctly
2. Verify backend is running (visit `/health` endpoint)
3. Update `ALLOWED_ORIGINS` in backend to include your Vercel URL

#### TypeScript errors during build
**Solution**: Run `npm run type-check` locally to see errors

---

## 📊 Monitoring & Logs

### Render Logs
```bash
# View live logs
render logs <service-id>

# Or in dashboard
Dashboard → Service → Logs tab
```

### Vercel Logs
```bash
# View deployment logs
vercel logs <deployment-url>

# Or in dashboard
Dashboard → Deployments → Click deployment → Function Logs
```

---

## 🔐 Security Checklist

- [ ] Change `SECRET_KEY` in backend (generate new random key)
- [ ] Set `DEBUG=false` in production
- [ ] Enable HTTPS only (both Vercel and Render do this automatically)
- [ ] Review CORS `ALLOWED_ORIGINS` (only include your domains)
- [ ] Use environment variables for all secrets (never commit)
- [ ] Enable Vercel Analytics for monitoring (optional)
- [ ] Set up Sentry for error tracking (optional)

---

## 🎓 Best Practices

### For Backend (Render)

1. **Use Free Tier Wisely**
   - Free tier spins down after 15 min of inactivity
   - First request after spin-down takes ~30 seconds
   - Consider upgrading to paid tier for production

2. **Optimize Cold Starts**
   ```python
   # Already implemented in main.py
   - Lazy loading of heavy libraries
   - Efficient imports
   - Fast startup time
   ```

3. **Monitor Usage**
   - Apify free tier: 5,000 requests/month
   - Track usage in Apify dashboard

### For Frontend (Vercel)

1. **Optimize Build**
   - Already using Next.js optimizations
   - Images auto-optimized
   - Static pages cached at edge

2. **Set Caching Headers**
   - Already configured in `vercel.json`

3. **Monitor Performance**
   - Use Vercel Analytics
   - Check Core Web Vitals

---

## 🔄 Updating Production

### Update Backend
```bash
git add backend/
git commit -m "Update backend: <description>"
git push origin main
```
Render auto-deploys in ~2-3 minutes

### Update Frontend
```bash
git add frontend/
git commit -m "Update frontend: <description>"
git push origin main
```
Vercel auto-deploys in ~1-2 minutes

### Update Both
```bash
git add .
git commit -m "Update: <description>"
git push origin main
```

---

## 📱 Testing Production

### Health Checks
```bash
# Backend
curl https://your-backend.onrender.com/health

# Frontend
curl https://your-frontend.vercel.app
```

### API Test
```bash
curl -X POST https://your-backend.onrender.com/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "asin": "B08N5WRWNW",
    "max_reviews": 10,
    "enable_ai": true,
    "country": "US"
  }'
```

---

## 🆘 Support

- **Backend Issues**: Check Render logs
- **Frontend Issues**: Check Vercel logs
- **Apify Issues**: Check Apify dashboard
- **GitHub Actions**: Check Actions tab in repository

---

## 📝 Deployment Checklist

Before going live:

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] All environment variables set
- [ ] Backend health check passing
- [ ] Frontend can connect to backend
- [ ] CORS configured correctly
- [ ] Apify integration working
- [ ] Export (PDF/CSV) working
- [ ] Share functionality working
- [ ] Bot detection enabled
- [ ] Custom domain configured (optional)
- [ ] Analytics set up (optional)
- [ ] Error tracking set up (optional)

---

## 🎉 You're Live!

Your application is now deployed and ready to use!

- **Frontend**: https://your-frontend.vercel.app
- **Backend**: https://your-backend.onrender.com
- **Docs**: https://your-backend.onrender.com/docs

Share it with the world! 🚀

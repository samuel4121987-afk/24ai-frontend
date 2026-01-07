# 🚀 Backend Deployment Guide

## Deploy to Railway (Recommended)

### Step 1: Sign Up for Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (free tier available)
3. Verify your account

### Step 2: Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select this repository
5. Choose the `backend` folder as root directory
6. Railway will auto-detect Python and deploy!

### Step 3: Get Your Backend URL
After deployment completes:
1. Go to your project settings
2. Click "Generate Domain"
3. Copy your URL (e.g., `https://your-app.railway.app`)

### Step 4: Update Environment Variables
In Railway dashboard:
1. Go to "Variables" tab
2. Add these variables:
   - `PORT` = 8000 (Railway sets this automatically)
   - `ALLOWED_ORIGINS` = your-website-url.com

### Step 5: Update Frontend URLs
Replace all instances of `localhost:8000` with your Railway URL:
- In `/owner-test` page
- In `/dashboard` page
- In desktop agent configuration

---

## Alternative: Deploy to Render

### Step 1: Sign Up
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name:** ai-control-backend
   - **Root Directory:** backend
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 3: Deploy
Click "Create Web Service" and wait for deployment!

---

## Alternative: Deploy to Heroku

### Step 1: Install Heroku CLI
```bash
brew install heroku/brew/heroku  # Mac
# or download from heroku.com
```

### Step 2: Login and Create App
```bash
heroku login
cd backend
heroku create your-app-name
```

### Step 3: Deploy
```bash
git init
git add .
git commit -m "Deploy backend"
heroku git:remote -a your-app-name
git push heroku main
```

---

## Testing Your Deployment

### Check Health Endpoint
```bash
curl https://your-backend-url.railway.app/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00",
  "active_connections": 0,
  "active_agents": 0
}
```

### Test WebSocket Connection
Use a WebSocket testing tool or your desktop agent:
```
wss://your-backend-url.railway.app/ws?code=test-code&client_type=agent
```

---

## 🔒 Security Checklist

- [ ] Update CORS origins to your actual domain
- [ ] Set up environment variables for sensitive data
- [ ] Enable HTTPS (Railway/Render do this automatically)
- [ ] Add rate limiting for production
- [ ] Set up monitoring and logging

---

## 📊 Monitoring

### Railway Dashboard
- View logs in real-time
- Monitor CPU/Memory usage
- Track deployments
- Set up alerts

### Health Check Endpoint
Your backend includes `/api/health` for monitoring:
- Active WebSocket connections
- Active agents
- Server status
- Timestamp

---

## 🆘 Troubleshooting

### WebSocket Connection Fails
- Check if Railway domain is correct
- Verify CORS settings include your frontend domain
- Ensure using `wss://` (not `ws://`) for HTTPS

### Backend Crashes
- Check Railway logs for errors
- Verify all dependencies in requirements.txt
- Check Python version compatibility

### Can't Connect from Desktop Agent
- Update agent configuration with new backend URL
- Use `wss://` instead of `ws://` for secure connection
- Check firewall settings

---

## 💰 Cost Estimates

### Railway (Recommended)
- **Free Tier:** $5 credit/month (enough for testing)
- **Hobby Plan:** $5/month (500 hours)
- **Pro Plan:** $20/month (unlimited)

### Render
- **Free Tier:** Available (sleeps after 15 min inactivity)
- **Starter:** $7/month (always on)

### Heroku
- **Free Tier:** Discontinued
- **Basic:** $7/month
- **Standard:** $25/month

---

## 🎯 Next Steps After Deployment

1. ✅ Update frontend WebSocket URLs
2. ✅ Update desktop agent configuration
3. ✅ Test connection from web interface
4. ✅ Test with desktop agent
5. ✅ Update documentation with new URLs
6. ✅ Publish your website!

Your backend will be accessible 24/7 from anywhere in the world! 🌍

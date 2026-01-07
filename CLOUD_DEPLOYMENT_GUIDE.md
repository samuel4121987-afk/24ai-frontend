# 🚀 Complete Cloud Deployment Guide

This guide will help you deploy your AI Control backend to the cloud so users can connect from anywhere!

---

## 📋 Prerequisites

- GitHub account (for Railway/Render deployment)
- Your backend code ready in the `backend/` folder
- 10 minutes of your time

---

## 🎯 Recommended: Deploy to Railway

Railway is the easiest and most reliable option for FastAPI + WebSocket applications.

### **Step 1: Sign Up for Railway**

1. Go to [railway.app](https://railway.app)
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your repositories
4. Verify your account (free $5 credit/month)

### **Step 2: Create New Project**

1. Click "New Project" button
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Railway will detect it's a Python project automatically

### **Step 3: Configure Root Directory**

Since your backend is in a subfolder:

1. Click on your service
2. Go to "Settings" tab
3. Find "Root Directory" setting
4. Set it to: `backend`
5. Click "Save"

### **Step 4: Environment Variables**

Railway auto-sets `PORT`, but you can add custom variables:

1. Go to "Variables" tab
2. Click "New Variable"
3. Add these (optional):
   - `ALLOWED_ORIGINS` = `https://your-website.com`
   - `MAX_CONNECTIONS` = `100`

### **Step 5: Generate Domain**

1. Go to "Settings" tab
2. Scroll to "Networking" section
3. Click "Generate Domain"
4. Copy your URL (e.g., `https://your-app.up.railway.app`)

### **Step 6: Deploy!**

Railway automatically deploys when you push to GitHub:

1. Push your code to GitHub
2. Railway detects changes and deploys
3. Wait 2-3 minutes for build to complete
4. Check logs to ensure it's running

---

## ✅ Verify Deployment

### Test Health Endpoint

Open your browser or use curl:

```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "active_connections": 0,
  "active_agents": 0
}
```

### Test WebSocket Connection

Use a WebSocket testing tool or your desktop agent:

```
wss://your-app.up.railway.app/ws?code=test-code&client_type=agent
```

---

## 🔧 Update Your Frontend

### **Step 1: Update Backend Configuration**

Open `src/config/backend.ts` and replace the production URL:

```typescript
// Replace this line:
const PRODUCTION_BACKEND_URL = 'https://your-backend-url.railway.app';

// With your actual Railway URL:
const PRODUCTION_BACKEND_URL = 'https://your-app.up.railway.app';
```

### **Step 2: Update Desktop Agent**

Open `desktop-agent/agent.py` and update the WebSocket URL:

```python
# Replace this line:
BACKEND_URL = "ws://localhost:8000"

# With your Railway URL:
BACKEND_URL = "wss://your-app.up.railway.app"
```

### **Step 3: Rebuild Desktop Agent**

After updating the URL, rebuild the installers:

```bash
cd desktop-agent/electron-app
npm run build

# Or for Python agent:
cd desktop-agent/python-agent
python build.py --all
```

---

## 🎉 You're Live!

Your backend is now running 24/7 in the cloud! Users can:

1. Download your desktop agent
2. Install it on their computer
3. Connect from anywhere in the world
4. Start using AI control immediately

---

## 💰 Railway Pricing

- **Free Tier**: $5 credit/month (~500 hours)
- **Hobby Plan**: $5/month (500 hours)
- **Pro Plan**: $20/month (unlimited)

For most users, the free tier is enough to get started!

---

## 🔄 Alternative: Deploy to Render

If you prefer Render over Railway:

### **Step 1: Sign Up**

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### **Step 2: Create Web Service**

1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name**: `ai-control-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### **Step 3: Deploy**

1. Click "Create Web Service"
2. Wait 5-10 minutes for first deployment
3. Copy your URL from dashboard

### **Render Pricing**

- **Free Tier**: Available (sleeps after 15 min inactivity)
- **Starter**: $7/month (always on)
- **Standard**: $25/month (more resources)

**Note**: Free tier sleeps after inactivity, so first connection may be slow.

---

## 🔄 Alternative: Deploy to Heroku

### **Step 1: Install Heroku CLI**

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Download from heroku.com

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### **Step 2: Login and Create App**

```bash
heroku login
cd backend
heroku create your-app-name
```

### **Step 3: Deploy**

```bash
git init
git add .
git commit -m "Deploy backend"
git push heroku main
```

### **Step 4: Scale Dynos**

```bash
heroku ps:scale web=1
```

### **Heroku Pricing**

- **Free Tier**: Discontinued
- **Basic**: $7/month
- **Standard**: $25/month

---

## 🔒 Security Best Practices

### **1. Enable CORS Properly**

Update `backend/main.py` to only allow your domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-website.com"],  # Your actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **2. Add Rate Limiting**

Install slowapi:

```bash
pip install slowapi
```

Add to `requirements.txt` and implement in `main.py`.

### **3. Use Environment Variables**

Never hardcode sensitive data. Use Railway/Render environment variables.

### **4. Enable HTTPS**

Railway and Render provide HTTPS automatically. Always use `wss://` for WebSocket connections.

### **5. Monitor Your App**

- Set up logging
- Monitor error rates
- Track connection counts
- Set up alerts for downtime

---

## 📊 Monitoring & Logs

### **Railway Logs**

1. Go to your project
2. Click on your service
3. Click "Logs" tab
4. See real-time logs

### **Render Logs**

1. Go to your service dashboard
2. Click "Logs" in the sidebar
3. View real-time logs

### **Health Check Endpoint**

Your backend includes `/api/health` for monitoring:

```bash
curl https://your-app.railway.app/api/health
```

Set up external monitoring with:
- UptimeRobot (free)
- Pingdom
- StatusCake

---

## 🆘 Troubleshooting

### **WebSocket Connection Fails**

**Problem**: Can't connect via WebSocket

**Solutions**:
- ✅ Use `wss://` (not `ws://`) for HTTPS
- ✅ Check CORS settings in backend
- ✅ Verify Railway domain is correct
- ✅ Check firewall settings

### **Backend Crashes**

**Problem**: Service keeps restarting

**Solutions**:
- ✅ Check Railway logs for errors
- ✅ Verify all dependencies in requirements.txt
- ✅ Test locally first with `python main.py`
- ✅ Check Python version compatibility

### **Slow First Connection**

**Problem**: First connection takes 30+ seconds

**Solutions**:
- ✅ Render free tier sleeps - upgrade to paid
- ✅ Railway should be instant
- ✅ Add health check pings to keep alive

### **Build Fails**

**Problem**: Deployment fails during build

**Solutions**:
- ✅ Check requirements.txt for typos
- ✅ Verify Python version in runtime.txt
- ✅ Test build locally first
- ✅ Check Railway build logs

---

## 🎯 Next Steps

After successful deployment:

1. ✅ Update frontend configuration with your backend URL
2. ✅ Update desktop agent with your backend URL
3. ✅ Rebuild desktop agent installers
4. ✅ Test connection from web interface
5. ✅ Test with desktop agent
6. ✅ Upload installers to your website
7. ✅ Publish your website!

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [WebSocket Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

---

## 💡 Pro Tips

1. **Use Railway for production** - Most reliable for WebSockets
2. **Set up GitHub Actions** - Auto-deploy on push
3. **Monitor your logs** - Catch issues early
4. **Start with free tier** - Upgrade when needed
5. **Keep backend URL in config** - Easy to change later

---

## 🎉 Congratulations!

Your AI Control backend is now running in the cloud! Users can connect from anywhere, and you can manage everything from the Railway/Render dashboard.

**Your system is now:**
- ✅ Accessible 24/7 from anywhere
- ✅ Scalable to handle multiple users
- ✅ Secure with HTTPS/WSS
- ✅ Easy to monitor and maintain
- ✅ Ready for production use!

Happy deploying! 🚀

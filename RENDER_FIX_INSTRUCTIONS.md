# 🚨 Render Deployment Fix Instructions

## Issues Found:
1. ❌ Frontend trying to connect to localhost instead of deployed backend
2. ❌ Missing environment variables in Render frontend service
3. ❌ Incorrect image imports causing 404 errors
4. ❌ CORS configuration needs frontend domain
5. ❌ Missing build:frontend script for Render

## ✅ Fixes Applied:

### 1. Updated API Configuration
- ✅ Added fallback backend URL: `https://mealloop-backend.onrender.com/api`
- ✅ Added 30-second timeout for Render cold starts
- ✅ Added better error handling and logging

### 2. Fixed Image Assets
- ✅ Updated HomePage.jsx to properly import images
- ✅ Fixed DashboardSidebar.jsx image import
- ✅ All images now use proper Vite import syntax

### 3. Enhanced CORS Configuration
- ✅ Added common Render frontend URLs to CORS allowlist
- ✅ Maintained security with proper origin checking

### 4. Added Missing Scripts
- ✅ Added `build:frontend` script that Render was looking for

## 🔧 Manual Steps Required:

### Step 1: Update Render Frontend Environment Variables
Go to your Render dashboard → Frontend Service → Environment and add:

```
VITE_API_BASE_URL=https://mealloop-backend.onrender.com/api
VITE_GOOGLE_MAPS_API_KEY=your-actual-google-maps-api-key
VITE_CLOUDINARY_CLOUD_NAME=your-actual-cloudinary-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-actual-upload-preset
```

### Step 2: Update Render Backend Environment Variables
Go to your Render dashboard → Backend Service → Environment and add:

```
NODE_ENV=production
FRONTEND_URL=https://your-frontend-app.onrender.com
CORS_ORIGIN=https://your-frontend-app.onrender.com
```

### Step 3: Verify Backend URL
Make sure your backend service name matches the URL used in the API configuration:
- If your backend service is named differently, update the `VITE_API_BASE_URL`
- Check your Render backend dashboard for the correct URL

### Step 4: Commit and Push Changes
```bash
git add .
git commit -m "Fix Render deployment issues: API config, image imports, CORS, and environment variables"
git push origin main
```

### Step 5: Trigger Redeploy
After pushing, both services should automatically redeploy. If not:
1. Go to Render dashboard
2. Manually trigger redeploy for both frontend and backend services

## 🔍 Verification Steps:

1. **Check Backend Health**:
   - Visit: `https://your-backend-app.onrender.com/api/health`
   - Should return JSON with status "OK"

2. **Check Frontend**:
   - Visit your frontend URL
   - Open browser console (F12)
   - Should see: "API Base URL: https://mealloop-backend.onrender.com/api"
   - No more localhost connection errors

3. **Test Login**:
   - Try logging in with test credentials
   - Check network tab for successful API calls
   - No more "CONNECTION_REFUSED" errors

## 🚨 If Still Not Working:

### Check Render Logs:
1. **Frontend Logs**: Check build logs for any environment variable issues
2. **Backend Logs**: Check for startup errors or CORS issues

### Common Issues:
- **Backend URL**: Ensure you're using the correct backend service URL
- **Environment Variables**: Double-check all env vars are set correctly in Render
- **Cold Start**: Render free tier has cold starts - first request might take 30+ seconds

### Debug API Calls:
1. Open browser dev tools → Network tab
2. Try logging in
3. Check if API calls are going to the correct URL
4. Look for 404, 500, or CORS errors

## 📞 Next Steps After Fixing:
1. Test all functionality (login, signup, donations)
2. Check image loading
3. Verify real-time features (if any)
4. Test on mobile devices
5. Set up monitoring for production

Your deployment should now work correctly! 🚀
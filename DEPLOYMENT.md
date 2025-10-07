# MealLoop Deployment Guide - Render

This guide will help you deploy both the frontend and backend of MealLoop to Render with GitHub Actions CI/CD.

## Prerequisites

1. **GitHub Repository**: Your code should be pushed to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Atlas**: Set up a MongoDB Atlas cluster for production database
4. **Environment Variables**: Prepare all required environment variables

## Backend Deployment on Render

### Step 1: Create Backend Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `mealloop-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 2: Set Environment Variables

In your Render backend service, go to "Environment" and add:

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mealloop?retryWrites=true&w=majority
JWT_SECRET=your_super_secure_jwt_secret_here_2025_!@#$%^&*()_PRODUCTION
FRONTEND_URL=https://your-frontend-app-name.onrender.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Step 3: Deploy Backend

1. Click "Create Web Service"
2. Render will automatically deploy from your GitHub repository
3. Monitor the deployment logs
4. Once deployed, note your backend URL: `https://your-backend-app-name.onrender.com`

## Frontend Deployment on Render

### Step 1: Create Frontend Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `mealloop-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend/mealloop` (IMPORTANT: Set this correctly!)
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
   - **Node Version**: `18.20.4`

### Step 2: Set Environment Variables

In your Render frontend service, go to "Environment" and add:

```
NODE_VERSION=18.20.4
VITE_API_BASE_URL=https://your-backend-app-name.onrender.com/api
VITE_CLOUDINARY_CLOUD_NAME=ddiqp1bzn
VITE_CLOUDINARY_UPLOAD_PRESET=Veg Biryani
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAOmY0mUFLHWgl5MCaBsGvpDucrH5mwLr8
```

### Step 3: Important Configuration Notes

⚠️ **Common Issues and Solutions:**

1. **Root Directory**: Make sure to set `frontend/mealloop` as the root directory, NOT the repository root
2. **Build Command**: Use `npm ci && npm run build` (NOT just `npm install && npm run build`)
3. **Node Version**: Specify `18.20.4` in environment variables or use `.node-version` file
4. **Publish Directory**: Must be `dist` (this is where Vite outputs the built files)

### Step 4: Deploy Frontend

1. Click "Create Static Site"
2. Monitor the deployment logs carefully
3. If you see "Missing script: build" error, check that:
   - Root directory is set to `frontend/mealloop`
   - Your frontend package.json has the build script
   - Node version is compatible (18.x recommended)

### Step 5: Troubleshooting Build Issues

If deployment fails with "Missing script: build":

1. **Check Root Directory**: Ensure it's set to `frontend/mealloop`
2. **Verify Build Command**: Should be `npm ci && npm run build`
3. **Check Package.json**: Verify the build script exists:
   ```json
   {
     "scripts": {
       "build": "vite build"
     }
   }
   ```
4. **Node Version**: Add `NODE_VERSION=18.20.4` to environment variables

## Update Backend with Frontend URL

1. Go back to your backend service on Render
2. Update the `FRONTEND_URL` environment variable with your actual frontend URL
3. Click "Manual Deploy" to redeploy with the new URL

## GitHub Actions Setup

The GitHub Actions workflows are already configured in:
- `.github/workflows/deploy-backend.yml`
- `.github/workflows/deploy-frontend.yml`

These will:
1. Run on every push to `main` branch
2. Install dependencies
3. Run tests/linting
4. Trigger automatic deployment on Render

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist IP addresses (0.0.0.0/0 for Render)
5. Get your connection string
6. Update the `MONGO_URI` in your backend environment variables

## Domain Configuration (Optional)

1. Purchase a custom domain
2. In Render, go to your frontend service → "Settings" → "Custom Domains"
3. Add your domain and follow DNS configuration instructions
4. Update CORS settings in backend to include your custom domain

## Monitoring and Logs

- Monitor deployments in Render dashboard
- Check logs for any errors
- Use the health check endpoint: `https://your-backend-app-name.onrender.com/api/health`

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure frontend URL is correctly set in backend environment
2. **Database Connection**: Verify MongoDB Atlas connection string and IP whitelist
3. **Environment Variables**: Double-check all environment variables are set correctly
4. **Build Failures**: Check logs for missing dependencies or build errors

### Debug Steps:

1. Check Render deployment logs
2. Verify environment variables are set
3. Test API endpoints manually
4. Check browser network tab for failed requests

## Production Best Practices

1. **Security**: Use strong, unique secrets for production
2. **Monitoring**: Set up error tracking (Sentry, etc.)
3. **Backups**: Regular MongoDB Atlas backups
4. **SSL**: Render provides SSL certificates automatically
5. **Performance**: Monitor response times and optimize as needed

## Automatic Deployments

Once set up, any push to the `main` branch will:
1. Trigger GitHub Actions workflow
2. Run tests and build checks
3. Automatically deploy to Render if successful

Your MealLoop application will be live at:
- Frontend: `https://your-frontend-app-name.onrender.com`
- Backend API: `https://your-backend-app-name.onrender.com/api`

#!/bin/bash

# Build verification script for MealLoop Frontend
echo "🔍 Starting build verification..."

# Navigate to frontend directory
cd frontend/mealloop

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi

# Check if build script exists
if ! grep -q '"build"' package.json; then
    echo "❌ Build script not found in package.json!"
    exit 1
fi

echo "✅ package.json and build script found"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies!"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Run build
echo "🏗️ Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed successfully"

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ dist directory not found after build!"
    exit 1
fi

# Check if index.html exists in dist
if [ ! -f "dist/index.html" ]; then
    echo "❌ index.html not found in dist directory!"
    exit 1
fi

echo "✅ dist/index.html found"
echo "🎉 Build verification completed successfully!"

# Show build output structure
echo "📁 Build output structure:"
ls -la dist/
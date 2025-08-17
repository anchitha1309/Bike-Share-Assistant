#!/bin/bash

echo "🚀 Starting Bike Share Analytics..."

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Build fresh
echo "🔨 Building application..."
docker-compose build --no-cache

# Start application
echo "🚀 Starting application..."
docker-compose up -d

# Wait for startup
echo "⏳ Waiting for application to start..."
sleep 10

# Check status
echo "✅ Checking application status..."
curl -s http://localhost:3000/health

echo "🎉 Application is running at http://localhost:3000"

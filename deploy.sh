#!/bin/bash

# Production Deployment Script for Yashoda Pickle
# Usage: ./deploy.sh [environment]
# Environment: production (default) or staging

set -e

ENVIRONMENT=${1:-production}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_ROOT/server"

echo "🚀 Starting deployment to $ENVIRONMENT environment"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

cd "$SERVER_DIR"

# Create environment file if it doesn't exist
if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo "⚠️  Environment file .env.$ENVIRONMENT not found."
    echo "📋 Copying from .env.${ENVIRONMENT}.example..."
    if [ -f ".env.${ENVIRONMENT}.example" ]; then
        cp ".env.${ENVIRONMENT}.example" ".env.$ENVIRONMENT"
        echo "✅ Created .env.$ENVIRONMENT"
        echo "⚠️  Please edit .env.$ENVIRONMENT with your $ENVIRONMENT credentials before deploying."
        exit 1
    else
        echo "❌ .env.${ENVIRONMENT}.example not found. Please create environment file manually."
        exit 1
    fi
fi

echo "🔍 Checking environment configuration..."
# Basic validation of required environment variables
REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "EMAIL_USER" "EMAIL_PASS")
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" ".env.$ENVIRONMENT"; then
        echo "❌ Required environment variable $var not found in .env.$ENVIRONMENT"
        exit 1
    fi
done

echo "✅ Environment configuration looks good"

# Build and deploy
echo "🏗️  Building and deploying services..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose -f docker-compose.yml up -d --build
else
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health endpoint
echo "🏥 Checking service health..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Services are healthy!"
else
    echo "❌ Services are not healthy. Check logs with: docker-compose logs"
    exit 1
fi

# Show status
echo "📊 Deployment Status:"
docker-compose ps

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo "  Update services: docker-compose up -d --build"
echo ""
echo "🌐 Your application should be available at:"
echo "  Frontend: http://localhost"
echo "  API: http://localhost/api"
echo "  Health Check: http://localhost/health"
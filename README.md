# Yashoda Pickle E-Commerce Platform

A production-ready e-commerce platform built with React, Express.js, and Supabase.

## 🚀 Features

- **User Authentication**: Secure signup/login with email verification
- **Password Reset**: Custom email-based password recovery
- **Product Catalog**: Dynamic product display with search and filtering
- **Shopping Cart**: Persistent cart with localStorage
- **Secure Checkout**: Razorpay payment integration
- **Order Management**: Order tracking and history
- **Admin Panel**: Product and order management
- **Responsive Design**: Mobile-first Tailwind CSS styling
- **Production Ready**: Docker, monitoring, security headers

## 🛠️ Tech Stack

### Frontend
- **React 19** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **TypeScript** support

### Backend
- **Node.js** with Express.js
- **Supabase** for database and auth
- **Nodemailer** for email services
- **Razorpay** for payments
- **Helmet** for security
- **Rate limiting** and CORS

### DevOps
- **Docker** containerization
- **Nginx** reverse proxy
- **Health checks** and monitoring
- **Graceful shutdown**

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

## 🚀 Quick Start

### Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yashoda-pickle
   ```

2. **Setup environment variables**
   ```bash
   # Backend
   cp server/.env.development server/.env
   # Edit server/.env with your credentials

   # Frontend
   cp myapp/.env.example myapp/.env
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../myapp
   npm install
   ```

4. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd server
   npm run dev

   # Frontend (Terminal 2)
   cd myapp
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Production Deployment

#### Using Docker Compose

1. **Setup production environment**
   ```bash
   cp server/.env.production.example server/.env.production
   # Edit server/.env.production with production credentials
   ```

2. **Build and deploy**
   ```bash
   cd server
   docker-compose up -d --build
   ```

3. **Check deployment**
   ```bash
   # Health check
   curl http://localhost/health

   # View logs
   docker-compose logs -f app
   ```

#### Manual Deployment

1. **Build frontend**
   ```bash
   cd myapp
   npm run build
   ```

2. **Start backend**
   ```bash
   cd server
   npm start
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env.production)
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Payments
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_secret_key

# Email
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@yourdomain.com

# Security
JWT_SECRET=your-secure-jwt-secret
SESSION_SECRET=your-session-secret

# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-api-domain.com
```

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd myapp
npm test
npm run test:coverage
```

## 📊 Monitoring

### Health Checks
- **Health**: `GET /health` - Overall service health
- **Readiness**: `GET /ready` - Service readiness for traffic
- **Metrics**: `GET /metrics` - Basic performance metrics

### Logs
```bash
# View application logs
docker-compose logs -f app

# View nginx logs
docker-compose logs -f nginx
```

## 🔒 Security Features

- **Helmet**: Security headers
- **Rate Limiting**: API protection
- **CORS**: Cross-origin protection
- **Input Validation**: Request sanitization
- **HTTPS**: SSL/TLS encryption
- **Environment Secrets**: Secure credential management

## 🚀 Performance Optimizations

- **Code Splitting**: Lazy loading of routes
- **Bundle Analysis**: `npm run build:analyze`
- **Compression**: Gzip response compression
- **Caching**: Browser and CDN caching
- **Image Optimization**: WebP format support

## 📱 API Documentation

### Authentication
- `POST /send-verification-email` - Send email verification
- `POST /send-password-reset-email` - Send password reset email
- `POST /reset-password` - Reset user password

### Orders
- `POST /create-order` - Create Razorpay order
- `POST /place-order` - Process order completion

### Monitoring
- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /metrics` - Performance metrics

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild specific service
docker-compose up -d --build app

# Clean up
docker-compose down -v --rmi all
```

## 🔄 CI/CD

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          # Add your deployment commands
          echo "Deploying to production..."
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Kill process on port
   lsof -ti:5000 | xargs kill -9
   ```

2. **Database connection issues**
   - Check Supabase credentials
   - Verify network connectivity
   - Check Supabase dashboard

3. **Email not sending**
   - Verify Gmail app password
   - Check spam folder
   - Review server logs

### Debug Mode
```bash
# Run with debug logging
NODE_ENV=development DEBUG=* npm start
```

## 📄 License

ISC License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support, email support@yashodapickle.com or create an issue in the repository.
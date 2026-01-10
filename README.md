# ACENEXA CBT Portal

Professional Computer-Based Testing (CBT) platform for JAMB and WAEC exam preparation.

## Features

- JAMB UTME Practice (4 subjects, 40 questions each, 120 minutes)
- WAEC SSCE Practice (Single subject, 60 questions, 50 minutes)
- Secure token-based authentication with device locking
- 1-year access validity from first device binding
- Automated payment integration (Paystack)
- Comprehensive admin panel
- Offline support with auto-sync
- Real-time exam timer
- Result tracking and review
- Mobile responsive design
- Dark mode support

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide Icons
- Service Worker (PWA)

### Backend
- Node.js + Express
- Supabase (PostgreSQL)
- Paystack API
- RESTful API

## Project Structure

```
acenexa-cbt/
├── backend/               # Backend API (Node.js + Express)
│   ├── config/           # Configuration management
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── server.js         # Entry point
├── database/             # Database schemas
│   └── schema.sql        # PostgreSQL schema
├── components/           # React components
├── services/             # Frontend services
├── public/               # Static assets
├── DEPLOYMENT.md         # Deployment guide
└── package.json          # Frontend dependencies
```

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Paystack account
- Git

### Local Development

1. **Clone Repository**
```bash
git clone <your-repo-url>
cd acenexa-cbt
```

2. **Setup Database**
   - Create Supabase project
   - Copy `database/schema.sql` to Supabase SQL Editor
   - Execute the schema

3. **Configure Backend**
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
npm run dev
```

4. **Configure Frontend**
```bash
# In project root
cp .env.local.example .env.local
# Edit .env.local with your settings
npm install
npm run dev
```

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - Admin Login: `admin` / `admin` (change immediately!)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete production deployment guide.

### Quick Deploy

1. **Database**: Run `database/schema.sql` in Supabase
2. **Backend**: Deploy `backend/` to Render
3. **Frontend**: Deploy to Vercel

Detailed steps with screenshots in DEPLOYMENT.md.

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (.env.local)
```env
VITE_API_BASE_URL=https://your-backend.onrender.com
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxx
```

## API Documentation

### Base URL
```
Development: http://localhost:5000
Production: https://your-backend.onrender.com
```

### Endpoints

See [backend/README.md](./backend/README.md) for complete API documentation.

## Security Features

- Device fingerprinting and locking
- Row Level Security (RLS) in database
- CORS protection
- Token-based authentication
- Automatic token expiry (1 year)
- Environment-based configuration
- No hard-coded secrets

## Database Schema

The system uses 5 main tables:

1. **subjects** - Available exam subjects
2. **users** - Admin and student accounts
3. **access_tokens** - Paid access codes with expiry
4. **questions** - Exam question bank
5. **results** - Student exam history

See `database/schema.sql` for complete schema.

## Admin Features

- Generate access tokens manually
- View all tokens with expiry dates
- Reset device locks
- Manage subjects dynamically
- Bulk upload questions (CSV)
- View student results
- Manage users

## Student Features

- Purchase access via Paystack
- Device-bound access codes
- Practice unlimited exams
- Review answers with explanations
- Track performance over time
- Subject selection (JAMB/WAEC)
- Timed exam simulation
- Question flagging and navigation

## Development

### Frontend
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
cd backend
npm run dev      # Start with nodemon
npm start        # Start production server
```

## Testing

### Backend Health Check
```bash
curl http://localhost:5000/health
```

### Frontend Test
- Open http://localhost:5173
- Admin login: admin / admin
- Test payment with Paystack test cards

## Default Credentials

```
Admin:
  Username: admin
  Password: admin
  (CHANGE IMMEDIATELY!)
```

## Payment Integration

Uses Paystack for payment processing:
- Test Mode: Use `pk_test_` and `sk_test_` keys
- Live Mode: Use `pk_live_` and `sk_live_` keys

Test Cards:
- Success: 4084084084084081
- CVV: 408
- PIN: 0000
- OTP: 123456

## Support

- Backend Documentation: `backend/README.md`
- Deployment Guide: `DEPLOYMENT.md`
- Database Schema: `database/schema.sql`

## License

Proprietary - ACENEXA Education

## Troubleshooting

See [DEPLOYMENT.md](./DEPLOYMENT.md) Troubleshooting section for common issues and solutions.

## Version

1.0.0 - Production Ready
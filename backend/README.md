# ACENEXA CBT Backend

Professional Node.js + Express backend for the ACENEXA CBT Portal.

## Architecture

```
backend/
├── config/          # Configuration management
│   ├── database.js  # Supabase connection
│   └── env.js       # Environment variables
├── controllers/     # Request handlers
│   ├── authController.js
│   ├── paymentController.js
│   ├── adminController.js
│   ├── questionController.js
│   ├── subjectController.js
│   ├── resultController.js
│   └── userController.js
├── middleware/      # Custom middleware
│   ├── cors.js
│   └── errorHandler.js
├── routes/          # API routes
│   ├── auth.routes.js
│   ├── payment.routes.js
│   ├── admin.routes.js
│   ├── question.routes.js
│   ├── subject.routes.js
│   ├── result.routes.js
│   ├── user.routes.js
│   └── index.js     # Route aggregator
├── services/        # Business logic
│   ├── tokenService.js
│   └── paystackService.js
├── server.js        # Entry point
├── package.json     # Dependencies
└── .env.example     # Environment template
```

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Paystack account (for payments)

### Installation

```bash
cd backend
npm install
```

### Configuration

1. Copy environment template:
```bash
cp .env.example .env
```

2. Fill in your credentials in `.env`:
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PAYSTACK_SECRET_KEY=sk_test_your_test_key

FRONTEND_URL=http://localhost:5173
```

### Development

```bash
npm run dev
```

Server runs on http://localhost:5000

### Production

```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login-with-token` - Token-based student login
- `POST /api/auth/login` - Admin/student login
- `POST /api/auth/update-credentials` - Update user credentials
- `POST /api/auth/register` - Register student

### Payments
- `POST /api/payments/verify-paystack` - Verify Paystack payment

### Admin
- `POST /api/admin/generate-token` - Generate manual access token
- `GET /api/admin/tokens` - List all tokens
- `POST /api/admin/token-status` - Activate/deactivate token
- `POST /api/admin/reset-token-device` - Reset device lock
- `DELETE /api/admin/tokens/:tokenCode` - Delete token

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Add subject
- `DELETE /api/subjects/:id` - Delete subject

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Add single question
- `POST /api/questions/bulk` - Bulk upload questions
- `DELETE /api/questions/:id` - Delete question
- `DELETE /api/questions/reset/all` - Reset all questions

### Results
- `GET /api/results/:username` - Get student results
- `POST /api/results` - Save result
- `DELETE /api/results/:username` - Clear results

### Users
- `GET /api/users/students` - Get all students
- `DELETE /api/users/:username` - Delete user

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| PORT | Server port | No | 5000 |
| NODE_ENV | Environment | No | development |
| SUPABASE_URL | Supabase project URL | Yes | https://xxx.supabase.co |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service key | Yes | eyJhbG... |
| PAYSTACK_SECRET_KEY | Paystack secret key | Yes | sk_test_xxx |
| FRONTEND_URL | Frontend URL for CORS | Yes | http://localhost:5173 |

## Deployment

See [DEPLOYMENT.md](../DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to Render

1. Push to GitHub
2. Connect to Render
3. Set Root Directory: `backend`
4. Add environment variables
5. Deploy

## Testing

Health check:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-01-10T..."
}
```

## License

Proprietary - ACENEXA CBT Portal

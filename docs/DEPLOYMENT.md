# Deployment Guide

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start databases
# Option A: Using Docker
docker-compose up postgres mongo -d

# Option B: Local installations
# Ensure PostgreSQL and MongoDB are running locally

# 4. Initialize database
npx prisma generate
npx prisma db push
npx prisma db seed

# 5. Start development server
npm run dev
```

Visit `http://localhost:3000`.

---

## Docker Deployment

```bash
# Build and run all services
docker-compose up --build -d

# Run database migrations inside the container
docker-compose exec app npx prisma db push

# View logs
docker-compose logs -f app
```

---

## Production Deployment (Cloud)

### Option A: Vercel

1. Push your code to GitHub.
2. Import the repository on [Vercel](https://vercel.com).
3. Add all environment variables from `.env.example` to the Vercel dashboard.
4. Vercel auto-detects Next.js and handles builds.
5. Set up external PostgreSQL (e.g., Supabase, Neon) and MongoDB (e.g., Atlas).

### Option B: Docker on a VPS

```bash
# On your VPS
git clone <repo-url>
cd ai-business-operations

# Set production environment variables
cp .env.example .env
nano .env  # Fill in production values

# Build and deploy
docker-compose -f docker-compose.yml up --build -d
```

### Option C: Kubernetes

A Helm chart is not included, but the Docker image is production-ready:

```bash
docker build -t ai-biz-ops:latest .
docker tag ai-biz-ops:latest your-registry/ai-biz-ops:latest
docker push your-registry/ai-biz-ops:latest
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `JWT_ACCESS_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | JWT refresh signing secret |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | ✅ | OAuth callback URL |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public application URL |
| `WHATSAPP_PHONE_NUMBER_ID` | ❌ | Meta WhatsApp Phone Number ID |
| `WHATSAPP_ACCESS_TOKEN` | ❌ | Meta WhatsApp Access Token |
| `WHATSAPP_VERIFY_TOKEN` | ❌ | Webhook verification token |
| `WHATSAPP_APP_SECRET` | ❌ | Webhook signature secret |

> **Note**: WhatsApp variables are optional. If omitted, the system automatically uses the `MockWhatsappAdapter` for development.

---

## Database Migrations

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name <migration_name>
npx prisma migrate deploy
```

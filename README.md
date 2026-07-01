# AI Business Operations Platform

A production-ready, multi-tenant SaaS platform for AI-powered business operations and CRM management. Built with Next.js 15, Gemini 2.5 Flash, PostgreSQL, and MongoDB.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black)
![Prisma](https://img.shields.io/badge/Prisma-6.x-teal)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-green)

---

## Features

### Core Platform
- **Multi-Tenant Architecture** — Complete data isolation with tenant-scoped queries
- **OAuth 2.0 + PKCE** — Google OAuth with Refresh Token Rotation (RTR)
- **Role-Based Access Control** — SUPERADMIN, ADMIN, MEMBER roles enforced at middleware level
- **Security Hardened** — Helmet-equivalent headers, rate limiting, CORS, CSRF, XSS sanitization

### AI Agent
- **Gemini 2.5 Flash** streaming chat with persistent conversation history
- **7 Function-Calling Tools**: SearchContacts, CreateTask, UpdateOpportunity, SendWhatsApp, FetchBusinessMetrics, CreateAuditLog, SummarizeConversation
- **Explainability** — Every response includes Reasoning, Confidence, and Recommended Action
- **Loop Protection** — MAX_TOOL_CALLS circuit breaker prevents infinite tool loops

### CRM Module
- **Contacts** — Full CRUD with search, pagination, and soft-delete
- **Opportunities** — Sales pipeline (LEAD → QUALIFIED → PROPOSAL → WON/LOST)
- **Tasks** — Assignable to users, linked to contacts/opportunities
- **Notes** — Rich text attached to contacts or opportunities
- **Audit Logs** — Every CRM action is logged with entity references

### Unified Inbox
- WhatsApp, Email, and Call Log timelines with AI summaries
- Sentiment analysis, intent detection, and recommended next actions
- Infinite scroll with MongoDB cursor-based pagination

### WhatsApp Integration
- **Adapter Pattern** — `MetaWhatsappAdapter` (production) / `MockWhatsappAdapter` (dev)
- Webhook signature validation (HMAC-SHA256)
- Idempotent message ingestion via `externalId` unique index
- Exponential backoff retry for outbound messages

### Workflow Engine
- **DAG Execution**: Lead Created → AI Qualification → Score Condition → WhatsApp → Task → Audit
- **Idempotent State Machine** — Hydrates context from MongoDB, skips completed steps on recovery
- **Orphan Recovery** — Sweeps `RUNNING` workflows stuck >5 minutes and safely re-queues them
- Background retry with exponential backoff (3 attempts)

### SaaS Dashboard
- Real-time metrics: Revenue Pipeline, Lead Conversion, Pending Tasks, AI Alerts
- CSS-driven pipeline distribution charts (zero external charting libraries)
- React Query caching with 15s background polling
- Memoized components (`React.memo` + `useMemo`) for zero-overhead rendering
- Accessible: `aria-pressed`, `role="progressbar"`, `sr-only` descriptions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Edge Middleware) |
| Language | TypeScript 5 |
| Database | PostgreSQL (Prisma ORM) |
| Document Store | MongoDB (Mongoose 9) |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Auth | Google OAuth 2.0 + PKCE, JWT (jose) |
| State | Zustand, React Query v5 |
| Styling | Tailwind CSS 4 |
| Validation | Zod |
| Messaging | Meta Cloud API (WhatsApp Business) |

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- MongoDB 7+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd ai-business-operations

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client & run migrations
npx prisma generate
npx prisma db push

# Seed demo data
npx prisma db seed

# Start development server
npm run dev
```

### Docker

```bash
docker-compose up --build
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── ai/             # AI Chat streaming endpoint
│   │   ├── auth/           # OAuth, refresh, logout
│   │   ├── crm/            # Contacts, Opportunities, Tasks, Notes
│   │   ├── dashboard/      # Aggregated metrics API
│   │   ├── inbox/          # Unified inbox SSE + messages
│   │   ├── webhook/        # WhatsApp webhook receiver
│   │   └── workflows/      # Workflow execution logs
│   └── dashboard/          # Dashboard pages
│       ├── ai/             # AI Chat UI
│       ├── crm/            # CRM management UI
│       ├── inbox/          # Unified Inbox UI
│       ├── whatsapp/       # WhatsApp settings
│       └── workflows/      # Workflow visualizer
├── core/                   # Shared infrastructure
│   ├── database/           # Prisma + Mongoose clients
│   ├── errors/             # AppError class
│   ├── logger/             # Structured logger
│   ├── security/           # JWT, OAuth, rate limiting, sanitization
│   └── validation/         # Zod schemas
├── features/               # Domain modules
│   ├── ai/                 # AI agent (services, tools, repositories)
│   ├── auth/               # Auth (services, hooks, components)
│   ├── crm/                # CRM (services, repositories)
│   ├── dashboard/          # Dashboard hooks
│   ├── inbox/              # Inbox (repositories, models)
│   ├── whatsapp/           # WhatsApp adapter pattern
│   └── workflows/          # Workflow engine
└── middleware.ts            # Edge middleware (auth, RBAC, rate limit, CORS, CSRF)
```

---

## Environment Variables

See [`.env.example`](.env.example) for all required configuration.

---

## Testing

```bash
npx vitest run
```

Test suites cover:
- Authentication (OAuth exchange, RTR, session revocation)
- Rate Limiting (sliding window enforcement)
- AI Chat Service (conversation lifecycle, tool call bounding)
- Dashboard Components (StatCard contract testing)
- Workflow Engine (idempotency, orphan recovery)

---

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full deployment instructions.

---

## Documentation

- [Architecture & ER Diagram](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

---

## License

MIT

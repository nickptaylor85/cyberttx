# CyberTTX — AI-Powered Cybersecurity Tabletop Exercises

A multi-tenant SaaS platform for running realistic, AI-generated cybersecurity tabletop exercises. Built with Next.js 15, Neon PostgreSQL, Clerk Auth, Pusher (real-time), Stripe billing, and Claude AI.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CYBERTTX PLATFORM                  │
├──────────┬──────────────┬──────────┬────────────────┤
│  Admin   │ Client Portal│  TTX     │    AI Engine    │
│  Portal  │ (per-tenant) │ Gameplay │  (Claude API)   │
├──────────┴──────────────┴──────────┴────────────────┤
│  Next.js 15 (App Router) + Clerk + Pusher + Stripe  │
├─────────────────────────────────────────────────────┤
│              Neon PostgreSQL (Prisma)                 │
└─────────────────────────────────────────────────────┘
```

### Multi-Tenancy Model
- **Subdomain routing**: `acme.cyberttx.com` → Acme Corp's portal
- **Complete tenant isolation**: No data leaks between client orgs
- **Role hierarchy**: Super Admin → Client Admin → Member

### AI Learning Loop
```
Company Profile ─┐
Security Stack   ─┼─→ Claude AI ─→ Scenario ─→ Gameplay ─→ Results
Characters       ─┤                                           │
Past Performance ─┘    ◄─── Feedback automatically captured ──┘
```
Each completed session feeds performance data back into the AI prompt, so scenarios get smarter over time — harder questions on weak areas, fewer easy questions on mastered topics.

## Features

### Platform Admin
- Create/manage client portals with plan limits
- Set demo portals (unlimited TTX for internal teams)
- Platform-wide analytics

### Client Portal
- **Company Profile**: Industry, infrastructure, compliance, team size — all fed into AI generation
- **Security Stack**: Select from 60+ tools (CrowdStrike, Tenable, Sentinel, Zscaler, etc.) — scenarios reference your actual tools
- **Characters**: Named personas (CISO, SOC analysts, etc.) woven into narratives by the AI
- **TTX Creation Wizard**: Choose theme, difficulty, MITRE ATT&CK techniques, question count
- **Real-time Gameplay**: WebSocket-driven group exercises with live scoring
- **Individual Mode**: Self-paced solo exercises
- **Leaderboard**: Per-session and all-time rankings
- **PDF Export**: Downloadable post-exercise reports

### TTX Themes
Ransomware, APT, Insider Threat, Supply Chain, BEC, Cloud Breach, Zero-Day, Data Exfiltration, DDoS, IoT/OT, Credential Stuffing, Watering Hole

### Difficulty Levels
- **Beginner** (0-2 yrs): 50% easy / 35% medium / 15% hard
- **Intermediate** (2-5 yrs): 20% easy / 50% medium / 30% hard
- **Advanced** (5-10 yrs): 10% easy / 30% medium / 60% hard
- **Expert** (10+ yrs): 5% easy / 25% medium / 70% hard

## Setup

### Prerequisites
- Node.js 18+
- Accounts: [Neon](https://neon.tech), [Clerk](https://clerk.com), [Pusher](https://pusher.com), [Stripe](https://stripe.com), [Anthropic](https://anthropic.com)

### 1. Clone & Install
```bash
git clone <your-repo>
cd cyber-ttx
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env
# Fill in all values — see .env.example for descriptions
```

### 3. Database Setup
```bash
npx prisma db push     # Create tables in Neon
npm run db:seed         # Seed 60+ security tools + demo org
```

### 4. Clerk Configuration
1. Create a Clerk application at clerk.com
2. Set your Clerk keys in `.env`
3. Create a webhook endpoint in Clerk dashboard pointing to:
   `https://yourdomain.com/api/webhooks/clerk`
4. Subscribe to events: `user.created`, `user.updated`, `user.deleted`
5. Copy the webhook signing secret to `CLERK_WEBHOOK_SECRET`

### 5. Pusher Setup
1. Create a Channels app at pusher.com (choose EU cluster for UK)
2. Enable client events
3. Copy credentials to `.env`

### 6. Stripe Setup
1. Create products and prices for Starter/Professional/Enterprise
2. Copy price IDs to `.env`
3. Create webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Subscribe to: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`

### 7. Super Admin
Add your Clerk user ID to `SUPER_ADMIN_CLERK_IDS` in `.env`

### 8. Run Locally
```bash
npm run dev
```
- Main site: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- Demo portal: `http://localhost:3000/portal?org=demo`

### 9. Deploy to Vercel
```bash
vercel deploy
```
Set all environment variables in Vercel dashboard.

#### Custom Domain & Subdomains
1. Add your domain in Vercel (e.g., `cyberttx.com`)
2. Add a wildcard subdomain: `*.cyberttx.com`
3. Set `NEXT_PUBLIC_APP_DOMAIN=cyberttx.com` in Vercel env vars

## Database Schema

Key models:
- `Organization` — Tenant with plan, limits, billing
- `OrgProfile` — Company info fed into AI (industry, infra, compliance)
- `TtxCharacter` — Named personas for scenario narratives
- `SecurityTool` → `OrgSecurityTool` — 60+ tools, per-org selection
- `TtxSession` — Exercise with AI-generated scenario (JSON)
- `TtxParticipant` → `TtxAnswer` — Per-user scoring
- `ScenarioFeedback` — Auto-captured performance data for AI learning

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Marketing landing page
│   ├── admin/                      # Super admin portal
│   │   ├── page.tsx                # Admin dashboard
│   │   └── clients/page.tsx        # Manage client orgs
│   ├── portal/                     # Client portal (subdomain)
│   │   ├── page.tsx                # Portal dashboard
│   │   ├── ttx/                    # Exercise management
│   │   │   ├── page.tsx            # Exercise list
│   │   │   ├── new/page.tsx        # Creation wizard
│   │   │   └── [id]/page.tsx       # Gameplay + results
│   │   ├── leaderboard/page.tsx    # Rankings
│   │   ├── tools/page.tsx          # Security stack config
│   │   ├── characters/page.tsx     # TTX personas
│   │   ├── profile/page.tsx        # Company profile
│   │   └── users/page.tsx          # Team management
│   └── api/
│       ├── admin/orgs/             # Admin CRUD
│       ├── portal/                 # Portal APIs (tools, profile, characters)
│       ├── ttx/                    # TTX generation + session APIs
│       ├── pusher/auth/            # Real-time channel auth
│       └── webhooks/               # Clerk + Stripe webhooks
├── components/                     # Reusable UI components
├── lib/
│   ├── ai/generate-ttx.ts         # Claude AI scenario engine
│   ├── db.ts                      # Prisma client (Neon adapter)
│   ├── pusher-server.ts           # Pusher server instance
│   ├── pusher-client.ts           # Pusher browser client
│   └── utils.ts                   # Helpers
├── types/index.ts                 # TypeScript types, MITRE data, themes
└── middleware.ts                  # Auth + subdomain routing
```

## Pricing Model (GBP)

| Plan | Price | Users | TTX/Month | Features |
|------|-------|-------|-----------|----------|
| Free | £0 | 5 | 3 | Individual mode, basic themes |
| Starter | £49/mo | 15 | 15 | + Group mode, all themes, export |
| Professional | £149/mo | 50 | 50 | + Custom scenarios, analytics |
| Enterprise | Custom | 500+ | Unlimited | + SSO, API, dedicated CSM |

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Database**: Neon PostgreSQL + Prisma ORM
- **Auth**: Clerk (multi-tenant, SSO-ready)
- **Real-time**: Pusher Channels
- **AI**: Anthropic Claude (Sonnet 4)
- **Billing**: Stripe (subscriptions)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS

## License

Proprietary. All rights reserved.

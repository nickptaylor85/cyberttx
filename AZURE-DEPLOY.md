# ThreatCast — Azure App Service Deployment

## Why Azure?
Vercel serverless functions kill background work after the response is sent.
AI generation takes 60-90 seconds. Azure App Service runs a persistent Node.js
server — no timeouts, no background task hacks, no dropped connections.

## Architecture
- **Azure App Service B1** (1 vCPU, 1.75GB RAM) — ~£10/mo
- **Neon PostgreSQL** (keep existing) — free tier
- **GitHub Actions** — CI/CD on push to main
- **Custom domain** — threatcast.io with managed SSL

## Step 1: Create Azure Resources (one-time, ~5 minutes)

### Option A: Azure Portal (GUI)
1. Go to https://portal.azure.com
2. Create Resource Group: `threatcast-rg` (UK South)
3. Create App Service Plan: `threatcast-plan` (Linux, B1)
4. Create Web App: `threatcast` (Node 20 LTS, Linux)

### Option B: Azure CLI (faster)
```bash
# Login
az login

# Create resource group
az group create --name threatcast-rg --location uksouth

# Create App Service plan (Linux, B1)
az appservice plan create \
  --name threatcast-plan \
  --resource-group threatcast-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --name threatcast \
  --resource-group threatcast-rg \
  --plan threatcast-plan \
  --runtime "NODE:20-lts"

# Set startup command
az webapp config set \
  --name threatcast \
  --resource-group threatcast-rg \
  --startup-file "node server.js"
```

## Step 2: Set Environment Variables

```bash
az webapp config appsettings set \
  --name threatcast \
  --resource-group threatcast-rg \
  --settings \
    NODE_ENV="production" \
    PORT="8080" \
    DATABASE_URL="postgresql://..." \
    AUTH_SECRET="..." \
    NEXTAUTH_URL="https://threatcast.io" \
    NEXTAUTH_SECRET="..." \
    ANTHROPIC_API_KEY="sk-ant-..." \
    RESEND_API_KEY="re_..." \
    CRON_SECRET="..." \
    SUPER_ADMIN_EMAILS="nickptaylor85@gmail.com" \
    PUSHER_APP_ID="..." \
    PUSHER_SECRET="..." \
    NEXT_PUBLIC_PUSHER_KEY="..." \
    NEXT_PUBLIC_PUSHER_CLUSTER="eu" \
    NEXT_PUBLIC_APP_DOMAIN="threatcast.io"
```

Copy the exact values from Vercel Environment Variables:
https://vercel.com/nickptaylor85s-projects/cyberttx/settings/environment-variables

## Step 3: Set Up GitHub Actions

1. In Azure Portal → Web App → Deployment Center → Get Publish Profile
2. Copy the XML content
3. In GitHub → repo Settings → Secrets → Actions → New secret:
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: (paste the XML)
4. Also add: `DATABASE_URL` as a secret (needed at build time for Prisma)

The workflow file is already at `.github/workflows/azure-deploy.yml`.
Push to `main` and it deploys automatically.

## Step 4: Custom Domain (threatcast.io)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name threatcast \
  --resource-group threatcast-rg \
  --hostname threatcast.io

# Enable managed SSL
az webapp config ssl bind \
  --name threatcast \
  --resource-group threatcast-rg \
  --certificate-thumbprint <auto> \
  --ssl-type SNI
```

### DNS Records (at your registrar)
```
Type    Name    Value
A       @       <App Service IP — shown in Azure Portal>
TXT     @       <Domain verification token — shown in Azure Portal>
CNAME   www     threatcast.azurewebsites.net
```

## Step 5: Verify

```bash
# Check it's running
curl https://threatcast.azurewebsites.net

# Check logs
az webapp log tail --name threatcast --resource-group threatcast-rg
```

## What Changes

| Feature | Vercel | Azure |
|---------|--------|-------|
| Generate endpoint | `after()` hacks, drops connections | Normal async handler, runs 90s, no issues |
| Cold starts | Every request (serverless) | None (always-on server) |
| Cron jobs | Vercel Cron (free) | Azure WebJobs or node-cron (in-process) |
| Static assets | Vercel CDN (fast) | Azure CDN or Cloudflare (add later) |
| Logs | Vercel dashboard | `az webapp log tail` or Azure Monitor |
| Cost | £16/mo (Pro) | ~£10/mo (B1) + £0 (Neon free tier) |

## Rollback
If anything goes wrong, Vercel is still connected to the repo.
Just re-enable the Vercel deployment in the Vercel dashboard.

## Monthly Cost Estimate
- App Service B1: ~£10
- Neon PostgreSQL: £0 (free tier, keep existing)
- Custom domain SSL: £0 (managed)
- GitHub Actions: £0 (free tier)
- **Total: ~£10/mo** (down from £16/mo Vercel Pro)

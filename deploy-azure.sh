#!/bin/bash
set -e

echo "═══════════════════════════════════════"
echo "  ThreatCast → Azure App Service"
echo "═══════════════════════════════════════"
echo ""

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found."
    echo "Install: pip install azure-cli"
    echo "Or: brew install azure-cli"
    exit 1
fi

# Check login
echo "🔐 Checking Azure login..."
az account show &>/dev/null || az login --use-device-code

RESOURCE_GROUP="threatcast-rg"
PLAN="threatcast-plan"
APP="threatcast-app"
LOCATION="uksouth"

echo ""
echo "📦 Step 1: Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION --output none

echo "📦 Step 2: Creating App Service plan (B1 Linux ~£10/mo)..."
az appservice plan create \
  --name $PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux \
  --output none

echo "📦 Step 3: Creating web app..."
az webapp create \
  --name $APP \
  --resource-group $RESOURCE_GROUP \
  --plan $PLAN \
  --runtime "NODE:20-lts" \
  --output none

echo "⚙️  Step 4: Configuring startup..."
az webapp config set \
  --name $APP \
  --resource-group $RESOURCE_GROUP \
  --startup-file "node server.js" \
  --output none

echo ""
echo "═══════════════════════════════════════"
echo "  ✅ Azure resources created!"
echo "═══════════════════════════════════════"
echo ""
echo "  App URL: https://${APP}.azurewebsites.net"
echo ""
echo "  NEXT STEPS:"
echo ""
echo "  1. Set your env vars (copy from Vercel):"
echo ""
echo "     az webapp config appsettings set \\"
echo "       --name $APP \\"
echo "       --resource-group $RESOURCE_GROUP \\"
echo "       --settings \\"
echo "         NODE_ENV=production \\"
echo "         DATABASE_URL=\"your_neon_url\" \\"
echo "         AUTH_SECRET=\"your_secret\" \\"
echo "         NEXTAUTH_SECRET=\"your_secret\" \\"
echo "         NEXTAUTH_URL=\"https://${APP}.azurewebsites.net\" \\"
echo "         ANTHROPIC_API_KEY=\"sk-ant-...\" \\"
echo "         RESEND_API_KEY=\"re_...\" \\"
echo "         CRON_SECRET=\"your_secret\" \\"
echo "         SUPER_ADMIN_EMAILS=\"nickptaylor85@gmail.com\" \\"
echo "         PUSHER_APP_ID=\"...\" \\"
echo "         PUSHER_SECRET=\"...\" \\"
echo "         NEXT_PUBLIC_PUSHER_KEY=\"...\" \\"
echo "         NEXT_PUBLIC_PUSHER_CLUSTER=\"eu\" \\"
echo "         NEXT_PUBLIC_APP_DOMAIN=\"${APP}.azurewebsites.net\""
echo ""
echo "  2. Deploy code:"
echo ""
echo "     az webapp deployment source config-local-git \\"
echo "       --name $APP --resource-group $RESOURCE_GROUP"
echo ""
echo "     # Or use ZIP deploy:"
echo "     npm run build"
echo "     cd .next/standalone"
echo "     cp -r ../.next/static .next/static"
echo "     cp -r ../../public public"
echo "     zip -r ../../deploy.zip ."
echo "     cd ../.."
echo "     az webapp deploy --name $APP \\"
echo "       --resource-group $RESOURCE_GROUP \\"
echo "       --src-path deploy.zip --type zip"
echo ""

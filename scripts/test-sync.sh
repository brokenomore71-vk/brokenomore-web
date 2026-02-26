#!/bin/bash

# Test Subscription Sync Endpoint
# This script tests the sync endpoint manually

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SYNC_URL="${SYNC_URL:-http://localhost:3000/api/razorpay/sync-subscriptions}"
SYNC_KEY="${SUBSCRIPTION_SYNC_KEY:-}"

echo -e "${YELLOW}🧪 Testing Subscription Sync Endpoint${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if URL is provided
if [ -z "$SYNC_URL" ]; then
    echo -e "${RED}❌ Error: SYNC_URL not set${NC}"
    echo "Usage: SYNC_URL=https://your-domain.com/api/razorpay/sync-subscriptions ./test-sync.sh"
    exit 1
fi

echo "📍 Endpoint: $SYNC_URL"
echo ""

# Check if sync key is provided
if [ -z "$SYNC_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: SUBSCRIPTION_SYNC_KEY not set${NC}"
    echo "   The endpoint may require authorization"
    echo ""
    AUTH_HEADER=""
else
    echo -e "${GREEN}✅ Authorization key found${NC}"
    echo ""
    AUTH_HEADER="-H \"Authorization: Bearer $SYNC_KEY\""
fi

# Make the request
echo "🚀 Sending POST request..."
echo ""

if [ -z "$SYNC_KEY" ]; then
    RESPONSE=$(curl -X POST "$SYNC_URL" \
        -H "Content-Type: application/json" \
        -d '{}' \
        -w "\nHTTP_STATUS:%{http_code}" \
        -s)
else
    RESPONSE=$(curl -X POST "$SYNC_URL" \
        -H "Authorization: Bearer $SYNC_KEY" \
        -H "Content-Type: application/json" \
        -d '{}' \
        -w "\nHTTP_STATUS:%{http_code}" \
        -s)
fi

# Extract HTTP status
HTTP_STATUS=$(echo "$RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check response
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Success! HTTP Status: $HTTP_STATUS${NC}"
    echo ""
    echo "📋 Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Error! HTTP Status: $HTTP_STATUS${NC}"
    echo ""
    echo "📋 Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Test completed successfully!${NC}"


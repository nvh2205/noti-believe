#!/bin/bash

# Script to test login API with Binance Wallet using curl
# Usage: 
# 1. Give execution permission: chmod +x test-auth-api-curl.sh
# 2. Run script: ./test-auth-api-curl.sh <wallet_address>

# Check input parameters
if [ -z "$1" ]; then
  echo "❌ Missing parameter: Ethereum wallet address"
  echo "Usage: ./test-auth-api-curl.sh <wallet_address>"
  exit 1
fi

# Configuration
API_URL="http://localhost:3000"
ADDRESS=$1

echo "🔍 Wallet address: $ADDRESS"

# Check server connection
echo "🔄 Checking server..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health")
if [ "$HEALTH_RESPONSE" != "200" ]; then
  echo "❌ Server is not available. Make sure the server is running."
  exit 1
fi
echo "✅ Server is running."

# Call API to get nonce
echo "🔄 Getting nonce..."
NONCE_URL="${API_URL}/auth/nonce?address=${ADDRESS}"
echo "🔗 URL: $NONCE_URL"

NONCE_RESPONSE=$(curl -s "$NONCE_URL")
echo "📡 Response: $NONCE_RESPONSE"

NONCE=$(echo $NONCE_RESPONSE | grep -o '"nonce":[0-9]*' | cut -d':' -f2)

if [ -z "$NONCE" ]; then
  echo "❌ Could not get nonce. Response from API:"
  echo $NONCE_RESPONSE
  exit 1
fi

echo "✅ Successfully got nonce: $NONCE"

echo "⚠️ You need to sign the following message with your wallet:"
MESSAGE="Sign this message to login with nonce: $NONCE"
echo "📝 $MESSAGE"

# Request signature
echo "🔑 Enter your signature:"
read SIGNATURE

if [ -z "$SIGNATURE" ]; then
  echo "❌ Signature cannot be empty"
  exit 1
fi

# Call login API
echo "🔄 Logging in..."
LOGIN_URL="${API_URL}/auth/login"
echo "🔗 URL: $LOGIN_URL"

LOGIN_PAYLOAD="{\"address\":\"${ADDRESS}\",\"signature\":\"${SIGNATURE}\"}"
echo "📦 Data: $LOGIN_PAYLOAD"

LOGIN_RESPONSE=$(curl -s -X POST \
  "$LOGIN_URL" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD")

echo "📡 Response: $LOGIN_RESPONSE"

# Check result
if echo $LOGIN_RESPONSE | grep -q "access_token"; then
  echo "✅ Login successful!"
  echo "🔑 Response from API:"
  echo $LOGIN_RESPONSE | jq . 2>/dev/null || echo $LOGIN_RESPONSE
else
  echo "❌ Login failed. Response from API:"
  echo $LOGIN_RESPONSE
fi 
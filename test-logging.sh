#!/bin/bash

echo "Testing API logging..."
echo ""
echo "Making registration request..."

curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Logging Test User",
    "email": "loggingtest'$(date +%s)'@example.com",
    "password": "Test123!"
  }' \
  -s | jq '.'

echo ""
echo "✅ Request completed!"
echo ""
echo "Check your terminal running 'pnpm start-dev' for logs like:"
echo "  @auth/api:dev: [timestamp] INFO: request completed"
echo "  @auth/worker:dev: [timestamp] INFO: Verification email sent"

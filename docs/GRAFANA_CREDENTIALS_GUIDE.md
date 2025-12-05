# Grafana Cloud Loki Credentials Guide

## How to Verify Your Credentials

### Step 1: Check Your Current Credentials

Run this command to see what's in your `.env`:
```bash
grep GRAFANA_LOKI .env
```

You should see:
```
GRAFANA_LOKI_URL=https://logs-prod-XXX.grafana.net
GRAFANA_LOKI_USER=123456
GRAFANA_LOKI_API=glc_xxxxxxxxxxxxx
```

### Step 2: Test Credentials with curl

```bash
# Load environment variables
source .env

# Test the connection
curl -X POST "${GRAFANA_LOKI_URL}/loki/api/v1/push" \
  -H "Content-Type: application/json" \
  -u "${GRAFANA_LOKI_USER}:${GRAFANA_LOKI_API}" \
  -d '{
    "streams": [{
      "stream": {"app": "test"},
      "values": [["'$(date +%s%N)'", "test log"]]
    }]
  }'
```

**Expected Results:**
- ✅ **Success**: No output or empty `{}` response
- ❌ **401/403**: `{"message":"invalid username or password"}` - Credentials are wrong
- ❌ **404**: `404 page not found` - URL is wrong
- ❌ **Timeout**: Network/firewall issue

## How to Get New Credentials

### Option 1: From Grafana Cloud UI

1. **Go to Grafana Cloud**:
   - Visit https://grafana.com/
   - Log in to your account

2. **Navigate to Loki**:
   - Click on your stack name
   - Go to "Connections" or "Data Sources"
   - Find "Loki" in the list

3. **Get Connection Details**:
   - Click "Details" or "Configure"
   - You'll see:
     - **URL**: `https://logs-prod-XXX.grafana.net`
     - **User / Instance ID**: A number like `123456`
     - **API Key**: Click "Generate now" if you don't have one

4. **Create API Key** (if needed):
   - Go to "Security" → "API Keys" or "Access Policies"
   - Click "Create API key"
   - Name: `loki-api-key`
   - Role: `MetricsPublisher` or `Editor`
   - Copy the generated key (starts with `glc_`)

### Option 2: Using Grafana Cloud CLI

```bash
# Install Grafana Cloud CLI
brew install grafana/grafana/grafana-cloud-cli

# Login
grafana-cloud login

# Get Loki details
grafana-cloud stacks list
grafana-cloud loki show
```

## Update Your .env File

Once you have the credentials, update your `.env`:

```bash
# Loki Configuration
GRAFANA_LOKI_URL=https://logs-prod-028.grafana.net
GRAFANA_LOKI_USER=123456
GRAFANA_LOKI_API=glc_eyJrIjoixxxxxxxxxxxxxxx
```

**Important Notes:**
- ⚠️ Do NOT include `/loki/api/v1/push` in the URL - the library adds it automatically
- ⚠️ The API key should start with `glc_`
- ⚠️ The user is typically a numeric ID

## Common Issues

### Issue: "invalid username or password"
**Solution**: Your API key or user ID is incorrect. Generate a new API key.

### Issue: "404 not found"
**Solution**: Your URL is wrong. Check the Grafana Cloud dashboard for the correct URL.

### Issue: Connection timeout
**Solutions**:
- Check if you're behind a firewall/VPN
- Verify the URL is correct
- Try from a different network

### Issue: "pino-loki" JSON parsing error
**Solution**: This is a known compatibility issue with `pino-loki@2.6.0`. Even with correct credentials, you may see:
```
loghttp.PushRequest.Streams: unmarshalerDecoder: Value looks like Number/Boolean/None
```

This is NOT a credential issue - it's a library bug. Use Grafana Agent instead (see next section).

## Recommended Solution: Use Grafana Agent

Instead of fighting with `pino-loki`, use Grafana Agent:

```bash
# Install Grafana Agent
wget -q -O - https://apt.grafana.com/gpg.key | sudo apt-key add -
sudo add-apt-repository "deb https://apt.grafana.com stable main"
sudo apt-get update
sudo apt-get install grafana-agent

# Or using Docker
docker run -v /path/to/config.yaml:/etc/agent/agent.yaml grafana/agent
```

**Benefits**:
- ✅ Battle-tested, production-ready
- ✅ No JSON format issues
- ✅ Handles logs, metrics, AND traces
- ✅ Works with any log format

I can help you set up Grafana Agent if you'd like!

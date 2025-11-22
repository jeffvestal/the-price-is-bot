# Instruqt Secrets Setup Guide

## Issue Found
Instruqt secrets were not being properly exported as environment variables, causing:
- ❌ Remote ES URL not available
- ❌ Access code validation failing
- ❌ Docker registry login failing

## Solution Implemented

Updated `setup-host-1` to use `agent variable set` to register Instruqt secrets as runtime variables.

### What Changed (Lines 36-86)

```bash
# 1. Hardcoded values - register as runtime variables
export PROJECT="elastic-customer-eng"
export ADMIN_TOKEN="..."
export SECRET_KEY="..."

agent variable set PROJECT "$PROJECT"
agent variable set ADMIN_TOKEN "$ADMIN_TOKEN"
agent variable set SECRET_KEY "$SECRET_KEY"

# 2. Instruqt secrets - register as runtime variables
if [[ -n "${price_is_bot_remote_es_url:-}" ]]; then
  export REMOTE_ES_URL="$price_is_bot_remote_es_url"
  agent variable set REMOTE_ES_URL "$REMOTE_ES_URL"
  echo "  - REMOTE_ES_URL: set"
fi

# Similar for price_is_bot_remote_es_key and price_is_bot_docker_key
```

## How It Works

1. **Check if secret exists** using `${price_is_bot_secret_name:-}`
2. **Export locally** for current script: `export REMOTE_ES_URL="$price_is_bot_remote_es_url"`
3. **Register globally** with Instruqt: `agent variable set REMOTE_ES_URL "$REMOTE_ES_URL"`
4. **Log status** for debugging
5. **Validate** required vars before proceeding

## Required Instruqt Secrets

Make sure these are configured in your Instruqt track settings:

| Secret Name (lowercase) | Purpose | Example Value |
|------------------------|---------|---------------|
| `price_is_bot_remote_es_url` | Leaderboard Elasticsearch URL | `https://cluster.es.us-east-1.aws.elastic.cloud:443` |
| `price_is_bot_remote_es_key` | API key for remote ES | `base64encodedkey==` |
| `price_is_bot_docker_key` | GCP service account JSON (base64) | `eyJ0eXBlIjoi...` |

## Verify Secrets in Instruqt

### Option 1: Instruqt UI
1. Go to track settings → Secrets
2. Ensure all three secrets are created (team-level)
3. Names must be **lowercase** with underscores

### Option 2: Command Line
```bash
# List all secrets for your track
instruqt track secrets list

# Add a secret (if missing)
instruqt track secret create price_is_bot_remote_es_url "https://your-cluster.es.cloud:443"
```

## Testing in Sandbox

After pushing the updated track:

```bash
# On host-1 terminal:

# 1. Check if secrets were registered
env | grep -E 'REMOTE_ES|AR_KEY'

# Should see:
# REMOTE_ES_URL=https://...
# REMOTE_ES_API_KEY=...
# AR_KEY_B64=...

# 2. Test leaderboard API
curl http://localhost:8082/

# 3. Check backend logs
docker logs $(docker ps -q -f name=backend)

# 4. Try access code validation
curl -X POST http://localhost:8081/api/validate-code \
  -H "Content-Type: application/json" \
  -d '{"access_code":"BOB-BELCHER","player_name":"Test","player_email":"test@test.com"}'
```

## Troubleshooting

### If secrets still not showing up:

1. **Check setup logs:**
   ```bash
   cat /var/log/instruqt-track-setup-host-1.log | grep -A5 "Registering secret"
   ```

2. **Verify secrets exist:**
   ```bash
   echo "price_is_bot_remote_es_url: ${price_is_bot_remote_es_url:-NOT SET}"
   ```

3. **Manual export (temporary workaround):**
   ```bash
   export REMOTE_ES_URL="https://your-cluster:443"
   export REMOTE_ES_API_KEY="your-key"
   
   # Restart containers
   cd /opt/price-is-bot
   docker compose down
   docker compose up -d
   ```

### Common Issues:

- **Secret names are case-sensitive** - must be lowercase with underscores
- **Secrets are team-level** - make sure they're shared with your track
- **Base64 encoding** - Docker key must be base64 encoded JSON

## Benefits of This Approach

✅ **Explicit registration** - Uses `agent variable set` for clarity
✅ **Better logging** - Shows which secrets are loaded
✅ **Graceful handling** - Checks if secrets exist before using
✅ **Runtime availability** - Variables accessible across challenges
✅ **Debugging friendly** - Clear error messages

## Next Steps

1. Push updated track: `instruqt track push`
2. Launch new sandbox
3. Check host-1 setup logs for "Registering secret runtime variables..."
4. Verify env vars: `env | grep REMOTE_ES`
5. Test access code validation







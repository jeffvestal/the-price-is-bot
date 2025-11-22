# Instruqt Track Setup Summary - The Price is Bot

## ✅ Completed

### 1. Track Scripts Updated
Both `track_scripts/setup-host-1` and `track_scripts/setup-kubernetes-vm` have been configured with:

#### Using OOTB Instruqt Variables:
- `ELASTICSEARCH_URL` / `ELASTICSEARCH_URL_LOCAL`
- `ELASTICSEARCH_APIKEY`
- `KIBANA_URL_UI`
- `LLM_PROXY_URL`
- `LLM_APIKEY`

#### Hardcoded Values (Registered as Runtime Variables):
- `PROJECT` = `elastic-customer-eng`
- `ADMIN_TOKEN` = `f17bd5277efe588bbc19818df0f039a1d388fdfc622a4d8b738010a2d1af7403`
- `SECRET_KEY` = `50bb198964ddd28183d4f4a3a2af7aac2e628a2aeaf3c5a39a9e0098b50fb795`

#### From Instruqt Secrets (You Created):
- `PRICE_IS_BOT_REMOTE_ES_URL` → leaderboard ES URL
- `PRICE_IS_BOT_REMOTE_ES_KEY` → leaderboard ES API key
- `PRICE_IS_BOT_DOCKER_KEY` → base64-encoded GCP service account JSON

### 2. Track Structure
```
instruqt/the-price-is-bot/
├── 01-rules/
│   └── assignment.md
├── 02-agent-builder-overview/
│   └── assignment.md
├── 03-play-the-game/
│   └── assignment.md
├── track_scripts/
│   ├── setup-host-1
│   └── setup-kubernetes-vm
├── config.yml
└── track.yml
```

## 📋 What Happens During Track Setup

### kubernetes-vm (Elasticsearch & Kibana):
1. `/opt/workshops/elastic-start.sh` starts ES and Kibana
2. Waits for Elasticsearch to be ready
3. Restores grocery data snapshot using `/opt/workshops/elastic-snapshot.sh`:
   - Base path: `the_price_is_bot`
   - Bucket: `instruqt-workshop-snapshot-public`
   - Client: `sa`
   - Repository: `repo1`
   - Snapshot: `grocery-data-snapshot`
4. ES available at: `http://kubernetes-vm:30920`
5. Kibana available at: `http://kubernetes-vm:30001`

### host-1 (Docker Containers):
1. Fetches OOTB environment variables from kubernetes-vm via curl
2. Exports Instruqt secrets (remote ES, Docker registry key)
3. Waits for ES and Kibana on kubernetes-vm to be ready
4. Logs into GCP Artifact Registry using base64-decoded service account key
5. Creates `docker-compose.yml` in `/opt/price-is-bot/` with OOTB vars:
   - Uses `ELASTICSEARCH_URL` (points to kubernetes-vm:30920)
   - Uses `ELASTICSEARCH_APIKEY`
   - Uses `KIBANA_URL_UI` (points to kubernetes-vm:30001)
6. Pulls Docker images:
   - `us-central1-docker.pkg.dev/elastic-customer-eng/price-is-bot/backend:latest`
   - `us-central1-docker.pkg.dev/elastic-customer-eng/price-is-bot/leaderboard-api:latest`
   - `us-central1-docker.pkg.dev/elastic-customer-eng/price-is-bot/game-ui:latest`
7. Starts all services with docker compose
8. Verifies health endpoints
9. Services available at:
   - Game UI: `http://host-1:8080`
   - Backend: `http://host-1:8081`
   - Leaderboard: `http://host-1:8082`
10. TODO: Deploy agents and tools to Agent Builder on kubernetes-vm

## 🚀 Next Steps

### 1. Snapshot Your Data
Create the snapshot in your source Elasticsearch cluster:
```json
PUT /_snapshot/instruqt-write_the-price-is-bot/grocery-data-snapshot
{
  "indices": "grocery_items,stores,inventory,seasonal_availability,promotions,nutrition,recipes",
  "ignore_unavailable": true,
  "include_global_state": false,
  "metadata": {
    "taken_by": "admin",
    "taken_because": "Initial grocery data for Instruqt track"
  }
}
```

### 2. Deploy Agents/Tools
Update `track_scripts/setup-host-1` at line 75-78 to deploy your Agent Builder agents and tools.

### 3. Configure Tabs in Instruqt UI
For Challenge 3 ("play-the-game"), add these tabs:
- **Game UI**: `http://kubernetes-vm:8080`
- **Backend**: `http://kubernetes-vm:8081`
- **Leaderboard**: `http://kubernetes-vm:8082`
- **Kibana**: `http://kubernetes-vm:30001`

### 4. Validate and Push
```bash
cd /Users/jeffvestal/repos/grocery/the-price-is-bot/instruqt/the-price-is-bot
instruqt track validate
instruqt track push
```

## 🔐 Secrets Reference

| Secret Name | Description | Value Location |
|-------------|-------------|----------------|
| `PRICE_IS_BOT_REMOTE_ES_URL` | Remote ES for leaderboard | `https://the-price-is-bot-d08766.es.us-east-1.aws.elastic.cloud:443` |
| `PRICE_IS_BOT_REMOTE_ES_KEY` | API key for remote ES | (from your cluster) |
| `PRICE_IS_BOT_DOCKER_KEY` | GCP service account JSON (base64) | `/Users/jeffvestal/Elastic/ar-key-base64.txt` |

## 📊 Architecture

```
┌─────────────────────────────────────────────────┐
│  Instruqt Sandbox                               │
├─────────────────────────────────────────────────┤
│                                                 │
│  kubernetes-vm             host-1               │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │ Elasticsearch│◄────────┤ Backend :8081   │  │
│  │ :30920       │         │ (Docker)        │  │
│  │              │         └─────────────────┘  │
│  │ Kibana       │         ┌─────────────────┐  │
│  │ :30001       │         │ Leaderboard     │  │
│  │              │         │ :8082           │──┼──► Remote ES
│  │ [Grocery     │         │ (Docker)        │  │   (Leaderboard)
│  │  Data        │         └─────────────────┘  │
│  │  Snapshot]   │         ┌─────────────────┐  │
│  │              │         │ Game UI :8080   │  │
│  └──────────────┘         │ (Docker)        │  │
│                           └─────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 🎮 Game Flow

1. **Challenge 1**: User acknowledges rules
2. **Challenge 2**: User explores Agent Builder in Kibana (data already loaded)
3. **Challenge 3**: User plays the game
   - Option A: Enter token → eligible for prizes
   - Option B: Play without token → ineligible (TODO: implement in UI)

## ⚠️ Known TODOs

1. Deploy agents/tools script in `setup-host-1` (line 75-78)
2. Implement two-path gate in `AccessCodeForm.tsx` (token vs play-only)
3. Verify snapshot restore parameters match your GCS bucket setup


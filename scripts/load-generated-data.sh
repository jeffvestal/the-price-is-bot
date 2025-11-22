#!/usr/bin/env bash
set -euo pipefail

# Load existing generated grocery data into an Elasticsearch cluster
# - Deletes indices if they exist
# - Creates correct mappings
# - Loads JSON array, NDJSON docs, or NDJSON with action lines
#
# Required environment variables:
#   ES_URL      e.g. https://your-es.es.io:443
#   ES_API_KEY  Elasticsearch API key
# Optional:
#   DATA_DIR    Directory containing generated files (defaults to elastic-grocery-core/generated_data)

if [[ -z "${ES_URL:-}" || -z "${ES_API_KEY:-}" ]]; then
  echo "❌ Please set ES_URL and ES_API_KEY"
  echo "   export ES_URL='https://your-es.es.io:443'"
  echo "   export ES_API_KEY='...'"
  exit 1
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default DATA_DIR resolves to elastic-grocery-core/generated_data next to project root
DEFAULT_DATA_DIR="$(cd "$PROJECT_ROOT/../elastic-grocery-core/generated_data" 2>/dev/null && pwd || true)"
DATA_DIR="${DATA_DIR:-$DEFAULT_DATA_DIR}"

if [[ -z "$DATA_DIR" || ! -d "$DATA_DIR" ]]; then
  echo "❌ DATA_DIR not found. Set DATA_DIR=/path/to/generated_data and rerun."
  exit 1
fi

auth=(-H "Authorization: ApiKey ${ES_API_KEY}")
info() { echo "[load] $*"; }

delete_if_exists() {
  local index="$1"
  http=$(curl -s -o /dev/null -w "%{http_code}" "${auth[@]}" -X GET "$ES_URL/$index")
  if [[ "$http" == "200" ]]; then
    info "Deleting existing index: $index"
    curl -s "${auth[@]}" -X DELETE "$ES_URL/$index" >/dev/null
  fi
}

create_index_with_mapping() {
  local index="$1" body="$2"
  info "Creating index: $index"
  curl -s "${auth[@]}" -H 'Content-Type: application/json' -X PUT "$ES_URL/$index" -d "$body" >/dev/null
}

bulk_load() {
  local index="$1" file="$2"
  if [[ ! -f "$file" ]]; then
    return 1
  fi
  info "Loading $file -> $index"

  local first_line
  first_line=$(head -n1 "$file" || true)
  # If NDJSON with action lines
  if [[ "$first_line" =~ ^\{\"index\" ]]; then
    curl -s "${auth[@]}" -H 'Content-Type: application/x-ndjson' \
      -X POST "$ES_URL/_bulk?refresh=true" --data-binary @"$file" >/dev/null
    return 0
  fi

  # JSON array?
  if jq -e 'type == "array"' "$file" >/dev/null 2>&1; then
    jq -c '.[]' "$file" | awk -v idx="$index" '{print "{\"index\":{\"_index\":\""idx"\"}}"; print $0}' \
      | curl -s "${auth[@]}" -H 'Content-Type: application/x-ndjson' \
        -X POST "$ES_URL/_bulk?refresh=true" --data-binary @- >/dev/null
    return 0
  fi

  # NDJSON docs (one JSON per line)
  awk -v idx="$index" '{print "{\"index\":{\"_index\":\""idx"\"}}"; print $0}' "$file" \
    | curl -s "${auth[@]}" -H 'Content-Type: application/x-ndjson' \
      -X POST "$ES_URL/_bulk?refresh=true" --data-binary @- >/dev/null
}

info "ES: $ES_URL"
info "DATA_DIR: $DATA_DIR"

# 1) Delete existing indices (if present)
for idx in grocery_items store_inventory store_locations seasonal_availability nutrition_facts game_settings; do
  delete_if_exists "$idx"
done

# 2) Create indices with mappings used by tools/agents
create_index_with_mapping "grocery_items" '{
  "settings":{"number_of_shards":1},
  "mappings":{"properties":{
    "item_id":{"type":"keyword"},
    "name":{"type":"text","fields":{"keyword":{"type":"keyword"}}},
    "brand":{"type":"keyword"},
    "category":{"type":"keyword"},
    "unit_size":{"type":"keyword"},
    "organic":{"type":"boolean"},
    "gluten_free":{"type":"boolean"},
    "vegan":{"type":"boolean"},
    "description":{"type":"text"},
    "tags":{"type":"text"}
  }}
}'

create_index_with_mapping "store_locations" '{
  "settings":{"number_of_shards":1},
  "mappings":{"properties":{
    "store_id":{"type":"keyword"},
    "store_name":{"type":"text","fields":{"keyword":{"type":"keyword"}}},
    "chain":{"type":"keyword"},
    "chain_tier":{"type":"keyword"},
    "city":{"type":"keyword"},
    "state":{"type":"keyword"}
  }}
}'

create_index_with_mapping "store_inventory" '{
  "settings":{"number_of_shards":1},
  "mappings":{"properties":{
    "item_id":{"type":"keyword"},
    "store_id":{"type":"keyword"},
    "on_sale":{"type":"boolean"},
    "sale_price":{"type":"double"},
    "current_price":{"type":"double"},
    "stock_status":{"type":"keyword"},
    "stock_level":{"type":"integer"}
  }}
}'

create_index_with_mapping "seasonal_availability" '{
  "settings":{"number_of_shards":1},
  "mappings":{"properties":{
    "item_id":{"type":"keyword"},
    "season":{"type":"keyword"},
    "description":{"type":"text"},
    "availability_score":{"type":"double"},
    "price_multiplier":{"type":"double"}
  }}
}'

create_index_with_mapping "nutrition_facts" '{
  "settings":{"number_of_shards":1},
  "mappings":{"properties":{
    "item_id":{"type":"keyword"},
    "calories":{"type":"integer"},
    "protein":{"type":"double"},
    "total_carbs":{"type":"double"},
    "vegan":{"type":"boolean"},
    "gluten_free":{"type":"boolean"},
    "organic":{"type":"boolean"},
    "ingredients":{"type":"text"}
  }}
}'

# 3) Seed game_settings (safe upsert)
curl -s "${auth[@]}" -H 'Content-Type: application/json' \
  -X PUT "$ES_URL/game_settings/_doc/settings" -d '{"target_price":100,"time_limit":300,"max_podiums":5}' >/dev/null
info "Upserted game_settings"

# 4) Load data files from DATA_DIR (try ndjson first, then json)
loaded=false
bulk_load "grocery_items"         "$DATA_DIR/grocery_items.ndjson"         && loaded=true || true
bulk_load "grocery_items"         "$DATA_DIR/grocery_items.json"           && loaded=true || true
bulk_load "store_locations"       "$DATA_DIR/store_locations.ndjson"       && loaded=true || true
bulk_load "store_locations"       "$DATA_DIR/store_locations.json"         && loaded=true || true
bulk_load "store_inventory"       "$DATA_DIR/store_inventory.ndjson"       && loaded=true || true
bulk_load "store_inventory"       "$DATA_DIR/store_inventory.json"         && loaded=true || true
bulk_load "seasonal_availability" "$DATA_DIR/seasonal_availability.ndjson" && loaded=true || true
bulk_load "seasonal_availability" "$DATA_DIR/seasonal_availability.json"   && loaded=true || true
bulk_load "nutrition_facts"       "$DATA_DIR/nutrition_facts.ndjson"       && loaded=true || true
bulk_load "nutrition_facts"       "$DATA_DIR/nutrition_facts.json"         && loaded=true || true

info "Done. Verify counts:"
curl -s "${auth[@]}" "$ES_URL/_cat/indices/grocery_items,store_inventory,store_locations,seasonal_availability,nutrition_facts,game_settings?v"

if [[ "$loaded" == false ]]; then
  echo "⚠️  No data files were found in $DATA_DIR. Set DATA_DIR to your generated_data path and rerun."
fi





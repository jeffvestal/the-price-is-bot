# Vegas Local Expert Agent Update

## Problem
Vegas Local Expert was providing items in chat text format (hallucinating from its knowledge), but the UI couldn't parse them to show **Add buttons** because there was no structured tool result data.

## Root Cause
1. Agent was searching for generic terms like "Las Vegas local favorites"
2. Tools returned 0 results
3. Agent compensated by generating text-based items (helpful but not parseable)
4. UI's `extractSuggestedItemsFromSteps()` only works with structured tabular data from tools

## Solution
Added `find_budget_items` tool to Vegas Local Expert's toolkit.

### Why This Works
- `find_budget_items` returns structured data with items in $15-25 range
- UI can parse this data and display Add buttons
- Agent still maintains its unique Vegas personality and communication style

## Changes Made

### 1. Added Tool to Agent
**Before:**
```json
"tools": [
  "seasonal_recommendations",
  "platform.core.execute_esql",
  "search_grocery_items",
  "check_store_inventory",
  "find_deals",
  "platform.core.search"
]
```

**After:**
```json
"tools": [
  "seasonal_recommendations",
  "platform.core.execute_esql",
  "search_grocery_items",
  "check_store_inventory",
  "find_deals",
  "find_budget_items",  // ✅ ADDED
  "platform.core.search"
]
```

### 2. Updated Instructions (Previous Change)
Made Vegas Local Expert more action-oriented:
- Provides items immediately when asked
- Still asks clarifying questions conversationally
- Keeps Vegas personality and insider tips
- Prioritizes showing items over endless conversation

## Agent Differentiation

### Budget Master vs Vegas Local Expert

Even with the same `find_budget_items` tool, they remain **very different**:

| Aspect | Budget Master | Vegas Local Expert |
|--------|--------------|-------------------|
| **Focus** | Price optimization, deals, savings | Vegas stores, local favorites, insider tips |
| **Communication** | "This is $2.50 cheaper than Store B" | "Locals love this spot on Flamingo Rd" |
| **Information** | Unit pricing, savings calculations | Store locations, Vegas neighborhoods |
| **Personality** | Practical deal-hunter | Vegas native with local pride |
| **Unique Tool** | None (all shared) | `seasonal_recommendations` |

**Shared tools** like `find_budget_items` are utility tools - the personality and communication style make them unique.

## Testing

### Before (No Add Buttons)
```bash
Request: "give me 5 items for my cart"
Response: Text-based Vegas items (beautiful but unparseable)
Result: ❌ No Add buttons, items can't be added to cart
```

### After (With Add Buttons)
```bash
Request: "give me 5 items for my cart"
Tool Calls:
  - find_budget_items: 15 results ✅
  - search_grocery_items: 20 results ✅
Response: Vegas items with full details
Result: ✅ Add buttons appear, items can be added to cart
```

## Verification

```bash
export KIBANA_URL=https://your-cluster.kb.cloud.es.io
export KIBANA_API_KEY=your_key

# Test Vegas Local Expert
curl -s "${KIBANA_URL}/api/agent_builder/converse" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "local_expert",
    "input": "give me 5 items"
  }' | jq '.steps[] | select(.type == "tool_call") | {tool: .tool_id, results: .results[1].data.values | length}'
```

Expected output:
```json
{"tool": "find_budget_items", "results": 15}
{"tool": "search_grocery_items", "results": 20}
```

## Files Updated

1. **Agent Definition in Kibana**
   - Added `find_budget_items` to tool list
   
2. **`canonical-definitions/agents.json`**
   - Updated with new tool configuration
   - Ensures future deployments include this tool

## UI Behavior

Now when users ask Vegas Local Expert for items:

1. ✅ Agent calls `find_budget_items` (returns structured data)
2. ✅ Frontend `extractSuggestedItemsFromSteps()` parses the data
3. ✅ UI displays items with Add buttons
4. ✅ Users can click Add to put items in their bags
5. ✅ Game proceeds normally with full functionality

## Long-Term Benefits

- **Robust**: Works reliably with structured data, not text parsing
- **Maintainable**: Standard tool usage across agents
- **Scalable**: Easy to add more tools without breaking item extraction
- **User-Friendly**: Consistent Add button experience across all agents

---

**Status:** ✅ Complete  
**Deployed:** 2025-10-08  
**Canonical Definitions:** Updated


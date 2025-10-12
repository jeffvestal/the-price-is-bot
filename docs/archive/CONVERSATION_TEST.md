# Multi-Turn Conversation Test

## What Was Fixed

### Problem
- `conversation_id` was not being tracked across messages
- Every message started a new conversation
- Agents couldn't remember previous context or build on clarifying answers

### Solution Implemented

#### Backend (`game-ui/src/app/api/agent-chat/route.ts`)
1. ✅ Accept `conversationId` from frontend in request body
2. ✅ Include it in Agent Builder API payload when present
3. ✅ Return `conversationId` in the completion event

#### Frontend (`game-ui/src/components/AgentChatInterface.tsx`)
1. ✅ Added `conversationId` state variable
2. ✅ Send `conversationId` in all agent-chat requests
3. ✅ Store `conversationId` from completion events
4. ✅ Clear `conversationId` when agent changes or session resets

## How to Test

### 1. Start the Game UI
```bash
cd game-ui
npm run dev
# Navigate to http://localhost:3000
```

### 2. Test Multi-Turn Conversation

**Step 1:** Use access code `bob-belcher`

**Step 2:** Select **Vegas Local Expert** agent

**Step 3:** Send an ambiguous message:
```
I need help shopping
```

**Expected Result:** Agent responds with clarifying questions asking what you want

**Step 4:** Send a follow-up message:
```
I want items around $20 each
```

**Expected Result:** Agent remembers the context and provides items around $20

### 3. Verify in Console

Open browser DevTools console and look for these logs:

**First message:**
```
🆕 Starting new conversation
💬 Storing conversation_id: <some-uuid>
```

**Second message:**
```
🔗 Continuing conversation: <same-uuid>
💬 Storing conversation_id: <same-uuid>
```

### 4. Test Conversation Reset

**Change agents** or **start a new game** and verify:
```
🔄 Agent or session changed - clearing conversation
```

## API Test (Command Line)

### Test 1: Start Conversation
```bash
export KIBANA_URL=https://elasti-cart-b92fb1.kb.us-east-1.aws.elastic.cloud
export KIBANA_API_KEY=your_api_key

curl -s "${KIBANA_URL}/api/agent_builder/converse" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "local_expert",
    "input": "I need help shopping"
  }' | jq '{conversation_id, message: .response.message}'
```

Save the `conversation_id` from the response.

### Test 2: Continue Conversation
```bash
CONV_ID="<paste-conversation-id-here>"

curl -s "${KIBANA_URL}/api/agent_builder/converse" \
  -H "Authorization: ApiKey ${KIBANA_API_KEY}" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"local_expert\",
    \"conversation_id\": \"$CONV_ID\",
    \"input\": \"I want items around 20 dollars each\"
  }" | jq '{conversation_id, message: .response.message}'
```

✅ **Verify:** The `conversation_id` should be the same in both responses.

## Expected Behavior

### ✅ What Should Work
1. Agent asks clarifying questions
2. User responds to clarifications
3. Agent builds on previous context
4. Conversation flows naturally across multiple turns
5. Each agent can have its own conversational style

### 🎯 Agent-Specific Behavior

- **Budget Master**: Usually provides immediate results (has `find_budget_items` tool)
- **Vegas Local Expert**: More conversational, gathers preferences
- **Health Guru**: May ask about dietary restrictions
- **Gourmet Chef**: May ask about meal themes or cuisine preferences
- **Speed Shopper**: Focuses on quick, popular items

### ⚠️ When Conversations Reset
- When agent changes
- When game session changes
- When page is refreshed (state is not persisted)

## Verification Checklist

- [ ] First message creates a new conversation_id
- [ ] Second message uses the same conversation_id
- [ ] Agent remembers context from previous messages
- [ ] Changing agents clears the conversation
- [ ] Starting a new game clears the conversation
- [ ] Console logs show conversation tracking

## Known Behavior

**Agent responses are non-deterministic.** Sometimes Vegas Local Expert will:
- Provide items immediately (especially for specific requests)
- Ask clarifying questions (especially for vague requests)

This is **expected behavior** and part of the AI's natural language understanding.

## Files Modified

1. `game-ui/src/app/api/agent-chat/route.ts`
   - Accept and forward `conversationId`
   - Return `conversationId` in completion event

2. `game-ui/src/components/AgentChatInterface.tsx`
   - Store `conversationId` in state
   - Send `conversationId` in requests
   - Clear on agent/session change

---

**Status:** ✅ Implementation Complete  
**Last Updated:** 2025-10-08  
**Tested:** API level verified, UI testing ready


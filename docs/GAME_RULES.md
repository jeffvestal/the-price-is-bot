# Maximum Items Per Bag Rule

**Date:** October 8, 2025  
**Rule:** Maximum 5 items per bag

## Problem

Players were able to exploit the game by adding large quantities of cheap items (e.g., 25x $1 item = $25) instead of strategically selecting diverse items. This made reaching exactly $100 too easy and defeated the challenge.

## Solution

Implemented a **maximum of 5 items per bag** rule across all game systems.

### Why 5 Items?
- ✅ Forces variety and strategic thinking
- ✅ Still flexible for reasonable quantities (2-3 eggs, 4 bottles of water)
- ✅ Maintains game challenge
- ✅ Realistic grocery shopping behavior
- ✅ Can't spam cheap items (5x $1 = only $5)

### Why Not 10 Items?
- ❌ 10x $1 = still only $10 (too easy)
- ❌ Feels more like bulk/wholesale than grocery shopping
- ❌ Doesn't prevent the exploit effectively

## Implementation

### 1. Frontend State Management (`gameStore.ts`)

**Location:** `game-ui/src/store/gameStore.ts`

```typescript
addItem: (item) => {
  const state = get();
  const existingItem = state.currentItems.find(i => i.name === item.name);
  
  if (existingItem) {
    // Check if adding would exceed max per bag
    const newQuantity = existingItem.quantity + item.quantity;
    if (newQuantity > 5) {
      return { success: false, message: 'Maximum 5 items per bag!', isNewItem: false };
    }
    // ... update quantity
  }
  
  // Check if initial quantity exceeds max
  if (item.quantity > 5) {
    return { success: false, message: 'Maximum 5 items per bag!', isNewItem: true };
  }
  // ... add item
}
```

**Enforcement:**
- Prevents adding items if quantity would exceed 5
- Returns error message to user
- Validates both new items and quantity updates

### 2. Shopping Cart UI (`ShoppingCart.tsx`)

**Location:** `game-ui/src/components/ShoppingCart.tsx`

```typescript
const handleQuantityChange = (itemId: string, change: number) => {
  const item = currentItems.find(i => i.id === itemId);
  if (item) {
    const newQuantity = Math.max(0, Math.min(5, item.quantity + change));
    updateItemQuantity(itemId, newQuantity);
  }
};
```

**UI Changes:**
- Clamps quantity between 0 and 5
- Disables "+" button when quantity reaches 5
- Prevents manual override

```tsx
<Button
  onClick={() => handleQuantityChange(bag.item!.id, 1)}
  disabled={bag.item!.quantity >= 5}
>
  <Plus className="h-3 w-3" />
</Button>
```

### 3. Validation Display (`page.tsx`)

**Location:** `game-ui/src/app/page.tsx`

```typescript
const hasOverMaxItems = currentItems.some(item => item.quantity > 5);
const isInvalid = isOverBudget || isWrongBagCount || hasOverMaxItems;

if (isInvalid) {
  return (
    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-xs text-red-600 font-medium mb-1">⚠️ Invalid Game - Score will be 0:</div>
      <div className="text-xs text-red-500 space-y-1">
        {isWrongBagCount && <div>• Need exactly 5 bags (currently {uniqueItems})</div>}
        {isOverBudget && <div>• Over budget: ${totalPrice.toFixed(2)} > $100.00</div>}
        {hasOverMaxItems && <div>• Max 5 items per bag (some bags exceed limit)</div>}
      </div>
    </div>
  );
}
```

**User Feedback:**
- Real-time validation in submit button section
- Clear error message if any bag exceeds 5 items
- Prevents game submission with invalid state

### 4. Backend Scoring (`leaderboard/route.ts`)

**Location:** `game-ui/src/app/api/leaderboard/route.ts`

```typescript
// Rule 3: Maximum 5 items per bag
if (items && items.some((item: any) => item.quantity > 5)) {
  const violatingItems = items.filter((item: any) => item.quantity > 5);
  console.log(`❌ Score = 0: Items exceed max per bag (5 max):`, 
    violatingItems.map((i: any) => `${i.name}: ${i.quantity}`));
  finalScore = 0;
}
```

**Backend Validation:**
- Validates on score submission
- Sets score to 0 if any bag exceeds 5 items
- Logs violation for debugging
- Prevents cheating via API manipulation

## Complete Game Rules

1. ✅ **Exactly 5 bags** (5 unique items)
2. ✅ **Each bag = 1 unique item** (but multiple quantities allowed)
3. ✅ **Maximum 5 items per bag** (NEW)
4. ✅ **Total ≤ $100.00** (cannot exceed budget)

**Any violation = Score of 0**

## Testing

### Valid Scenarios
```
✅ 5x Organic Chicken Breast @ $20 each = $100.00 (perfect!)
✅ 3x Eggs @ $4 each = $12 (reasonable multiples)
✅ 5x Milk @ $3.50 each = $17.50 (at max limit)
```

### Invalid Scenarios
```
❌ 25x $1 item = $25 (exceeds 5 per bag)
❌ 10x $2 item = $20 (exceeds 5 per bag)
❌ 6x $5 item = $30 (exceeds 5 per bag)
```

## Impact

**Before:**
- Players could spam cheap items
- No strategic thinking required
- Easy to hit exactly $100
- Game was too simple

**After:**
- Requires diverse item selection
- Forces strategic thinking about quantities
- More challenging to reach $100
- Better gameplay experience

## Example Game Strategy

To reach $100 with 5 bags (max 5 items each):

```
Bag 1: 4x Ground Beef @ $6 = $24
Bag 2: 2x Salmon @ $12 = $24
Bag 3: 3x Organic Milk @ $5 = $15
Bag 4: 5x Fresh Bread @ $3 = $15
Bag 5: 4x Cheese @ $5.50 = $22
Total: $100 ✅
```

vs. Invalid approach:
```
Bag 1: 100x $1 Candy = $100 ❌ (exceeds max per bag)
```

---

**Status:** ✅ Fully Implemented  
**Tested:** ✅ Frontend validation, UI controls, backend scoring  
**Documentation:** ✅ Complete


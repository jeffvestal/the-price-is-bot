---
slug: agent-builder-overview
id: bsm0uvm1ozxy
type: challenge
title: Agent Builder Overview
tabs:
- id: 301qwe1xxvqo
  title: Kibana
  type: service
  hostname: kubernetes-vm
  path: /
  port: 30001
- id: annpm8fziezl
  title: Terminal
  type: terminal
  hostname: host-1
difficulty: ""
enhanced_loading: null
---
# Agent Builder Overview

Welcome to Agent Builder! In this challenge, you'll learn how to navigate Elasticsearch's Agent Builder interface and explore pre-configured AI agents designed specifically for grocery shopping. You'll get hands-on experience chatting with different agents and see how they use specialized tools to help customers find the perfect groceries.

**What you'll learn:**
- How to navigate the Agent Builder interface in Kibana
- The difference between agents and tools
- How agents use specialized tools to answer questions
- How to chat with different grocery shopping agents

**Time to complete:** 15-20 minutes

---

## Step 1: Open Agent Builder

1. Click on the **Kibana** tab at the top of this page
2. In the Kibana sidebar (left side), look for **Machine Learning** or **AI Assistant**
3. Click on **Agent Builder** (you may see it under "AI Assistant" or directly in the sidebar)
4. You should now see the Agent Builder interface with tabs for **Agents**, **Tools**, and **Connectors**

💡 **Tip:** If you don't see Agent Builder, make sure the setup script has completed. The agents and tools are automatically deployed during the track initialization.

---

## Step 2: Understanding Tools

**What are tools?** Tools are the building blocks that agents use to perform actions. Think of them as specialized functions that can query data, perform calculations, or interact with systems.

### Explore the Grocery Tools

1. Click on the **Tools** tab in Agent Builder
2. You'll see 8 pre-configured grocery shopping tools:

   - **`find_deals`** - Finds items currently on sale or promotion
   - **`check_nutrition`** - Retrieves nutritional information for items
   - **`seasonal_recommendations`** - Suggests items that are in season
   - **`dietary_filter`** - Filters items by dietary restrictions (vegan, gluten-free, etc.)
   - **`check_store_inventory`** - Checks what's available at specific stores
   - **`find_budget_items`** - Finds items within a specific price range
   - **`search_grocery_items`** - Searches for grocery items by name or description
   - **`find_recipe_items`** - Finds ingredients needed for specific recipes

3. Click on any tool to see its definition. Notice that these are **ES|QL tools** - they use Elasticsearch Query Language to query the grocery data.

🔍 **Key Insight:** These tools are purpose-built for grocery shopping, not generic search. This makes them much more powerful and accurate than a general-purpose search tool.

---

## Step 3: Understanding Agents

**What are agents?** Agents are AI assistants that use tools to help users accomplish tasks. Each agent has:
- **Personality** - How it communicates and approaches problems
- **Instructions** - Guidelines for when and how to use tools
- **Tools** - The specific tools it can access

### Meet Your Grocery Shopping Agents

Click on the **Agents** tab. You'll see several pre-configured agents. Let's focus on three key ones:

#### 🛒 Budget Master
- **Personality:** Enthusiastic about savings, practical and cost-conscious
- **Best for:** Finding deals, comparing prices, maximizing your shopping budget
- **Key Tools:** `find_deals`, `find_budget_items`, `search_grocery_items`
- **Use when:** You want to save money or find the best prices

#### 🥗 Health Guru
- **Personality:** Knowledgeable about nutrition, encouraging and supportive
- **Best for:** Healthy choices, dietary restrictions, nutrition information
- **Key Tools:** `check_nutrition`, `dietary_filter`, `seasonal_recommendations`
- **Use when:** You have dietary needs or want nutritional guidance

#### 👨‍🍳 Gourmet Chef
- **Personality:** Passionate about food, creative and inspiring
- **Best for:** Recipe planning, premium ingredients, meal ideas
- **Key Tools:** `find_recipe_items`, `search_grocery_items`, `seasonal_recommendations`
- **Use when:** You're planning a special meal or want cooking inspiration

---

## Step 4: Chat with Budget Master

Let's start by chatting with the Budget Master agent to see how it helps find deals and save money.

1. Click on the **Agents** tab
2. Find **Budget Master** in the list
3. Click on **Budget Master** to open its details
4. Click the **Chat** button (or "Open Chat" / "Start Conversation")
5. You should see a chat interface open

### Try These Sample Queries:

Copy and paste these queries one at a time to see how Budget Master responds:

**Query 1: Finding Deals**
```
Find me the best deals on chicken this week
```

**What to observe:**
- Watch how the agent selects and uses the `find_deals` tool
- Notice the tool execution results showing items on sale
- See how the agent interprets the results and presents them to you

**Query 2: Budget Shopping**
```
I need groceries for under $50 - what can you recommend?
```

**What to observe:**
- The agent uses `find_budget_items` with price constraints
- It provides multiple options within your budget
- Notice how it explains the value of each recommendation

**Query 3: Category Deals**
```
Show me items on sale in the dairy category
```

**What to observe:**
- The agent combines search with deal-finding
- It filters results to show only sale items
- See how it presents the savings opportunities

---

## Step 5: Chat with Health Guru

Now let's try the Health Guru to see how it helps with nutrition and dietary needs.

1. Go back to the **Agents** tab
2. Find **Health Guru** and open its chat interface
3. Try these queries:

**Query 1: High-Protein Foods**
```
I need high-protein foods for meal prep
```

**What to observe:**
- The agent uses `check_nutrition` to find protein-rich items
- It explains the nutritional benefits
- Notice how it focuses on health aspects

**Query 2: Dietary Restrictions**
```
Find me gluten-free breakfast options
```

**What to observe:**
- The agent uses `dietary_filter` to find gluten-free items
- It narrows results to breakfast-appropriate items
- See how it's supportive and helpful about dietary needs

**Query 3: Seasonal Health**
```
What are the healthiest vegetables in season right now?
```

**What to observe:**
- The agent combines `seasonal_recommendations` with nutrition knowledge
- It explains why these vegetables are healthy choices
- Notice the seasonal focus in the recommendations

---

## Step 6: Chat with Gourmet Chef (Optional)

If you have time, try the Gourmet Chef for recipe and meal planning:

1. Open **Gourmet Chef** from the Agents tab
2. Try this query:

**Query: Recipe Planning**
```
I want to make Italian pasta - what ingredients do I need?
```

**What to observe:**
- The agent uses `find_recipe_items` to get recipe ingredients
- It explains how ingredients work together
- Notice the culinary enthusiasm in the response

---

## Step 7: Understanding Tool Execution

As you chat with the agents, pay attention to the **tool execution** process:

1. **Agent receives your query** - It understands what you're asking
2. **Agent selects a tool** - It chooses the right specialized tool for your request
3. **Tool executes** - The tool queries Elasticsearch and returns results
4. **Agent interprets results** - It processes the data and formats a helpful response
5. **You see the response** - The agent presents the information in a conversational way

💡 **Key Insight:** Notice how each agent uses different tools based on your question. Budget Master uses `find_deals` for sales, Health Guru uses `check_nutrition` for health questions, and Gourmet Chef uses `find_recipe_items` for cooking.

---

## Step 8: Compare Agent Responses

Try asking the same question to different agents to see how they approach it differently:

**Try this query with both Budget Master and Health Guru:**
```
I need to buy meat for dinner
```

**Compare:**
- **Budget Master** will focus on prices, deals, and value
- **Health Guru** will focus on nutrition, protein content, and health benefits
- Both use `search_grocery_items`, but interpret results differently based on their personality

This demonstrates how agent instructions and personality shape the responses, even when using the same tools!

---

## Key Takeaways

✅ **Agents are AI assistants** that use tools to help users accomplish specific tasks

✅ **Tools are specialized functions** - The grocery tools are purpose-built for shopping queries, making them more accurate than generic search

✅ **Each agent has a personality** - Budget Master focuses on savings, Health Guru on nutrition, Gourmet Chef on cooking

✅ **Agents select tools intelligently** - They choose the right tool based on your question (deals → `find_deals`, nutrition → `check_nutrition`, etc.)

✅ **Tool execution is transparent** - You can see which tools agents use and what results they get

---

## What's Next?

Now that you understand how Agent Builder works, you're ready for **Challenge 3: Play the Game**! In the next challenge, you'll use these same agents in an interactive grocery shopping game where you'll compete to build the best shopping cart.

The agents you just explored will be your shopping assistants in the game, helping you find items, compare prices, and make smart shopping decisions.

---

## Troubleshooting

**Can't see Agent Builder?**
- Make sure the setup script has completed (check the Terminal tab)
- Refresh the Kibana page
- Look for "AI Assistant" or "Machine Learning" in the sidebar

**Agents not responding?**
- Check that the LLM connector is configured (this is done automatically during setup)
- Try refreshing the chat interface
- Make sure you're using the Kibana tab, not the Terminal

**No results from queries?**
- The grocery data should be loaded automatically from a snapshot
- If queries return no results, the data may still be loading - wait a moment and try again

---

**Ready to move on?** Head to Challenge 3 to start playing the game! 🎮

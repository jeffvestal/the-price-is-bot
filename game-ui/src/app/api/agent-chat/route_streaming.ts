import { NextRequest, NextResponse } from 'next/server';

// Agent chat endpoint to proxy requests to Agent Builder with streaming support
export async function POST(request: NextRequest) {
  try {
    const { message, agentId, sessionId, streaming = true } = await request.json();

    // Validate required fields
    if (!message || !agentId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Message and agent ID are required' 
        },
        { status: 400 }
      );
    }

    // Get environment variables
    const kibanaUrl = process.env.KIBANA_URL;
    const kibanaApiKey = process.env.KIBANA_API_KEY;

    if (!kibanaUrl || !kibanaApiKey) {
      console.error('❌ Missing KIBANA_URL or KIBANA_API_KEY environment variables');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Agent Builder not configured' 
        },
        { status: 500 }
      );
    }

    console.log(`🤖 Agent chat request: ${agentId} - "${message.substring(0, 50)}..." (streaming: ${streaming})`);

    // Map frontend agent IDs to backend agent IDs
    const agentIdMapping: Record<string, string> = {
      'budget_master': 'budget_master',
      'health_guru': 'health_guru', 
      'gourmet_chef': 'gourmet_chef',
      'speed_shopper': 'speed_shopper',
      'vegas_local': 'local_expert' // Map vegas_local to local_expert
    };
    
    const backendAgentId = agentIdMapping[agentId] || agentId;
    console.log(`🔄 Agent ID mapping: ${agentId} -> ${backendAgentId}`);

    // Choose endpoint based on streaming preference
    const endpoint = streaming 
      ? '/api/agent_builder/converse/async'
      : '/api/agent_builder/converse';

    const agentBuilderUrl = `${kibanaUrl.replace(/\/$/, '')}${endpoint}`;
    
    const chatPayload = {
      input: message,
      agent_id: backendAgentId
    };

    console.log(`📡 Calling Agent Builder API: ${agentBuilderUrl}`);

    if (streaming) {
      // Handle streaming response
      return handleStreamingResponse(agentBuilderUrl, chatPayload, kibanaApiKey, agentId, sessionId);
    } else {
      // Handle non-streaming response (existing logic)
      return handleNonStreamingResponse(agentBuilderUrl, chatPayload, kibanaApiKey, agentId, sessionId);
    }

  } catch (error) {
    console.error('❌ Agent chat error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      response: "I'm experiencing some technical difficulties right now. Please try your request again, or contact support if the problem persists.",
      items: [],
      agentId: request.body?.agentId || 'unknown',
      sessionId: request.body?.sessionId || `error_${Date.now()}`
    });
  }
}

async function handleStreamingResponse(
  agentBuilderUrl: string, 
  chatPayload: any, 
  kibanaApiKey: string, 
  agentId: string, 
  sessionId?: string
) {
  const response = await fetch(agentBuilderUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `ApiKey ${kibanaApiKey}`,
      'kbn-xsrf': 'true',
    },
    body: JSON.stringify(chatPayload),
  });

  if (!response.ok) {
    console.error(`❌ Agent Builder API error: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.error(`❌ Error details: ${errorText}`);
    throw new Error(`Agent Builder API request failed: ${response.status}`);
  }

  // Parse the streaming response
  const streamingData = await parseStreamingResponse(response);
  
  // Extract suggested items from the final response
  const suggestedItems = extractSuggestedItemsFromAgentResponse(streamingData.rawResponse || {});

  return NextResponse.json({
    success: true,
    response: streamingData.finalMessage || "I'm working on your request!",
    items: suggestedItems,
    agentId,
    sessionId: streamingData.conversationId || sessionId,
    metadata: {
      timestamp: new Date().toISOString(),
      agentUsed: agentId,
      rawResponse: streamingData.rawResponse,
      steps: streamingData.steps || [],
      streaming: true
    }
  });
}

async function handleNonStreamingResponse(
  agentBuilderUrl: string, 
  chatPayload: any, 
  kibanaApiKey: string, 
  agentId: string, 
  sessionId?: string
) {
  const response = await fetch(agentBuilderUrl, {
    method: 'POST',
    headers: {
      'Authorization': `ApiKey ${kibanaApiKey}`,
      'Content-Type': 'application/json',
      'kbn-xsrf': 'true'
    },
    body: JSON.stringify(chatPayload)
  });

  console.log(`📡 Response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Agent Builder API error: ${response.status} - ${errorText}`);
    
    // Return a fallback response for demo purposes
    return NextResponse.json({
      success: true,
      response: `I'm having trouble connecting to the Agent Builder right now. This is a demo response for agent ${agentId}. In a real scenario, I would help you find grocery items based on your request: "${chatPayload.input}"`,
      items: [], // No suggested items for fallback
      agentId,
      sessionId: sessionId || `fallback_${Date.now()}`
    });
  }

  const agentResponse = await response.json();
  console.log(`✅ Agent response received from ${agentId}:`, JSON.stringify(agentResponse, null, 2));

  // Parse the agent response and extract any suggested items
  let responseText = agentResponse.output || agentResponse.response?.message || '';
  
  // If the response is empty but we have tool results, create a helpful response
  if (!responseText || responseText.trim() === '') {
    responseText = generateResponseFromToolResults(agentResponse, agentId);
  }
  
  // Try to extract suggested items from the response and tool results
  const suggestedItems = extractSuggestedItemsFromAgentResponse(agentResponse);

  return NextResponse.json({
    success: true,
    response: responseText,
    items: suggestedItems,
    agentId,
    sessionId: agentResponse.session_id || sessionId,
    metadata: {
      timestamp: new Date().toISOString(),
      agentUsed: agentId,
      rawResponse: agentResponse,
      steps: agentResponse.steps || [],
      streaming: false
    }
  });
}

async function parseStreamingResponse(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body reader available');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let steps: any[] = [];
  let finalMessage = '';
  let conversationId = '';
  let rawResponse: any = {};

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          // Event type - we'll use this to categorize the next data
          continue;
        } else if (line.startsWith('data: ')) {
          const dataStr = line.substring(6);
          try {
            const data = JSON.parse(dataStr);
            
            // Handle different event types
            if (data.data?.conversation_id) {
              conversationId = data.data.conversation_id;
            } else if (data.data?.reasoning) {
              steps.push({
                type: 'reasoning',
                reasoning: data.data.reasoning
              });
            } else if (data.data?.tool_call_id) {
              steps.push({
                type: 'tool_call',
                tool_call_id: data.data.tool_call_id,
                tool_id: data.data.tool_id,
                params: data.data.params,
                results: data.data.results || []
              });
            } else if (data.data?.message_content) {
              // Final complete message
              finalMessage = data.data.message_content;
            } else if (data.data?.round) {
              // Complete round data
              rawResponse = data.data.round;
              steps = data.data.round.steps || [];
              finalMessage = data.data.round.response?.message || finalMessage;
            }
          } catch (e) {
            // Skip malformed JSON
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    steps,
    finalMessage,
    conversationId,
    rawResponse
  };
}

// Helper function to generate response from tool results when agent response is empty
function generateResponseFromToolResults(agentResponse: any, agentId: string): string {
  const steps = agentResponse.steps || [];
  const toolCalls = steps.filter((step: any) => step.type === 'tool_call');
  
  if (toolCalls.length === 0) {
    return `I'm working on your request! Let me search for the best options for you.`;
  }

  const toolCall = toolCalls[0];
  const results = toolCall.results || [];
  const tabularData = results.find((r: any) => r.type === 'tabular_data');
  
  if (!tabularData || !tabularData.data.values || tabularData.data.values.length === 0) {
    return `I searched for items but didn't find any matches. Let me try a different approach for you!`;
  }

  // Get unique items only
  const allItems = tabularData.data.values.filter((item: any) => item && item.length > 0);
  const uniqueItems: any[] = [];
  const seenNames = new Set<string>();
  
  for (const item of allItems) {
    const name = item[5] || item[4] || `Product ${uniqueItems.length + 1}`;
    if (!seenNames.has(name)) {
      seenNames.add(name);
      uniqueItems.push(item);
      if (uniqueItems.length >= 5) break;
    }
  }

  if (uniqueItems.length === 0) {
    return `I searched for items but couldn't find any available options right now. Please try a different search term!`;
  }

  return `I found ${uniqueItems.length} great options for you! Check out the suggested items below and use the "Add" buttons to build your cart.`;
}

function extractSuggestedItemsFromAgentResponse(agentResponse: any): any[] {
  const suggestedItems: any[] = [];
  
  try {
    // Look for tool results in the steps
    const steps = agentResponse.steps || [];
    const toolCalls = steps.filter((step: any) => step.type === 'tool_call');
    
    for (const toolCall of toolCalls) {
      const results = toolCall.results || [];
      
      for (const result of results) {
        if (result.type === 'tabular_data' && result.data?.values) {
          const tabularData = result.data;
          
          // Process each item from the tabular data
          for (let index = 0; index < Math.min(tabularData.values.length, 5); index++) {
            const item = tabularData.values[index];
            
            if (!item || !Array.isArray(item) || item.length === 0) {
              continue;
            }
            
            let bestPrice = 0;
            let itemId = '';
            let name = '';
            let brand = '';
            let category = '';
            let quantity = 1;
            
            // Handle different data structures returned by different tools
            if (item.length === 12) {
              // New search_grocery_items structure: [avg_price, min_price, max_price, stores_available, item_id, name, brand, category, unit_size, organic, gluten_free, vegan]
              const [avgPrice, minPrice, maxPrice, storesAvailable, id, itemName, brandName, cat] = item;
              bestPrice = parseFloat(avgPrice.toString()) || 0;
              itemId = id || `item_${index}`;
              name = itemName || `Product ${index + 1}`;
              brand = brandName || 'Unknown Brand';
              category = cat || 'Suggested';
            } else if (item.length <= 11) {
              // Budget/simple tool structure: [best_price, avg_price, stores_count, max_discount_score, item_id, name, brand, category, unit_size, organic, value_score]
              [bestPrice, , , , itemId, name, brand, category] = item;
            } else {
              // Detailed tool structure (fallback for other tools)
              bestPrice = parseFloat(item[0]?.toString()) || 0;
              itemId = item[4] || `item_${index}`;
              name = item[5] || `Product ${index + 1}`;
              brand = item[6] || 'Unknown Brand';
              category = item[7] || 'Suggested';
            }
            
            // Skip items that are too cheap (likely data errors)
            if (bestPrice < 1) {
              continue;
            }
            
            // Try to extract quantity from agent response text if available
            const responseText = agentResponse.response?.message || agentResponse.output || '';
            const quantityMatch = responseText.match(new RegExp(`${name}.*?(\\d+)\\s*(?:lbs?|pounds?|oz|ounces?|pieces?|items?)`, 'i'));
            if (quantityMatch) {
              quantity = parseInt(quantityMatch[1]) || 1;
            }
            
            // Check for duplicates by name
            const isDuplicate = suggestedItems.some(existingItem => 
              existingItem.name.toLowerCase() === name.toLowerCase()
            );
            
            if (!isDuplicate) {
              suggestedItems.push({
                id: itemId,
                name: name,
                brand: brand,
                category: category,
                price: bestPrice,
                quantity: quantity,
                unit: 'item'
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error extracting suggested items:', error);
  }
  
  // Return up to 5 unique items
  return suggestedItems.slice(0, 5);
}

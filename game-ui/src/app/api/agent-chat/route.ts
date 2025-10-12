import { NextRequest, NextResponse } from 'next/server';

// Agent chat endpoint to proxy requests to Agent Builder with streaming support
export async function POST(request: NextRequest) {
  try {
    const { message, agentId, sessionId, conversationId, streaming = true } = await request.json();

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
    
    const chatPayload: any = {
      input: message,
      agent_id: backendAgentId
    };

    // Include conversation_id if provided (for multi-turn conversations)
    if (conversationId) {
      chatPayload.conversation_id = conversationId;
      console.log(`🔗 Continuing conversation: ${conversationId}`);
    } else {
      console.log(`🆕 Starting new conversation`);
    }

    console.log(`📡 Calling Agent Builder API: ${agentBuilderUrl}`);

    if (streaming) {
      // Handle streaming response with real-time streaming to frontend
      return handleRealTimeStreamingResponse(agentBuilderUrl, chatPayload, kibanaApiKey, agentId, sessionId);
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

async function handleRealTimeStreamingResponse(
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

  // Create a ReadableStream that forwards the agent's streaming response to the frontend
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.error(new Error('No response body reader available'));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let steps: any[] = [];
      let conversationId = '';
      let currentEventType = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEventType = line.substring(7);
              continue;
            } else if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              try {
                const data = JSON.parse(dataStr);
                
                // Create a streaming event for the frontend
                const streamEvent = {
                  type: currentEventType,
                  data: data.data,
                  timestamp: new Date().toISOString()
                };

                // Handle different event types
                if (data.data?.conversation_id) {
                  conversationId = data.data.conversation_id;
                } else if (data.data?.reasoning) {
                  steps.push({
                    type: 'reasoning',
                    reasoning: data.data.reasoning
                  });
                } else if (data.data?.tool_call_id) {
                  // Find existing step or create new one
                  let existingStep = steps.find(s => s.tool_call_id === data.data.tool_call_id);
                  if (!existingStep) {
                    existingStep = {
                      type: 'tool_call',
                      tool_call_id: data.data.tool_call_id,
                      tool_id: data.data.tool_id,
                      params: data.data.params,
                      results: []
                    };
                    steps.push(existingStep);
                  }
                  // Add results if they exist
                  if (data.data.results) {
                    existingStep.results = data.data.results;
                  }
                }

                // Send the event to frontend
                const eventData = `data: ${JSON.stringify(streamEvent)}\n\n`;
                controller.enqueue(new TextEncoder().encode(eventData));
                
              } catch (e) {
                // Skip malformed JSON
                continue;
              }
            }
          }
        }

        // Send final completion event with all collected data and extracted items
        const extractedItems = extractSuggestedItemsFromAgentResponse({ steps });
        
        const completionEvent = {
          type: 'completion',
          data: {
            steps,
            conversationId,
            agentId,
            sessionId: conversationId || sessionId,
            items: extractedItems
          },
          timestamp: new Date().toISOString()
        };

        const finalEventData = `data: ${JSON.stringify(completionEvent)}\n\n`;
        controller.enqueue(new TextEncoder().encode(finalEventData));
        
      } catch (error) {
        console.error('❌ Streaming error:', error);
        controller.error(error);
      } finally {
        reader.releaseLock();
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
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
      console.log(`🔧 Processing tool: ${toolCall.tool_id}`);
      
      // Skip platform.core.search results as they don't have proper grocery data structure
      if (toolCall.tool_id === 'platform.core.search') {
        console.log('⚠️ Skipping platform.core.search results - using specialized grocery tools only');
        continue;
      }
      
      const results = toolCall.results || [];
      
      for (const result of results) {
        // Skip query results - only process tabular_data
        if (result.type === 'query') {
          console.log(`⏭️ Skipping query result`);
          continue;
        }
        
        if (result.type === 'tabular_data' && result.data?.values) {
          const tabularData = result.data;
          const columns = tabularData.columns || [];
          const columnNames = columns.map((c: any) => c.name);
          
          console.log(`📊 Tabular data: ${tabularData.values.length} rows, columns:`, columnNames);
          
          // Create a column index map for easy lookup
          const colIndex: { [key: string]: number } = {};
          columnNames.forEach((name: string, index: number) => {
            colIndex[name] = index;
          });
          
          // Process each item from the tabular data (increase limit to compensate for streaming issues)
          for (let index = 0; index < Math.min(tabularData.values.length, 8); index++) {
            const item = tabularData.values[index];
            
            if (!item || !Array.isArray(item) || item.length === 0) {
              continue;
            }
            
            console.log(`🔍 Processing item ${index}:`, { 
              name: item[colIndex['name']], 
              item_id: item[colIndex['item_id']],
              price_fields: {
                avg_price: item[colIndex['avg_price']],
                min_price: item[colIndex['min_price']],
                best_price: item[colIndex['best_price']],
                final_price: item[colIndex['final_price']],
                current_price: item[colIndex['current_price']]
              }
            });
            
            let bestPrice = 0;
            let itemId = '';
            let name = '';
            let brand = '';
            let category = '';
            let quantity = 1;
            
            // Parse by column names (not index positions)
            itemId = item[colIndex['item_id']] || `item_${index}`;
            name = item[colIndex['name']] || `Product ${index + 1}`;
            brand = item[colIndex['brand']] || 'Unknown Brand';
            category = item[colIndex['category']] || 'Suggested';
            
            // Try to get price from various possible columns (prioritize best_price for budget tools)
            if (colIndex['best_price'] !== undefined && item[colIndex['best_price']] != null) {
              bestPrice = parseFloat(item[colIndex['best_price']].toString()) || 0;
            } else if (colIndex['min_price'] !== undefined && item[colIndex['min_price']] != null) {
              bestPrice = parseFloat(item[colIndex['min_price']].toString()) || 0;
            } else if (colIndex['final_price'] !== undefined && item[colIndex['final_price']] != null) {
              bestPrice = parseFloat(item[colIndex['final_price']].toString()) || 0;
            } else if (colIndex['current_price'] !== undefined && item[colIndex['current_price']] != null) {
              bestPrice = parseFloat(item[colIndex['current_price']].toString()) || 0;
            } else if (colIndex['avg_price'] !== undefined && item[colIndex['avg_price']] != null) {
              bestPrice = parseFloat(item[colIndex['avg_price']].toString()) || 0;
            }
            
            console.log(`✅ Parsed item: name="${name}", price=$${bestPrice}, id=${itemId}`);
            
            // Skip items with invalid/missing data only
            if (bestPrice <= 0) {
              console.log(`⚠️ Skipping item with invalid price: ${name} - $${bestPrice}`);
              continue;
            }
            
            // Skip items with no proper name
            if (!name || name === 'N/A' || name.trim() === '') {
              console.log(`⚠️ Skipping item with no name: price $${bestPrice}`);
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

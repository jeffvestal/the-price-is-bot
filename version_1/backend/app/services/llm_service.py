# app/services/llm_service.py

from app.schemas import AssistantResponse, Podium
from jsonschema import validate, ValidationError
import json
import logging
from typing import Optional, Dict, List
import openai
import asyncio
from app.services.elastic_service import es, get_all_categories
from app.config import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT_NAME,
    AZURE_OPENAI_API_VERSION
)
from pydantic import ValidationError as PydanticValidationError
import traceback

# Configure the logger
logger = logging.getLogger("llm_service")
logger.setLevel(logging.DEBUG)  # Set to DEBUG for detailed logs
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(filename)s - %(funcName)s - line %(lineno)d - %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)

# Define a global variable to hold categories
CATEGORIES = []

# Define a global conversation history per user
conversation_histories: Dict[str, List[Dict[str, str]]] = {}

# Validate environment variables
required_configs = [
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT_NAME,
    AZURE_OPENAI_API_VERSION
]

if not all(required_configs):
    missing = [name for name, value in zip(
        ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_DEPLOYMENT_NAME", "AZURE_OPENAI_API_VERSION"],
        required_configs
    ) if not value]
    logger.error(f"Azure OpenAI configurations are incomplete. Missing: {', '.join(missing)}")
    raise ValueError("Azure OpenAI configurations are incomplete.")

# Initialize AzureOpenAI client
client = openai.AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version=AZURE_OPENAI_API_VERSION
)

def set_categories(categories: list):
    """
    Sets the global categories list.
    """
    global CATEGORIES
    CATEGORIES = categories
    logger.debug(f"Categories set to: {CATEGORIES}")

# Define the JSON schema for the function 'query_elasticsearch'
query_elasticsearch_schema = {
    "name": "query_elasticsearch",
    "description": "Query Elasticsearch to retrieve information about grocery items based on user input.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query related to grocery items."
            }
        },
        "required": ["query"]
    }
}

# Define the JSON schema for the assistant's response
assistant_response_schema = AssistantResponse.schema()

def get_prompt_template():
    """
    Generates the prompt template with the current list of categories.
    """
    if not CATEGORIES:
        categories_formatted = "No categories available."
    else:
        categories_formatted = "\n".join([f"- {category}" for category in CATEGORIES])

    prompt = f"""
You are an intelligent assistant participating in a game designed around grocery store items.
The specifics of the game will be provided by the user, and you need to assist them in making the right choices.
The real purpose of the game is to see how well the user can craft prompts to instruct an LLM.

Instructions:
- Use the provided 'query_elasticsearch' function to fetch up-to-date information about grocery items when needed.
- Your responses should follow the specified JSON schema to allow for easy parsing.
- You will receive instructions from the user on what to do; however, there are some overall rules to follow.

Game Rules:
- Topics should only be about grocery items and this game.
- If you don't understand the user's instructions, you can ask for more information, but try to figure out what they mean first.
  - If you do need more info, set `other_info` to the question you have and `proposed_solution` to False.
- If the user provides minimal or no specific items, proactively select items from the available categories to fill the podiums.
  - Aim to maximize the total price without exceeding the budget.

Available Categories:
{categories_formatted}

JSON Schema for Responses:
{json.dumps(assistant_response_schema, indent=4)}

YOUR RESPONSES MUST strictly adhere to the above JSON schema.
ONLY REPLY WITH THE JSON OBJECT WITHOUT ANY ADDITIONAL TEXT OR MARKDOWN.
"""
    return prompt

async def query_elasticsearch(query: str) -> dict:
    """
    Performs a hybrid semantic and lexical search on the 'grocery_items' index based on user input.

    :param query: The search query related to grocery items.
    :return: A dictionary containing search results.
    """
    try:
        response = await es.search(
            index="grocery_items",
            body={
                "retriever": {
                    "rrf": {
                        "retrievers": [
                            {
                                "standard": {
                                    "query": {
                                        "nested": {
                                            "path": "Product Description_semantic.inference.chunks",
                                            "query": {
                                                "sparse_vector": {
                                                    "inference_id": "elser-endpoint",
                                                    "field": "Product Description_semantic.inference.chunks.embeddings",
                                                    "query": query
                                                }
                                            },
                                            "inner_hits": {
                                                "size": 2,
                                                "name": "grocery_items.Product Description_semantic",
                                                "_source": [
                                                    "Product Description_semantic.inference.chunks.text"
                                                ]
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                "standard": {
                                    "query": {
                                        "nested": {
                                            "path": "Title_semantic.inference.chunks",
                                            "query": {
                                                "sparse_vector": {
                                                    "inference_id": "elser-endpoint",
                                                    "field": "Title_semantic.inference.chunks.embeddings",
                                                    "query": query
                                                }
                                            },
                                            "inner_hits": {
                                                "size": 2,
                                                "name": "grocery_items.Title_semantic",
                                                "_source": [
                                                    "Title_semantic.inference.chunks.text"
                                                ]
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                "standard": {
                                    "query": {
                                        "multi_match": {
                                            "query": query,
                                            "fields": [
                                                "Title",
                                                "Feature",
                                                "Product Description"
                                            ]
                                        }
                                    }
                                }
                            }
                        ],
                        "rank_window_size": 20
                    }
                },
                "size": 20,
                "fields": [
                    "Product Description",
                    "Price",
                    "Sub Category",
                    "Title"
                ],
                "_source": False
            }
        )
        hits = response['hits']['hits']
        results = [hit['fields'] for hit in hits]
        logger.debug(f"Elasticsearch hybrid search results for '{query}': {results}")
        return {"results": results}
    except Exception as e:
        logger.error(f"Error performing hybrid search: {e}")
        return {"error": "Failed to retrieve data from Elasticsearch."}

def parse_single_json(json_string: str) -> Optional[dict]:
    """
    Parses a string containing one or more JSON objects and returns the first valid JSON object.

    :param json_string: The JSON string to parse.
    :return: A dictionary representing the first JSON object, or None if parsing fails.
    """
    try:
        # Attempt to parse as a single JSON object
        return json.loads(json_string)
    except json.JSONDecodeError:
        # If multiple JSON objects are present, split and parse the first one
        try:
            first_json = json_string.strip().split('\n')[0]
            return json.loads(first_json)
        except json.JSONDecodeError:
            logger.error("Failed to parse JSON from LLM response.")
            return None

def validate_response(response: dict) -> bool:
    """
    Validates the assistant's response against the defined JSON schema.

    :param response: The response dictionary from the assistant.
    :return: True if valid, False otherwise.
    """
    try:
        AssistantResponse.parse_obj(response)
        return True
    except ValidationError as ve:
        logger.error(f"Response validation error: {ve.message}")
        return False

async def handle_llm_interaction(username: str, user_message: str) -> str:
    """
    Handles the interaction with the Language Learning Model (LLM) to generate assistant responses,
    allowing multiple function calls within a single interaction.

    :param username: The username of the user interacting with the assistant.
    :param user_message: The message sent by the user.
    :return: The assistant's final response as a string.
    """

    logger.debug(f"Handling LLM interaction for user '{username}' with message: {user_message}")

    try:
        # Initialize conversation history for the user if not present
        if username not in conversation_histories:
            conversation_histories[username] = [{"role": "system", "content": get_prompt_template()}]
            logger.debug(f"Initialized conversation history for user '{username}'.")

        # Append user message to conversation history
        conversation_histories[username].append({"role": "user", "content": user_message})

        max_iterations = 10  # Increased iterations to 10
        iteration = 0

        last_assistant_response = None  # Initialize variable to store last assistant response

        while iteration < max_iterations:
            iteration += 1
            logger.debug(f"LLM interaction iteration {iteration} for user '{username}'.")

            # Send the full conversation history to the LLM
            completion = await asyncio.to_thread(
                client.beta.chat.completions.parse,  # Use the 'parse' method for Structured Outputs
                model=AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=conversation_histories[username],
                functions=[query_elasticsearch_schema],
                response_format=AssistantResponse  # Specify the Pydantic model for parsing
            )

            message = completion.choices[0].message

            logger.debug(f"Assistant message for user '{username}': {message}")

            if message.parsed:
                logger.debug(f"Assistant response for user '{username}': {message.parsed.dict()}")
                # Store the assistant response
                last_assistant_response = message.parsed.dict()
                # Append assistant response to conversation history
                conversation_histories[username].append({"role": "assistant", "content": json.dumps(message.parsed.dict())})
                return json.dumps(message.parsed.dict())
            elif message.function_call:
                function_name = message.function_call.name
                function_args = json.loads(message.function_call.arguments)

                logger.debug(f"Function call detected: {function_name} with arguments {function_args}")

                # Execute the function
                if function_name == "query_elasticsearch":
                    query = function_args.get("query")
                    if not query:
                        logger.error(f"No query provided in function call by user '{username}'.")
                        assistant_response = AssistantResponse(
                            podiums=[],
                            overall_total=0.0,
                            other_info="No query provided to search for grocery items.",
                            proposed_solution=False
                        )
                    else:
                        # Execute the function
                        function_response = await query_elasticsearch(query)

                        # Extract relevant information from the search results
                        podiums: List[Podium] = []
                        if "results" in function_response and isinstance(function_response["results"], list):
                            for idx, item in enumerate(function_response["results"], start=1):
                                title_list = item.get("Title", [])
                                price_list = item.get("Price", [])
                                title = title_list[0] if title_list else "No Title"
                                price_str = price_list[0] if price_list else "$0"
                                try:
                                    price = float(price_str.replace('$', '').replace(',', '').strip())
                                except ValueError:
                                    price = 0.0
                                podium = Podium(
                                    podium=idx,
                                    item_name=title,
                                    item_price=price,
                                    quantity=1,
                                    total_price=price * 1
                                )
                                podiums.append(podium)
                        else:
                            logger.warning(f"No results found for query '{query}'.")

                        # Construct the AssistantResponse
                        assistant_response = AssistantResponse(
                            podiums=podiums,
                            overall_total=sum(p.total_price for p in podiums),
                            other_info=None,
                            proposed_solution=True
                        )

                else:
                    logger.error(f"Unknown function call: {function_name} for user '{username}'.")
                    assistant_response = AssistantResponse(
                        podiums=[],
                        overall_total=0.0,
                        other_info="I'm sorry, I encountered an unexpected error.",
                        proposed_solution=False
                    )

                # Serialize to JSON and append to conversation history
                assistant_response_json = assistant_response.dict()
                # Store this as the last assistant response
                last_assistant_response = assistant_response_json
                conversation_histories[username].append({
                    "role": "function",
                    "name": function_name,
                    "content": json.dumps(assistant_response_json)
                })

            elif message.refusal:
                logger.warning(f"Assistant refused to respond for user '{username}': {message.refusal}")
                # Append refusal to conversation history
                conversation_histories[username].append({"role": "assistant", "content": "I'm sorry, I couldn't assist with that request."})
                return json.dumps({
                    "podiums": [],
                    "overall_total": 0.0,
                    "other_info": "I'm sorry, I couldn't assist with that request.",
                    "proposed_solution": False
                })
            else:
                # Handle other unexpected scenarios
                logger.error(f"Unexpected response structure for user '{username}': {message}")
                # Append error message to conversation history
                conversation_histories[username].append({"role": "assistant", "content": "I'm sorry, I encountered an unexpected error. Please try again."})
                return json.dumps({
                    "podiums": [],
                    "overall_total": 0.0,
                    "other_info": "I'm sorry, I encountered an unexpected error. Please try again.",
                    "proposed_solution": False
                })

        # If maximum iterations are reached without a final response
        logger.error(f"Maximum iterations reached for user '{username}' without receiving a final response.")

        if last_assistant_response:
            # Return the last assistant response
            logger.debug(f"Returning last assistant response for user '{username}': {last_assistant_response}")
            return json.dumps(last_assistant_response)
        else:
            # No assistant response to return, return an error message
            return json.dumps({
                "podiums": [],
                "overall_total": 0.0,
                "other_info": "I'm sorry, I couldn't process your request fully. Please try again later.",
                "proposed_solution": False
            })

    except PydanticValidationError as e:
        logger.error(f"Pydantic validation error for user '{username}': {e}")
        logger.error(f"Validation errors: {e.errors()}")
        return json.dumps({
            "podiums": [],
            "overall_total": 0.0,
            "other_info": "I'm sorry, I couldn't understand my response correctly. Please try again.",
            "proposed_solution": False
        })
    except openai.APIConnectionError as e:
        logger.error(f"API connection error while processing user '{username}': {e}")
        return json.dumps({
            "podiums": [],
            "overall_total": 0.0,
            "other_info": "Unable to connect to the AI service. Please check your network connection.",
            "proposed_solution": False
        })
    except openai.BadRequestError as e:
        logger.error(f"Invalid request error for user '{username}': {e}")
        return json.dumps({
            "podiums": [],
            "overall_total": 0.0,
            "other_info": "There was an issue with your request. Please try again with different input.",
            "proposed_solution": False
        })
    except openai.OpenAIError as e:
        logger.error(f"OpenAI API error for user '{username}': {e}")
        return json.dumps({
            "podiums": [],
            "overall_total": 0.0,
            "other_info": "I'm experiencing some issues right now. Please try again later.",
            "proposed_solution": False
        })
    except Exception as e:
        logger.error(f"Unexpected error for user '{username}': {e}")
        logger.error(f"Full stack trace: {traceback.format_exc()}")
        raise

# test_openai.py

import openai  # Import the entire openai module
import logging

# Configure the logger
logger = logging.getLogger("test_openai")
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)

# Configure the OpenAI API client
openai.api_type = "azure"
openai.api_key = "your_azure_openai_api_key"  # Replace with your actual API key
openai.api_base = "https://your-azure-openai-endpoint/"  # Replace with your actual endpoint
openai.api_version = "2023-07-01-preview"

try:
    response = openai.ChatCompletion.create(
        engine="your_deployment_name",  # Replace with your actual deployment name
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hi"}
        ],
        max_tokens=50
    )
    print(response['choices'][0]['message']['content'])
except openai.OpenAIError as e:
    logger.error(f"OpenAI API error: {e}")


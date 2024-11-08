# app/config.py

import os
from dotenv import load_dotenv

load_dotenv()

ELASTICSEARCH_HOST = os.getenv("ELASTICSEARCH_HOST", "http://localhost:9200")
ELASTICSEARCH_API_KEY = os.getenv("ELASTICSEARCH_API_KEY", "")
LLM_API_ENDPOINT = os.getenv("LLM_API_ENDPOINT", f"{ELASTICSEARCH_HOST}/_infer")
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")

# Admin Token for authentication
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "your_admin_token_here")

# Azure OpenAI configurations
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2023-07-01-preview")  # Update to the latest version that supports function calling

# **New Configurable Variables**
MAX_PODIUMS = int(os.getenv("MAX_PODIUMS", "5"))
TARGET_PRICE = float(os.getenv("TARGET_PRICE", "100.0"))

import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("config")
logger.debug(f"Loaded ADMIN_TOKEN: {ADMIN_TOKEN}")

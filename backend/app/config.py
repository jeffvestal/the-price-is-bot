# app/config.py

import os
from dotenv import load_dotenv
import logging

load_dotenv()

ELASTICSEARCH_HOST = os.getenv("ELASTICSEARCH_HOST", "http://localhost:9200")
ELASTICSEARCH_API_KEY = os.getenv("ELASTICSEARCH_API_KEY", "")
LLM_API_ENDPOINT = os.getenv("LLM_API_ENDPOINT", f"{ELASTICSEARCH_HOST}/_infer")
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")

# Admin Token for authentication
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "")

# CORS
# Comma-separated list of allowed origins (e.g., "https://foo,https://bar")
CORS_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "*").split(",") if o.strip()]

# Azure OpenAI configurations
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2023-07-01-preview")

# **New Configurable Variables**
MAX_PODIUMS = int(os.getenv("MAX_PODIUMS", "5"))
TARGET_PRICE = float(os.getenv("TARGET_PRICE", "100.0"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("config")
logger.info("Backend configuration loaded")

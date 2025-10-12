# backend/app/utils/token_utils.py

import string
import random

def generate_unique_token(length=6):
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choices(characters, k=length))

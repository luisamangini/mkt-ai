# settings.py

import os

class Settings:
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    META_API_KEY = os.getenv('META_API_KEY')
    LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'groq')

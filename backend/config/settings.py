import os
from dotenv import load_dotenv

load_dotenv()

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

SEARCH_PROVIDER = os.getenv("SEARCH_PROVIDER", "tavily")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

META_API_KEY = os.getenv("META_API_KEY", "")

NOTIFIER_EMAIL = os.getenv("NOTIFIER_EMAIL", "")
NOTIFIER_WHATSAPP = os.getenv("NOTIFIER_WHATSAPP", "")

ENV = os.getenv("ENV", "development")
LOG_FILE = os.getenv("LOG_FILE", "logs/execucoes.jsonl")
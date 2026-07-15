import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BASE_DIR / ".env"

load_dotenv(
    dotenv_path=ENV_PATH,
    override=True,
)


# ─────────────────────────────────────────────
# LLM
# ─────────────────────────────────────────────

LLM_PROVIDER = os.getenv(
    "LLM_PROVIDER",
    "anthropic",
)

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY",
    "",
)

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile",
)

ANTHROPIC_API_KEY = os.getenv(
    "ANTHROPIC_API_KEY",
    "",
)

ANTHROPIC_MODEL = os.getenv(
    "ANTHROPIC_MODEL",
    "claude-sonnet-4-6",
)

# ─────────────────────────────────────────────
# Busca Web
# ─────────────────────────────────────────────

SEARCH_PROVIDER = os.getenv(
    "SEARCH_PROVIDER",
    "anthropic",
)

TAVILY_API_KEY = os.getenv(
    "TAVILY_API_KEY",
    "",
)

RESEARCH_MAX_SEARCHES = int(
    os.getenv(
        "RESEARCH_MAX_SEARCHES",
        "3",
    )
)

# ─────────────────────────────────────────────
# Supabase
# ─────────────────────────────────────────────

SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "",
)

SUPABASE_KEY = os.getenv(
    "SUPABASE_KEY",
    "",
)

# ─────────────────────────────────────────────
# Notificações
# ─────────────────────────────────────────────

NOTIFIER_EMAIL = os.getenv(
    "NOTIFIER_EMAIL",
    "",
)

NOTIFIER_WHATSAPP = os.getenv(
    "NOTIFIER_WHATSAPP",
    "",
)

# ─────────────────────────────────────────────
# Sistema
# ─────────────────────────────────────────────

ENV = os.getenv(
    "ENV",
    "development",
)

LOG_FILE = os.getenv(
    "LOG_FILE",
    "logs/execucoes.jsonl",
)

# ─────────────────────────────────────────────
# Meta
# ─────────────────────────────────────────────

META_APP_ID = os.getenv(
    "META_APP_ID",
    "",
)

META_APP_SECRET = os.getenv(
    "META_APP_SECRET",
    "",
)

META_ACCESS_TOKEN = os.getenv(
    "META_ACCESS_TOKEN",
    "",
)

META_AD_ACCOUNT_ID = os.getenv(
    "META_AD_ACCOUNT_ID",
    "",
)

# ─────────────────────────────────────────────
# Alertas
# ─────────────────────────────────────────────

CPL_LIMITE_ALERTA = float(
    os.getenv(
        "CPL_LIMITE_ALERTA",
        "50",
    )
)
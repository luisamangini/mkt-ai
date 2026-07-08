# backend/integrations/supabase.py
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from supabase import create_client, Client
from backend.config.settings import SUPABASE_URL, SUPABASE_KEY


def get_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL e SUPABASE_KEY precisam estar configurados no .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ── Leads ─────────────────────────────────────────────────────────────────────

def get_leads_ativos() -> list[dict]:
    """Retorna leads com status novo, qualificado ou em_negociacao."""
    client = get_client()
    resp = (
        client.table("leads_ativos")
        .select("*")
        .execute()
    )
    return resp.data or []


def get_lead_por_whatsapp(whatsapp: str) -> dict | None:
    """Busca lead pela chave de deduplicação."""
    client = get_client()
    resp = (
        client.table("leads")
        .select("*")
        .eq("whatsapp", whatsapp)
        .limit(1)
        .execute()
    )
    return resp.data[0] if resp.data else None


def criar_lead(dados: dict) -> dict:
    """
    Cria um novo lead.
    Verifica deduplicação por whatsapp antes de inserir.
    """
    existente = get_lead_por_whatsapp(dados["whatsapp"])
    if existente:
        raise ValueError(f"Lead com WhatsApp {dados['whatsapp']} já existe (id: {existente['id']})")

    client = get_client()
    resp = client.table("leads").insert(dados).execute()
    return resp.data[0]


def atualizar_lead(lead_id: str, campos: dict) -> dict:
    """Atualiza campos de um lead pelo ID."""
    client = get_client()
    resp = (
        client.table("leads")
        .update(campos)
        .eq("id", lead_id)
        .execute()
    )
    return resp.data[0] if resp.data else {}


def inserir_interacao(
    lead_id: str,
    tipo: str,
    nota: str,
    proximo_passo: str = "",
) -> dict:
    """Adiciona entrada ao histórico de interações do lead."""
    client = get_client()
    resp = client.table("interacoes").insert({
        "lead_id": lead_id,
        "tipo": tipo,
        "nota": nota,
        "proximo_passo": proximo_passo,
    }).execute()
    return resp.data[0] if resp.data else {}


def get_interacoes_lead(lead_id: str) -> list[dict]:
    """Retorna histórico de interações de um lead, do mais recente ao mais antigo."""
    client = get_client()
    resp = (
        client.table("interacoes")
        .select("*")
        .eq("lead_id", lead_id)
        .order("criado_em", desc=True)
        .execute()
    )
    return resp.data or []
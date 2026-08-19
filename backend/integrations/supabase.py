# backend/integrations/supabase.py
import os
import sys
from datetime import datetime, timedelta, timezone
from functools import lru_cache
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from supabase import create_client, Client
from backend.config.settings import APP_URL, ENV, SUPABASE_URL, SUPABASE_KEY


class AuthUserAlreadyExistsError(ValueError):
    """Indica que o e-mail informado já pertence a um usuário do Auth."""


@lru_cache(maxsize=1)
def get_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL e SUPABASE_KEY precisam estar configurados no .env")
    return create_client(SUPABASE_URL, SUPABASE_KEY)


# ── Usuários do Auth ──────────────────────────────────────────────────────────

def get_auth_users() -> list[dict]:
    """Lista usuários do Supabase Auth usando a API administrativa."""
    client = get_client()
    users = client.auth.admin.list_users()

    return [
        {
            "id": str(user.id),
            "name": (
                user.user_metadata.get("name", "")
                if isinstance(user.user_metadata, dict)
                and isinstance(user.user_metadata.get("name"), str)
                else ""
            ),
            "email": user.email or "",
            "created_at": (
                user.created_at.isoformat()
                if isinstance(user.created_at, datetime)
                else str(user.created_at or "")
            ),
            "last_sign_in_at": (
                user.last_sign_in_at.isoformat()
                if isinstance(user.last_sign_in_at, datetime)
                else str(user.last_sign_in_at or "")
            ),
        }
        for user in users
    ]


def invite_auth_user(email: str) -> None:
    """Convida um usuário pelo Supabase Auth com redirect configurado."""
    if not APP_URL:
        raise RuntimeError("APP_URL não está configurada no backend.")

    normalized_email = email.strip().lower()
    existing_users = get_auth_users()
    if any(user["email"].lower() == normalized_email for user in existing_users):
        raise AuthUserAlreadyExistsError

    client = get_client()
    try:
        client.auth.admin.invite_user_by_email(
            normalized_email,
            options={"redirect_to": f"{APP_URL}/definir-senha"},
        )
    except Exception as error:
        message = str(error).lower()
        if "already" in message or "registered" in message or "exists" in message:
            raise AuthUserAlreadyExistsError from error
        raise RuntimeError("Não foi possível enviar o convite pelo Supabase.") from error


def delete_auth_user(user_id: str) -> None:
    """Remove pelo Admin API o usuário identificado por uma sessão validada."""
    client = get_client()
    client.auth.admin.delete_user(user_id)


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


def excluir_lead(lead_id: str) -> bool:
    """Exclui interações e depois o lead, sem depender de ON DELETE CASCADE."""
    client = get_client()
    existente = client.table("leads").select("id").eq("id", lead_id).limit(1).execute()
    if not existente.data:
        return False
    client.table("interacoes").delete().eq("lead_id", lead_id).execute()
    client.table("leads").delete().eq("id", lead_id).execute()
    return True


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
    interacao = resp.data[0] if resp.data else {}
    if interacao.get("criado_em"):
        atualizar_lead(lead_id, {"ultimo_contato": interacao["criado_em"]})
    return interacao


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


def get_leads_crm() -> list[dict]:
    """Retorna todos os leads do funil, sem executar agentes."""
    client = get_client()
    resp = (
        client.table("leads")
        .select("*")
        .order("criado_em", desc=True)
        .execute()
    )
    leads = resp.data or []
    indicadores = (
        client.table("leads_ativos")
        .select("id,precisa_followup,lead_frio,tempo_sem_contato")
        .execute()
    )
    indicadores_por_id = {
        str(item["id"]): item for item in indicadores.data or []
    }
    interacoes = client.table("interacoes").select("lead_id,criado_em").execute()
    ultima_interacao_por_lead: dict[str, datetime] = {}
    for interacao in interacoes.data or []:
        data = datetime.fromisoformat(interacao["criado_em"].replace("Z", "+00:00"))
        lead_id = str(interacao["lead_id"])
        if data > ultima_interacao_por_lead.get(lead_id, datetime.min.replace(tzinfo=timezone.utc)):
            ultima_interacao_por_lead[lead_id] = data

    agora = datetime.now(timezone.utc)
    resultado = []
    for lead in leads:
        lead_id = str(lead["id"])
        datas = [ultima_interacao_por_lead.get(lead_id)]
        for campo in ("ultimo_contato", "criado_em"):
            if lead.get(campo):
                datas.append(datetime.fromisoformat(lead[campo].replace("Z", "+00:00")))
        ultima_atividade = max(data for data in datas if data is not None)
        dias_sem_atividade = max(0, (agora - ultima_atividade).days)
        ativo = lead.get("status") not in {"fechado", "perdido"}
        resultado.append({
            **lead,
            **indicadores_por_id.get(lead_id, {}),
            "ultima_atividade": ultima_atividade.isoformat(),
            "dias_sem_atividade": dias_sem_atividade,
            "precisa_followup": ativo and dias_sem_atividade >= 3,
        })
    return resultado


# ── Pesquisas ────────────────────────────────────────────────────────────────

def salvar_pesquisa(output) -> dict:
    """Persiste uma execução completa do Research Agent sem sobrescrevê-la."""
    client = get_client()
    gerado_em = output.gerado_em.isoformat()

    existente = (
        client.table("execucoes")
        .select("*")
        .eq("agent", "research_result")
        .eq("timestamp", gerado_em)
        .limit(1)
        .execute()
    )
    if existente.data:
        return existente.data[0]

    dados = output.model_dump(mode="json")
    metadata = output.model_dump(mode="json")
    for roteiro in metadata.get("roteiros", []):
        roteiro["status_editorial"] = "sem_status"
        roteiro["origin"] = "ai"

    resp = client.table("execucoes").insert({
        "timestamp": gerado_em,
        "agent": "research_result",
        "status": output.status.value,
        "resultado": f"{len(output.temas)} temas persistidos",
        "erro": output.erro or "",
        "metadata": dados,
        "ambiente": ENV,
    }).execute()
    return resp.data[0] if resp.data else {}


def get_pesquisas(periodo: str = "ultimos_30_dias") -> list[dict]:
    """Consulta pesquisas persistidas, sem executar qualquer agente."""
    agora = datetime.now(timezone.utc)
    inicios = {
        "hoje": agora.replace(hour=0, minute=0, second=0, microsecond=0),
        "ultimos_7_dias": agora - timedelta(days=7),
        "ultimos_30_dias": agora - timedelta(days=30),
        "ultimos_90_dias": agora - timedelta(days=90),
    }
    if periodo not in inicios:
        raise ValueError("Período de pesquisa inválido.")

    resp = (
        get_client().table("execucoes")
        .select("id,timestamp,status,metadata")
        .eq("agent", "research_result")
        .gte("timestamp", inicios[periodo].isoformat())
        .order("timestamp", desc=True)
    ).execute()

    return [
        {
            **registro["metadata"],
            "execution_id": str(registro["id"]),
        }
        for registro in (resp.data or [])
        if isinstance(registro.get("metadata"), dict)
    ]


def get_pesquisa_mais_recente(data: str | None = None):
    """Retorna a pesquisa persistida mais recente, opcionalmente de uma data."""
    from schemas.research import ResearchOutput

    resposta = (
        get_client().table("execucoes")
        .select("id,timestamp,metadata")
        .eq("agent", "research_result")
        .order("timestamp", desc=True)
        .limit(50)
        .execute()
    )

    for registro in resposta.data or []:
        metadata = registro.get("metadata")
        if not isinstance(metadata, dict):
            continue
        if data is not None and metadata.get("data") != data:
            continue
        try:
            return str(registro["id"]), ResearchOutput.model_validate(metadata)
        except (KeyError, ValueError, TypeError):
            continue

    return None


def apagar_execucao_pesquisa(execution_id: str) -> bool:
    """Apaga somente a execução de pesquisa correspondente ao ID informado."""
    resp = (
        get_client().table("execucoes")
        .delete()
        .eq("id", execution_id)
        .eq("agent", "research_result")
        .execute()
    )
    return bool(resp.data)


# ── Conteúdos ────────────────────────────────────────────────────────────────

def salvar_conteudo(
    output,
    research_execution_id: str | None = None,
) -> dict:
    """Persiste uma execução completa do Content Agent sem duplicá-la."""
    client = get_client()
    gerado_em = output.gerado_em.isoformat()

    existente = (
        client.table("execucoes")
        .select("*")
        .eq("agent", "content_result")
        .eq("timestamp", gerado_em)
        .limit(1)
        .execute()
    )
    if existente.data:
        return existente.data[0]

    metadata = output.model_dump(mode="json")
    metadata["research_execution_id"] = research_execution_id
    for roteiro in metadata.get("roteiros", []):
        if isinstance(roteiro, dict):
            roteiro["status_editorial"] = "sem_status"
            roteiro["origin"] = "ai"

    resp = client.table("execucoes").insert({
        "timestamp": gerado_em,
        "agent": "content_result",
        "status": "ok",
        "resultado": f"{output.total_roteiros} roteiros persistidos",
        "erro": "",
        "metadata": metadata,
        "ambiente": ENV,
    }).execute()
    return resp.data[0] if resp.data else {}


def get_conteudos(periodo: str = "ultimos_30_dias") -> list[dict]:
    """Consulta e achata conteúdos persistidos, sem executar agentes."""
    agora = datetime.now(timezone.utc)
    inicios = {
        "hoje": agora.replace(hour=0, minute=0, second=0, microsecond=0),
        "ultimas_24h": agora - timedelta(hours=24),
        "ultimos_7_dias": agora - timedelta(days=7),
        "ultimos_30_dias": agora - timedelta(days=30),
    }
    if periodo not in inicios:
        raise ValueError("Período de conteúdo inválido.")

    resp = (
        get_client().table("execucoes")
        .select("id,timestamp,metadata")
        .eq("agent", "content_result")
        .gte("timestamp", inicios[periodo].isoformat())
        .order("timestamp", desc=True)
        .execute()
    )

    conteudos: list[dict] = []
    for registro in resp.data or []:
        metadata = registro.get("metadata")
        if not isinstance(metadata, dict):
            continue

        roteiros = metadata.get("roteiros")
        if not isinstance(roteiros, list):
            continue

        execution_id = str(registro["id"])
        for indice, roteiro in enumerate(roteiros):
            if not isinstance(roteiro, dict):
                continue

            conteudos.append({
                **roteiro,
                "id": f"{execution_id}:{indice}",
                "execution_id": execution_id,
                "content_index": indice,
                "status_editorial": roteiro.get(
                    "status_editorial", "sem_status"
                ),
                "origin": roteiro.get("origin", "ai"),
            })

    return conteudos


def _atualizar_roteiro_persistido(
    execution_id: str,
    content_index: int,
    atualizar,
) -> dict | None:
    client = get_client()
    resposta = (
        client.table("execucoes")
        .select("metadata")
        .eq("id", execution_id)
        .eq("agent", "content_result")
        .limit(1)
        .execute()
    )
    if not resposta.data:
        return None

    metadata = resposta.data[0].get("metadata")
    roteiros = metadata.get("roteiros") if isinstance(metadata, dict) else None
    if not isinstance(roteiros, list) or not 0 <= content_index < len(roteiros):
        return None
    if not isinstance(roteiros[content_index], dict):
        return None

    atualizar(roteiros[content_index])
    client.table("execucoes").update({"metadata": metadata}).eq(
        "id", execution_id
    ).eq("agent", "content_result").execute()

    roteiro = roteiros[content_index]
    return {
        **roteiro,
        "id": f"{execution_id}:{content_index}",
        "execution_id": execution_id,
        "content_index": content_index,
        "status_editorial": roteiro.get("status_editorial", "sem_status"),
        "origin": roteiro.get("origin", "ai"),
    }


def atualizar_status_conteudo(
    execution_id: str,
    content_index: int,
    status: str,
) -> dict | None:
    permitidos = {"sem_status", "aprovado", "publicado", "descartado"}
    if status not in permitidos:
        raise ValueError("Status editorial inválido.")

    return _atualizar_roteiro_persistido(
        execution_id,
        content_index,
        lambda roteiro: roteiro.update({"status_editorial": status}),
    )


def atualizar_conteudo(
    execution_id: str,
    content_index: int,
    dados: dict,
) -> dict | None:
    def aplicar(roteiro: dict) -> None:
        roteiro["titulo_interno"] = dados["titulo"]
        roteiro["hashtags"] = dados["hashtags"]
        roteiro_interno = roteiro.get("roteiro")
        if not isinstance(roteiro_interno, dict):
            roteiro_interno = {}
            roteiro["roteiro"] = roteiro_interno
        roteiro_interno.update({
            "hook": dados["hook"],
            "desenvolvimento": dados["desenvolvimento"],
            "cta": dados["cta"],
            "slides": [
                {"ordem": indice, "texto": texto}
                for indice, texto in enumerate(dados["slides"], start=1)
            ] if dados["slides"] is not None else None,
        })

    return _atualizar_roteiro_persistido(
        execution_id, content_index, aplicar
    )


def excluir_roteiro_conteudo(
    execution_id: str,
    content_index: int,
) -> list[dict] | None:
    """Exclui um roteiro; remove a execução somente quando ela fica vazia."""
    client = get_client()
    resposta = (
        client.table("execucoes")
        .select("metadata")
        .eq("id", execution_id)
        .eq("agent", "content_result")
        .limit(1)
        .execute()
    )
    if not resposta.data:
        return None

    metadata = resposta.data[0].get("metadata")
    roteiros = metadata.get("roteiros") if isinstance(metadata, dict) else None
    if not isinstance(roteiros, list) or not 0 <= content_index < len(roteiros):
        return None

    roteiros.pop(content_index)
    if not roteiros:
        (
            client.table("execucoes")
            .delete()
            .eq("id", execution_id)
            .eq("agent", "content_result")
            .execute()
        )
        return []

    metadata["total_roteiros"] = len(roteiros)
    (
        client.table("execucoes")
        .update({
            "metadata": metadata,
            "resultado": f"{len(roteiros)} roteiros persistidos",
        })
        .eq("id", execution_id)
        .eq("agent", "content_result")
        .execute()
    )

    return [
        {
            **roteiro,
            "id": f"{execution_id}:{indice}",
            "execution_id": execution_id,
            "content_index": indice,
            "status_editorial": roteiro.get(
                "status_editorial", "sem_status"
            ),
            "origin": roteiro.get("origin", "ai"),
        }
        for indice, roteiro in enumerate(roteiros)
        if isinstance(roteiro, dict)
    ]


# ── Calendário ────────────────────────────────────────────────────────────────

def get_calendar_items(
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[dict]:
    """Retorna somente roteiros agendados, sem executar agentes."""
    hoje = datetime.now(timezone.utc).date()
    inicio = datetime.strptime(start_date, "%Y-%m-%d").date() if start_date else hoje - timedelta(days=31)
    fim = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else hoje + timedelta(days=93)
    if fim < inicio:
        raise ValueError("A data final deve ser igual ou posterior à inicial.")

    resposta = (
        get_client().table("execucoes")
        .select("id,metadata")
        .eq("agent", "content_result")
        .execute()
    )

    items: list[dict] = []
    for registro in resposta.data or []:
        metadata = registro.get("metadata")
        roteiros = metadata.get("roteiros") if isinstance(metadata, dict) else None
        if not isinstance(roteiros, list):
            continue
        execution_id = str(registro["id"])
        for indice, roteiro in enumerate(roteiros):
            if not isinstance(roteiro, dict):
                continue
            scheduled_date = roteiro.get("scheduled_date")
            if not isinstance(scheduled_date, str):
                continue
            try:
                data_agendada = datetime.strptime(scheduled_date, "%Y-%m-%d").date()
            except ValueError:
                continue
            if not inicio <= data_agendada <= fim:
                continue
            items.append({
                **roteiro,
                "id": f"{execution_id}:{indice}",
                "execution_id": execution_id,
                "content_index": indice,
                "status_editorial": roteiro.get("status_editorial", "sem_status"),
                "origin": roteiro.get("origin", "ai"),
            })

    return sorted(
        items,
        key=lambda item: (
            item["scheduled_date"],
            item.get("scheduled_time") or "",
        ),
    )


def agendar_conteudo(
    execution_id: str,
    content_index: int,
    scheduled_date: str,
    scheduled_time: str | None,
) -> dict | None:
    return _atualizar_roteiro_persistido(
        execution_id,
        content_index,
        lambda roteiro: roteiro.update({
            "scheduled_date": scheduled_date,
            "scheduled_time": scheduled_time,
        }),
    )


def remover_agendamento_conteudo(
    execution_id: str,
    content_index: int,
) -> dict | None:
    def remover(roteiro: dict) -> None:
        roteiro.pop("scheduled_date", None)
        roteiro.pop("scheduled_time", None)

    return _atualizar_roteiro_persistido(
        execution_id, content_index, remover
    )

# ── Dashboard Snapshots ───────────────────────────────────────────────────────

def salvar_snapshot(snapshot) -> dict:
    """
    Salva o DashboardSnapshot no Supabase.
    Se já existe snapshot para a semana, atualiza (upsert).
    """
    client = get_client()

    dados = {
        "semana": snapshot.semana,
        "gerado_em": snapshot.gerado_em,
        "periodo_solicitado": snapshot.anuncios.periodo_solicitado,
        "periodo_utilizado": snapshot.anuncios.periodo_utilizado,
        # Meta Ads
        "gasto": snapshot.anuncios.gasto,
        "impressoes": snapshot.anuncios.impressoes,
        "alcance": snapshot.anuncios.alcance,
        "cliques": snapshot.anuncios.cliques,
        "ctr": snapshot.anuncios.ctr,
        "cpm": snapshot.anuncios.cpm,
        "cpl_bruto": snapshot.anuncios.cpl_bruto,
        "leads_meta": snapshot.anuncios.leads_meta,
        "frequencia": snapshot.anuncios.frequencia,
        "hook_rate": snapshot.anuncios.hook_rate,
        "campanhas": snapshot.anuncios.model_dump().get("campanhas", []),        # CRM
        "leads_novos": snapshot.crm.leads_novos,
        "leads_qualificados": snapshot.crm.leads_qualificados,
        "leads_em_negociacao": snapshot.crm.leads_em_negociacao,
        "leads_fechados": snapshot.crm.leads_fechados,
        "leads_perdidos": snapshot.crm.leads_perdidos,
        "taxa_qualificacao": snapshot.crm.taxa_qualificacao,
        "taxa_fechamento": snapshot.crm.taxa_fechamento,
        "custo_lead_qualificado": snapshot.crm.custo_lead_qualificado,
        "custo_lead_fechado": snapshot.crm.custo_lead_fechado,
        # Metadados
        "aviso": snapshot.aviso,
        "snapshot_completo": snapshot.model_dump(),
        "instagram_username": snapshot.instagram.username if snapshot.instagram else None,
        "instagram_seguidores": snapshot.instagram.seguidores if snapshot.instagram else 0,
        "instagram_posts": snapshot.instagram.total_posts if snapshot.instagram else 0,
        "instagram_alcance": snapshot.instagram.alcance if snapshot.instagram else 0,
        "instagram_visualizacoes": snapshot.instagram.visualizacoes if snapshot.instagram else 0,
        "instagram_visitas_perfil": snapshot.instagram.visitas_perfil if snapshot.instagram else 0, 
    }

    resp = (
        client.table("dashboard_snapshots")
        .upsert(dados, on_conflict="semana")
        .execute()
    )
    return resp.data[0] if resp.data else {}


def get_snapshots_anteriores(semana_atual: str, limite: int = 4) -> list[dict]:
    """
    Busca os últimos N snapshots anteriores à semana atual.
    Usado pelo Agente de Análise para comparação histórica.
    """
    client = get_client()
    resp = (
        client.table("dashboard_snapshots")
        .select("*")
        .lt("semana", semana_atual)  # anteriores à semana atual
        .order("semana", desc=True)
        .limit(limite)
        .execute()
    )
    return resp.data or []


def get_campaigns_dashboard(limite: int = 16) -> dict:
    """Lê snapshots persistidos para a tela analítica de campanhas."""
    campos = (
        "semana,gerado_em,periodo_solicitado,periodo_utilizado,aviso,"
        "gasto,impressoes,alcance,cliques,ctr,cpm,cpl_bruto,leads_meta,"
        "frequencia,hook_rate,campanhas,leads_novos,leads_qualificados,"
        "leads_em_negociacao,leads_fechados,leads_perdidos,"
        "taxa_qualificacao,taxa_fechamento,custo_lead_qualificado,"
        "custo_lead_fechado"
    )
    resposta = (
        get_client().table("dashboard_snapshots")
        .select(campos)
        .order("semana", desc=True)
        .limit(limite)
        .execute()
    )
    snapshots = resposta.data or []
    atual = snapshots[0] if snapshots else None
    return {
        "current": atual,
        "previous": snapshots[1] if len(snapshots) > 1 else None,
        "history": list(reversed(snapshots)),
        "campaigns": atual.get("campanhas", []) if atual else [],
    }


def get_dashboard_instagram(semana: str | None = None) -> dict | None:
    """Lê somente o resumo de Instagram de um snapshot persistido."""
    consulta = (
        get_client().table("dashboard_snapshots")
        .select(
            "semana,instagram_username,instagram_seguidores,instagram_posts,"
            "instagram_alcance,instagram_visualizacoes,"
            "instagram_visitas_perfil"
        )
    )
    if semana:
        consulta = consulta.eq("semana", semana)
    resposta = consulta.order("semana", desc=True).limit(1).execute()
    return resposta.data[0] if resposta.data else None

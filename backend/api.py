import os
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator


app = FastAPI(title="MKT-AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


API_TOKEN = os.getenv("API_TOKEN", "")


def _verificar_token(authorization: str | None):
    if API_TOKEN and authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="Token invalido")


def _get_authenticated_user(authorization: str | None):
    """Valida o access token e retorna exclusivamente o usuário da sessão."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")

    access_token = authorization.removeprefix("Bearer ").strip()
    if not access_token:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")

    try:
        from backend.integrations.supabase import get_client

        response = get_client().auth.get_user(access_token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")
        return response.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada.")


def _autorizar_convite(authorization: str | None):
    """Ponto único para adicionar a validação de role administrativa no futuro."""
    return _get_authenticated_user(authorization)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/users")
def get_users(authorization: str | None = Header(default=None)):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import get_auth_users

        return {"status": "ok", "users": get_auth_users()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class UserInviteInput(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("O e-mail é obrigatório.")
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Informe um e-mail válido.")
        return normalized


@app.post("/users/invite")
def invite_user(
    payload: UserInviteInput,
    authorization: str | None = Header(default=None),
):
    _autorizar_convite(authorization)
    try:
        from backend.integrations.supabase import (
            AuthUserAlreadyExistsError,
            invite_auth_user,
        )

        invite_auth_user(payload.email)
        return {
            "status": "ok",
            "message": "Convite enviado com sucesso.",
        }
    except AuthUserAlreadyExistsError:
        raise HTTPException(
            status_code=409,
            detail="Já existe um usuário cadastrado com este e-mail.",
        )
    except RuntimeError as error:
        if str(error) == "APP_URL não está configurada no backend.":
            raise HTTPException(
                status_code=503,
                detail="O envio de convites ainda não está configurado.",
            )
        raise HTTPException(
            status_code=502,
            detail="Não foi possível enviar o convite. Tente novamente.",
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Não foi possível enviar o convite. Tente novamente.",
        )


@app.delete("/users/me")
def delete_current_user(authorization: str | None = Header(default=None)):
    user = _get_authenticated_user(authorization)
    try:
        from backend.integrations.supabase import delete_auth_user

        delete_auth_user(str(user.id))
        return {"status": "ok"}
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Não foi possível excluir sua conta. Tente novamente.",
        )


@app.post("/run/research")
def run_research(authorization: str | None = Header(default=None)):
    _verificar_token(authorization)

    try:
        from backend.agents.research_agent import run
        from backend.integrations.supabase import salvar_pesquisa

        output = run()
        persisted = salvar_pesquisa(output)

        return {
            "status": "ok",
            "temas": len(output.temas),
            "data": output.data,
            "gerado_em": output.gerado_em.isoformat(),
            "execution_id": str(persisted.get("id", "")),
            "temas_lista": [tema.titulo for tema in output.temas],
            "temas_detalhados": [
                tema.model_dump(mode="json") for tema in output.temas
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/research")
def get_research(
    periodo: str = "ultimos_30_dias",
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)

    try:
        from backend.integrations.supabase import get_pesquisas

        return {
            "status": "ok",
            "pesquisas": get_pesquisas(periodo),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/research/execution/{execution_id}")
def delete_research_execution(
    execution_id: str,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)

    try:
        from backend.integrations.supabase import apagar_execucao_pesquisa

        if not apagar_execucao_pesquisa(execution_id):
            raise HTTPException(
                status_code=404,
                detail="Execução de pesquisa não encontrada.",
            )

        return {"status": "ok", "execution_id": execution_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/content")
def run_content(authorization: str | None = Header(default=None)):
    _verificar_token(authorization)

    try:
        from backend.agents.content_agent import run
        from backend.integrations.supabase import (
            get_pesquisa_mais_recente,
            salvar_conteudo,
        )

        hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        persisted_research = get_pesquisa_mais_recente(hoje)
        if persisted_research is None:
            raise FileNotFoundError(
                f"Pesquisa persistida do dia {hoje} não encontrada."
            )
        research_execution_id, research = persisted_research
        output = run(research=research)
        persisted = salvar_conteudo(output, research_execution_id)

        return {
            "status": "ok",
            "data": output.data,
            "total_roteiros": output.total_roteiros,
            "execution_id": str(persisted.get("id", "")),
            "research_execution_id": research_execution_id,
            "roteiros": [
                {
                    "titulo": roteiro.titulo_interno,
                    "pilar": roteiro.pilar.value,
                    "formato": roteiro.formato.value,
                    "compliance": roteiro.compliance_checou,
                    "revisao_humana": roteiro.revisao_humana.value,
                }
                for roteiro in output.roteiros
            ],
        }

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/content/full")
def run_content_full(authorization: str | None = Header(default=None)):
    """
    Roda o Content Agent e retorna todos os roteiros completos
    formatados em texto, prontos para colar no e-mail.
    """
    _verificar_token(authorization)

    try:
        from backend.agents.content_agent import run
        from backend.integrations.supabase import (
            get_pesquisa_mais_recente,
            salvar_conteudo,
        )

        hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        persisted_research = get_pesquisa_mais_recente(hoje)
        if persisted_research is None:
            raise FileNotFoundError(
                f"Pesquisa persistida do dia {hoje} não encontrada."
            )
        research_execution_id, research = persisted_research
        output = run(research=research)
        persisted = salvar_conteudo(output, research_execution_id)
        roteiros_formatados = []

        for i, roteiro in enumerate(output.roteiros, 1):
            slides_texto = ""
            if roteiro.roteiro.slides:
                slides_texto = "\n".join(
                    f"  Slide {s.ordem}: {s.texto}"
                    for s in roteiro.roteiro.slides
                )

            desenvolvimento_texto = "\n".join(
                f"  - {linha}"
                for linha in roteiro.roteiro.desenvolvimento
            )

            hashtags_texto = " ".join(
                f"#{h.lstrip('#').strip()}"
                for h in roteiro.hashtags
            )

            roteiros_formatados.append(f"""
ROTEIRO {i}/{output.total_roteiros} - {output.data}
{'=' * 50}
Pilar:    {roteiro.pilar.value}
Formato:  {roteiro.formato.value.upper()}
Titulo:   {roteiro.titulo_interno}
Compliance: {'OK' if roteiro.compliance_checou else 'REVISAR'}
Status:   {roteiro.revisao_humana.value.upper()} - aguarda aprovacao antes de publicar

HOOK (0-3s)
{roteiro.roteiro.hook}

DESENVOLVIMENTO
{desenvolvimento_texto}
{slides_texto}

CTA
{roteiro.roteiro.cta}

HASHTAGS
{hashtags_texto}
            """.strip())

        roteiro_formatado = f"""
ROTEIROS DO DIA - {output.data}
Total: {output.total_roteiros}

{chr(10).join(roteiros_formatados)}

{'=' * 50}
Estes roteiros aguardam revisao humana antes de publicar.
Arquivo salvo: data/content_{output.data}.json
        """.strip()

        return {
            "status": "ok",
            "data": output.data,
            "total_roteiros": output.total_roteiros,
            "execution_id": str(persisted.get("id", "")),
            "research_execution_id": research_execution_id,
            "roteiros": [
                {
                    "titulo": roteiro.titulo_interno,
                    "pilar": roteiro.pilar.value,
                    "formato": roteiro.formato.value,
                    "compliance": roteiro.compliance_checou,
                    "revisao_humana": roteiro.revisao_humana.value,
                    "hashtags": roteiro.hashtags,
                    "roteiro": roteiro.roteiro.model_dump(),
                }
                for roteiro in output.roteiros
            ],
            "roteiro_formatado": roteiro_formatado,
            "assunto_email": f"Roteiros do dia - {output.total_roteiros} pecas - {output.data}",
        }

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/content")
def get_content(
    periodo: str = "ultimos_30_dias",
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)

    try:
        from backend.integrations.supabase import get_conteudos

        return {
            "status": "ok",
            "conteudos": get_conteudos(periodo),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ContentStatusInput(BaseModel):
    status: str


class ContentEditInput(BaseModel):
    titulo: str
    hook: str
    desenvolvimento: list[str]
    slides: Optional[list[str]] = None
    cta: str
    hashtags: list[str]


class ContentScheduleInput(BaseModel):
    date: str
    time: Optional[str] = None


@app.patch("/content/{execution_id}/{content_index}/status")
def patch_content_status(
    execution_id: str,
    content_index: int,
    payload: ContentStatusInput,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import atualizar_status_conteudo

        conteudo = atualizar_status_conteudo(
            execution_id, content_index, payload.status
        )
        if conteudo is None:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")
        return {"status": "ok", "conteudo": conteudo}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/content/{execution_id}/{content_index}")
def patch_content(
    execution_id: str,
    content_index: int,
    payload: ContentEditInput,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import atualizar_conteudo

        conteudo = atualizar_conteudo(
            execution_id, content_index, payload.model_dump()
        )
        if conteudo is None:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")
        return {"status": "ok", "conteudo": conteudo}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/content/{execution_id}/{content_index}")
def delete_content(
    execution_id: str,
    content_index: int,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import excluir_roteiro_conteudo

        conteudos = excluir_roteiro_conteudo(execution_id, content_index)
        if conteudos is None:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")
        return {"status": "ok", "conteudos": conteudos}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/content/{execution_id}/{content_index}/schedule")
def patch_content_schedule(
    execution_id: str,
    content_index: int,
    payload: ContentScheduleInput,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    try:
        data_validada = datetime.strptime(payload.date, "%Y-%m-%d")
        if data_validada.strftime("%Y-%m-%d") != payload.date:
            raise ValueError("a data deve usar o formato YYYY-MM-DD")
        if payload.time:
            horario_validado = datetime.strptime(payload.time, "%H:%M")
            if horario_validado.strftime("%H:%M") != payload.time:
                raise ValueError("o horário deve usar o formato HH:MM")
        from backend.integrations.supabase import agendar_conteudo

        conteudo = agendar_conteudo(
            execution_id, content_index, payload.date, payload.time
        )
        if conteudo is None:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")
        return {"status": "ok", "conteudo": conteudo}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Data ou horário inválido: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/content/{execution_id}/{content_index}/schedule")
def delete_content_schedule(
    execution_id: str,
    content_index: int,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import remover_agendamento_conteudo

        conteudo = remover_agendamento_conteudo(execution_id, content_index)
        if conteudo is None:
            raise HTTPException(status_code=404, detail="Conteúdo não encontrado.")
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/calendar")
def get_calendar(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import get_calendar_items

        return {
            "status": "ok",
            "items": get_calendar_items(start_date, end_date),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/campaigns")
def get_campaigns(authorization: str | None = Header(default=None)):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import get_campaigns_dashboard

        return {"status": "ok", **get_campaigns_dashboard()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dashboard")
def get_dashboard(
    semana: Optional[str] = None,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import get_dashboard_instagram

        return {
            "status": "ok",
            "instagram": get_dashboard_instagram(semana),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/run/qualification")
def run_qualification(authorization: str | None = Header(default=None)):
    """
    Dispara o Agente de Qualificação.
    Lê leads ativos, analisa e registra sugestões no CRM.
    """
    _verificar_token(authorization)

    try:
        from backend.agents.qualification_agent import run

        output = run()

        return {
            "status": "ok",
            "data": output.data,
            "total_leads_analisados": output.total_leads_analisados,
            "leads_prioritarios": output.leads_prioritarios,
            "leads_frios": output.leads_frios,
            "resumo": output.resumo,
            "acoes": [
                {
                    "lead_nome": acao.lead_nome,
                    "prioridade": acao.prioridade.value,
                    "acao_sugerida": acao.acao_sugerida,
                    "proximo_passo": acao.proximo_passo,
                    "mensagem_reengajamento": acao.mensagem_reengajamento,
                    "novo_status_sugerido": (
                        acao.novo_status_sugerido.value
                        if acao.novo_status_sugerido
                        else None
                    ),
                }
                for acao in output.acoes
            ],
            "email_body": _formatar_qualificacao_email(output),
            "assunto_email": f"Qualificação de Leads — {output.data}",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/run/analysis")
def run_analysis(authorization: str | None = Header(default=None)):
    """
    Dispara o Agente de Análise.
    Cruza dados da Meta Ads com o CRM e gera o diagnóstico semanal.
    """
    _verificar_token(authorization)

    try:
        from backend.agents.analysis_agent import run

        output = run()

        return {
            "status": "ok",
            "semana": output.semana,
            "situacao_geral": output.situacao_geral,
            "destaque_positivo": output.destaque_positivo,
            "alerta": output.alerta,
            "melhor_campanha": output.melhor_campanha,
            "pior_campanha": output.pior_campanha,
            "recomendacoes": output.recomendacoes,
            "email_body": _formatar_analise_email(output),
            "assunto_email": f"Análise semanal MKT-AI — {output.semana}",
            "cpl_atual": output.cpl_atual,
            "cpl_limite": output.cpl_limite,
            "cpl_alerta_disparado": output.cpl_alerta_disparado,
            "mensagem_alerta_cpl": output.mensagem_alerta_cpl,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _formatar_qualificacao_email(output) -> str:
    """Formata o output da qualificação para envio por e-mail."""

    ordem_prioridade = {
        "alta": 0,
        "media": 1,
        "baixa": 2,
    }

    acoes_ordenadas = sorted(
        output.acoes,
        key=lambda acao: ordem_prioridade.get(acao.prioridade.value, 99),
    )

    linhas = [
        f"QUALIFICAÇÃO DE LEADS — {output.data}",
        "=" * 50,
        f"Leads analisados:   {output.total_leads_analisados}",
        f"Leads prioritários: {output.leads_prioritarios}",
        f"Leads frios:        {output.leads_frios}",
        "",
        "RESUMO",
        output.resumo,
        "",
        "AÇÕES DO DIA",
        
    ]

    for acao in acoes_ordenadas:
        linhas += [
            "",
            f"{acao.lead_nome} [{acao.prioridade.value.upper()}]",
            f"Ação: {acao.acao_sugerida}",
            f"Próximo passo: {acao.proximo_passo}",
        ]

        if acao.mensagem_reengajamento:
            linhas += [
                "Mensagem pronta:",
                f'"{acao.mensagem_reengajamento}"',
            ]

        if acao.novo_status_sugerido:
            linhas.append(
                f"Status sugerido: {acao.novo_status_sugerido.value}"
            )

    linhas += [
        "",
        "=" * 50,
        "Nenhuma ação foi executada automaticamente.",
        "O operador revisa e age manualmente pelo CRM.",
    ]

    return "\n".join(linhas)

def _formatar_analise_email(output) -> str:
    """Formata o output da análise semanal para envio por e-mail."""

    linhas = [
        f"ANÁLISE SEMANAL MKT-AI — {output.semana}",
        "=" * 50,
        "",
        "SITUAÇÃO GERAL",
        output.situacao_geral,
        "",
        "DESTAQUE POSITIVO",
        output.destaque_positivo,
    ]

    if output.alerta:
        linhas += [
            "",
            "ALERTA",
            output.alerta,
        ]

    linhas += [
        "",
        "CAMPANHAS",
        f"Melhor campanha: {output.melhor_campanha}",
        f"Pior campanha: {output.pior_campanha}",
        "",
        "RECOMENDAÇÕES",
    ]

    for indice, recomendacao in enumerate(
        output.recomendacoes,
        start=1,
    ):
        linhas.append(
            f"{indice}. {recomendacao}"
        )

    linhas += [
        "",
        "=" * 50,
        "Nenhuma alteração foi executada automaticamente.",
        "As recomendações devem ser revisadas pelo operador.",
    ]

    return "\n".join(linhas)


class LeadInput(BaseModel):
    """Schema de entrada para captura de lead."""
    nome: str
    whatsapp: str
    email: Optional[str] = None
    origem: str = "outro"
    status: str = "novo"
    objetivo: Optional[str] = None
    valor_carta: Optional[float] = None
    prazo_uso: Optional[str] = None
    conhece_consorcio: Optional[str] = None
    observacoes: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_optional_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return None
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Informe um e-mail válido.")
        return normalized


class CrmLeadStatusInput(BaseModel):
    status: str


class CrmLeadUpdateInput(BaseModel):
    nome: str
    whatsapp: str
    email: Optional[str] = None
    origem: str
    objetivo: Optional[str] = None
    valor_carta: Optional[float] = None
    prazo_uso: Optional[str] = None
    conhece_consorcio: Optional[str] = None
    observacoes: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_optional_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return None
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("Informe um e-mail válido.")
        return normalized


class CrmInteractionInput(BaseModel):
    tipo: str
    nota: str
    proximo_passo: Optional[str] = None


@app.get("/crm/leads")
def get_crm_leads(authorization: str | None = Header(default=None)):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import get_leads_crm

        return {"status": "ok", "leads": get_leads_crm()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/crm/leads/{lead_id}/interactions")
def get_crm_lead_interactions(
    lead_id: str,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import get_interacoes_lead

        return {
            "status": "ok",
            "interacoes": get_interacoes_lead(lead_id),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/crm/leads/{lead_id}/status")
def patch_crm_lead_status(
    lead_id: str,
    payload: CrmLeadStatusInput,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    permitidos = {
        "novo", "qualificado", "em_negociacao", "fechado", "perdido"
    }
    if payload.status not in permitidos:
        raise HTTPException(status_code=400, detail="Status de lead inválido.")
    try:
        from backend.integrations.supabase import atualizar_lead

        lead = atualizar_lead(
            lead_id,
            {"status": payload.status, "ultimo_contato": datetime.now(timezone.utc).isoformat()},
        )
        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrado.")
        return {"status": "ok", "lead": lead}
    except HTTPException:
        raise
    except Exception as e:
        if payload.email and "email" in str(e).lower():
            raise HTTPException(
                status_code=503,
                detail="O campo de e-mail ainda não está habilitado no banco.",
            )
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/crm/leads/{lead_id}")
def patch_crm_lead(
    lead_id: str,
    payload: CrmLeadUpdateInput,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    origens = {"instagram_organico", "meta_ads", "indicacao", "direct", "outro"}
    prazos = {"imediato", "1_ano", "2_anos", "sem_pressa"}
    conhecimentos = {"sim", "nao", "parcialmente"}
    if not payload.nome.strip() or not payload.whatsapp.strip():
        raise HTTPException(status_code=400, detail="Nome e WhatsApp são obrigatórios.")
    if payload.origem not in origens:
        raise HTTPException(status_code=400, detail="Origem inválida.")
    if payload.prazo_uso and payload.prazo_uso not in prazos:
        raise HTTPException(status_code=400, detail="Prazo de uso inválido.")
    if payload.conhece_consorcio and payload.conhece_consorcio not in conhecimentos:
        raise HTTPException(status_code=400, detail="Conhecimento de consórcio inválido.")

    whatsapp = re.sub(r"[\s\-()+]", "", payload.whatsapp)
    try:
        from backend.integrations.supabase import atualizar_lead, get_lead_por_whatsapp

        existente = get_lead_por_whatsapp(whatsapp)
        if existente and str(existente["id"]) != lead_id:
            raise HTTPException(
                status_code=409,
                detail="Já existe outro lead com este WhatsApp.",
            )
        campos = {
            "nome": payload.nome.strip(),
            "whatsapp": whatsapp,
            "origem": payload.origem,
            "objetivo": payload.objetivo or None,
            "valor_carta": payload.valor_carta,
            "prazo_uso": payload.prazo_uso or None,
            "conhece_consorcio": payload.conhece_consorcio or None,
            "observacoes": payload.observacoes or None,
        }
        if payload.email:
            campos["email"] = payload.email
        lead = atualizar_lead(lead_id, campos)
        if not lead:
            raise HTTPException(status_code=404, detail="Lead não encontrado.")
        return {"status": "ok", "lead": lead}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/crm/leads/{lead_id}")
def delete_crm_lead(
    lead_id: str,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import excluir_lead

        if not excluir_lead(lead_id):
            raise HTTPException(status_code=404, detail="Lead não encontrado.")
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/crm/leads/{lead_id}/interactions")
def post_crm_lead_interaction(
    lead_id: str,
    payload: CrmInteractionInput,
    authorization: str | None = Header(default=None),
):
    _verificar_token(authorization)
    if payload.tipo != "ligacao":
        raise HTTPException(status_code=400, detail="Tipo de interação inválido.")
    if not payload.nota.strip():
        raise HTTPException(status_code=400, detail="A nota é obrigatória.")
    try:
        from backend.integrations.supabase import inserir_interacao

        interacao = inserir_interacao(
            lead_id,
            payload.tipo,
            payload.nota.strip(),
            (payload.proximo_passo or "").strip(),
        )
        return {"status": "ok", "interacao": interacao}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/leads/capture")
def capture_lead(lead: LeadInput, authorization: str | None = Header(default=None)):
    """
    Captura um lead e insere no CRM (Supabase).
    Deduplica por WhatsApp — mesmo número não gera dois registros.
    Pode ser chamado por formulários, Typeform, n8n ou qualquer fonte externa.
    """
    _verificar_token(authorization)
    try:
        from backend.integrations.supabase import get_lead_por_whatsapp, criar_lead, inserir_interacao

        # Normalizar WhatsApp — remover espaços, traços e parênteses
        whatsapp_normalizado = (
            lead.whatsapp
            .replace(" ", "")
            .replace("-", "")
            .replace("(", "")
            .replace(")", "")
            .replace("+", "")
        )

        # Verificar deduplicação
        existente = get_lead_por_whatsapp(whatsapp_normalizado)
        if existente:
            # Lead já existe — registra nova interação e retorna
            inserir_interacao(
                lead_id=existente["id"],
                tipo="contato_repetido",
                nota=f"Lead entrou em contato novamente via {lead.origem}. Observações: {lead.observacoes or 'nenhuma'}",
                proximo_passo="Verificar histórico e retomar contato",
            )
            return {
                "status": "duplicado",
                "mensagem": f"Lead {lead.nome} já existe no CRM (WhatsApp: {whatsapp_normalizado})",
                "lead_id": existente["id"],
                "acao": "nova interação registrada no histórico",
            }

        status_permitidos = {
            "novo", "qualificado", "em_negociacao", "fechado", "perdido"
        }
        if lead.status not in status_permitidos:
            raise HTTPException(status_code=400, detail="Status de lead inválido.")

        # Montar dados do lead
        dados = {
            "nome": lead.nome.strip(),
            "whatsapp": whatsapp_normalizado,
            "origem": lead.origem,
            "status": lead.status,
        }

        # Campos opcionais — só incluir se preenchidos
        if lead.objetivo:
            dados["objetivo"] = lead.objetivo
        if lead.valor_carta is not None:
            dados["valor_carta"] = lead.valor_carta
        if lead.email:
            dados["email"] = lead.email
        if lead.prazo_uso:
            dados["prazo_uso"] = lead.prazo_uso
        if lead.conhece_consorcio:
            dados["conhece_consorcio"] = lead.conhece_consorcio
        if lead.observacoes:
            dados["observacoes"] = lead.observacoes

        # Criar lead
        novo_lead = criar_lead(dados)

        # Registrar interação inicial
        inserir_interacao(
            lead_id=novo_lead["id"],
            tipo="contato_inicial",
            nota=f"Lead capturado via {lead.origem}. Observações: {lead.observacoes or 'nenhuma'}",
            proximo_passo="Aplicar roteiro de qualificação (4 perguntas)",
        )

        return {
            "status": "criado",
            "mensagem": f"Lead {lead.nome} cadastrado com sucesso",
            "lead_id": novo_lead["id"],
            "whatsapp": whatsapp_normalizado,
            "proximo_passo": "Agente de Qualificação vai analisar este lead no próximo ciclo (13h)",
        }

    except HTTPException:
        raise
    except Exception as e:
        if lead.email and "email" in str(e).lower():
            raise HTTPException(
                status_code=503,
                detail="O campo de e-mail ainda não está habilitado no banco.",
            )
        raise HTTPException(status_code=500, detail=str(e))

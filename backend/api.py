import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel


app = FastAPI(title="MKT-AI API", version="1.0.0")

API_TOKEN = os.getenv("API_TOKEN", "")


def _verificar_token(authorization: str | None):
    if API_TOKEN and authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="Token invalido")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/run/research")
def run_research(authorization: str | None = Header(default=None)):
    _verificar_token(authorization)

    try:
        from backend.agents.research_agent import run

        output = run()

        return {
            "status": "ok",
            "temas": len(output.temas),
            "data": output.data,
            "temas_lista": [tema.titulo for tema in output.temas],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/run/content")
def run_content(authorization: str | None = Header(default=None)):
    _verificar_token(authorization)

    try:
        from backend.agents.content_agent import run

        output = run()

        return {
            "status": "ok",
            "data": output.data,
            "total_roteiros": output.total_roteiros,
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

        output = run()
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
    origem: str = "outro"
    objetivo: Optional[str] = None
    valor_carta: Optional[float] = None
    prazo_uso: Optional[str] = None
    conhece_consorcio: Optional[str] = None
    observacoes: Optional[str] = None


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

        # Montar dados do lead
        dados = {
            "nome": lead.nome.strip(),
            "whatsapp": whatsapp_normalizado,
            "origem": lead.origem,
            "status": "novo",
        }

        # Campos opcionais — só incluir se preenchidos
        if lead.objetivo:
            dados["objetivo"] = lead.objetivo
        if lead.valor_carta is not None:
            dados["valor_carta"] = lead.valor_carta
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

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

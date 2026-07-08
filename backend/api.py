import os
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Header

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
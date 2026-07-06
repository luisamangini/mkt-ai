# backend/agents/content_agent.py
import json
import os
import sys
from datetime import datetime, timezone

# garante que a raiz do projeto está no path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.core.llm import get_completion
from backend.core.logger import log_execution
from schemas.content import ContentOutput, RoteiroConteudo, SlideCarrossel
from schemas.research import ResearchOutput, TemaResearch
from backend.models.enums import FormatoConteudo, Pilar, StatusRevisao


# ── Calendário editorial ─────────────────────────────────────────────────────
CALENDARIO = {
    0: {"pilar": Pilar.ATUALIDADES_E_MERCADO,  "formato": FormatoConteudo.REEL},
    1: {"pilar": Pilar.MITOS_E_VERDADES,        "formato": FormatoConteudo.REEL},
    2: {"pilar": Pilar.EDUCACAO_FINANCEIRA,     "formato": FormatoConteudo.CARROSSEL},
    3: {"pilar": Pilar.PROVA_SOCIAL,            "formato": FormatoConteudo.REEL},
    4: {"pilar": Pilar.CONVERSAO,               "formato": FormatoConteudo.STORIES},
}


# ── Helpers ──────────────────────────────────────────────────────────────────
def _load_knowledge(filename: str) -> str:
    """Lê arquivo da knowledge/ na raiz do projeto."""
    base = os.path.join(os.path.dirname(__file__), "..", "..", "knowledge")
    path = os.path.join(base, filename)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return f"[arquivo não encontrado: {filename}]"


def _load_research(data: str) -> ResearchOutput | None:
    """Carrega o JSON da pesquisa do dia."""
    path = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", f"research_{data}.json"
    )
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        dados = json.load(f)
    return ResearchOutput(**dados)


def _selecionar_tema(research: ResearchOutput, pilar: Pilar) -> TemaResearch:
    """Prioriza tema com pilar igual ao do dia. Fallback: primeiro tema."""
    for tema in research.temas:
        if tema.pilar_sugerido == pilar:
            return tema
    return research.temas[0]


# ── System prompt ─────────────────────────────────────────────────────────────
def _build_system_prompt(pilar: Pilar, formato: FormatoConteudo) -> str:
    tom         = _load_knowledge("brand/tone_of_voice.md")
    guardrails  = _load_knowledge("brand/compliance_guardrails.md")
    formatos    = _load_knowledge("content/formats.md")
    hooks_ctas  = _load_knowledge("content/hooks_and_ctas.md")
    pilares     = _load_knowledge("content/pillars_and_calendar.md")

    instrucao_formato = {
        FormatoConteudo.REEL: (
            "Gere um roteiro de Reel com:\n"
            "- HOOK: frase de impacto que para o scroll (0-3s)\n"
            "- DESENVOLVIMENTO: corpo do conteúdo em tópicos (3-25s)\n"
            "- CTA: chamada para ação única e clara (25-30s)\n"
            "O campo slides deve ser null."
        ),
        FormatoConteudo.CARROSSEL: (
            "Gere um Carrossel com:\n"
            "- HOOK: título da capa que faz parar\n"
            "- DESENVOLVIMENTO: lista de pontos principais\n"
            "- CTA: texto do slide final\n"
            "- SLIDES: array com todos os slides numerados (capa + desenvolvimento + CTA)"
        ),
        FormatoConteudo.STORIES: (
            "Gere uma sequência de Stories com:\n"
            "- HOOK: primeira tela que captura atenção\n"
            "- DESENVOLVIMENTO: ['enquete: pergunta + opções', 'caixinha: convite para pergunta']\n"
            "- CTA: direcionamento ao direct\n"
            "O campo slides deve ser null."
        ),
    }

    return f"""Você é o agente de criação de conteúdo para Instagram do Sandro Mangini, especialista em consórcio no Brasil.

## TOM DE VOZ
{tom[:1200]}

## GUARDRAILS — REGRAS INVIOLÁVEIS
{guardrails[:800]}

## PILARES E CALENDÁRIO
{pilares[:800]}

## ESTRUTURA DOS FORMATOS
{formatos[:600]}

## HOOKS E CTAs
{hooks_ctas[:600]}

## TAREFA
Pilar do dia: {pilar.value}
Formato: {formato.value.upper()}

{instrucao_formato[formato]}

## SAÍDA — JSON OBRIGATÓRIO
Responda APENAS com JSON válido. Sem markdown. Sem texto fora do JSON.

{{
  "titulo_interno": "referência interna curta — não aparece no post",
  "roteiro": {{
    "hook": "texto do gancho",
    "desenvolvimento": ["ponto 1", "ponto 2", "ponto 3"],
    "cta": "texto do CTA",
    "slides": [{{"ordem": 1, "texto": "texto do slide"}}]
  }},
  "hashtags": ["hashtag1", "hashtag2"],
  "compliance_checou": true
}}

compliance_checou deve ser true apenas se você verificou que nenhum guardrail foi violado.
revisao_humana será sempre "pendente" — nunca publique sem aprovação humana.
"""


# ── Função principal ──────────────────────────────────────────────────────────
def run(data: str | None = None) -> ContentOutput:
    hoje       = data or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dia_semana = datetime.now(timezone.utc).weekday()
    config_dia = CALENDARIO.get(dia_semana, CALENDARIO[0])
    pilar      = config_dia["pilar"]
    formato    = config_dia["formato"]

    print(f"📅 {hoje} | {pilar.value} | {formato.value.upper()}")

    # 1. Carregar pesquisa do dia
    print("📂 Carregando pesquisa...")
    research = _load_research(hoje)
    if not research or not research.temas:
        erro = f"Pesquisa do dia {hoje} não encontrada. Rode o research_agent primeiro."
        log_execution("content_agent", "falha", erro=erro)
        raise FileNotFoundError(erro)

    # 2. Selecionar tema
    tema = _selecionar_tema(research, pilar)
    print(f"🎯 Tema: {tema.titulo}")
    print(f"   Ângulo: {tema.angulo_sugerido}")

    # 3. Montar user prompt
    fontes_str = "\n".join([f"- {f.titulo}: {f.url}" for f in tema.fontes])
    user_prompt = f"""Tema do dia (Agente de Pesquisa):

TÍTULO: {tema.titulo}
RESUMO: {tema.resumo}
ÂNGULO SUGERIDO: {tema.angulo_sugerido}
PILAR: {pilar.value}
FONTES:
{fontes_str or "Não especificadas"}

Crie o roteiro completo no formato {formato.value.upper()} usando este tema.
Adapte ao tom de voz e respeite os guardrails.
O roteiro deve soar humano e natural — nunca genérico."""

    # 4. Chamar LLM
    print("🤖 Gerando roteiro...")
    try:
        resposta_raw = get_completion(
            system=_build_system_prompt(pilar, formato),
            user=user_prompt,
            max_tokens=2000,
            json_mode=True,
        )
    except Exception as e:
        erro = f"Erro no LLM: {e}"
        log_execution("content_agent", "falha", erro=erro)
        raise

    # 5. Parsear e validar
    print("✅ Validando schema...")
    try:
        dados = json.loads(resposta_raw)

        slides = None
        if dados.get("roteiro", {}).get("slides"):
            slides = [SlideCarrossel(**s) for s in dados["roteiro"]["slides"]]

        roteiro = RoteiroConteudo(
            hook=dados["roteiro"]["hook"],
            desenvolvimento=dados["roteiro"]["desenvolvimento"],
            cta=dados["roteiro"]["cta"],
            slides=slides,
        )

        output = ContentOutput(
            data=hoje,
            gerado_em=datetime.now(timezone.utc),
            pilar=pilar,
            formato=formato,
            titulo_interno=dados["titulo_interno"],
            roteiro=roteiro,
            hashtags=dados.get("hashtags", []),
            compliance_checou=dados.get("compliance_checou", False),
            revisao_humana=StatusRevisao.PENDENTE,
        )

    except Exception as e:
        erro = f"Erro ao parsear resposta: {e}\nRaw: {resposta_raw[:300]}"
        log_execution("content_agent", "falha", erro=erro)
        raise ValueError(erro)

    # 6. Salvar JSON
    output_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", f"content_{hoje}.json"
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(output.model_dump_json(indent=2))
    print(f"💾 Salvo em data/content_{hoje}.json")

    # 7. Logar
    log_execution(
        agent="content_agent",
        status="ok",
        resultado=f"{formato.value.upper()} | {pilar.value} | '{output.titulo_interno}'",
        metadata={
            "data": hoje,
            "pilar": pilar.value,
            "formato": formato.value,
            "compliance": output.compliance_checou,
            "tema": tema.titulo,
        },
    )

    return output
# backend/agents/content_agent.py
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.core.llm import get_completion
from backend.core.logger import log_execution
from schemas.content import ContentOutput, ContentDiario, RoteiroConteudo, SlideCarrossel
from schemas.research import ResearchOutput, TemaResearch
from backend.models.enums import FormatoConteudo, Pilar, StatusRevisao


# ── Formato ideal por pilar ──────────────────────────────────────────────────
# Cada pilar tem um formato natural — não depende do dia da semana
FORMATO_POR_PILAR = {
    Pilar.ATUALIDADES_E_MERCADO:  FormatoConteudo.REEL,       # react a notícia = reel
    Pilar.MITOS_E_VERDADES:       FormatoConteudo.REEL,       # mito/verdade = reel
    Pilar.EDUCACAO_FINANCEIRA:    FormatoConteudo.CARROSSEL,  # educação = carrossel
    Pilar.PROVA_SOCIAL:           FormatoConteudo.REEL,       # depoimento = reel
    Pilar.CONVERSAO:              FormatoConteudo.STORIES,    # captação = stories
}


# ── Helpers ──────────────────────────────────────────────────────────────────
def _load_knowledge(filename: str) -> str:
    base = os.path.join(os.path.dirname(__file__), "..", "..", "knowledge")
    path = os.path.join(base, filename)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return f"[arquivo não encontrado: {filename}]"


def _load_research(data: str) -> ResearchOutput | None:
    path = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", f"research_{data}.json"
    )
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        dados = json.load(f)
    return ResearchOutput(**dados)


# ── System prompt ─────────────────────────────────────────────────────────────
def _build_system_prompt(pilar: Pilar, formato: FormatoConteudo) -> str:
    tom        = _load_knowledge("brand/tone_of_voice.md")
    guardrails = _load_knowledge("brand/compliance_guardrails.md")
    formatos   = _load_knowledge("content/formats.md")
    hooks_ctas = _load_knowledge("content/hooks_and_ctas.md")
    pilares    = _load_knowledge("content/pillars_and_calendar.md")

    instrucao_formato = {
        FormatoConteudo.REEL: (
            "Gere um roteiro de REEL com:\n"
            "- HOOK: frase de impacto que para o scroll (0-3s). Deve ser direta, provocadora, com dado concreto se possível.\n"
            "- DESENVOLVIMENTO: 3 a 4 pontos objetivos (3-25s). Use apenas dados das notícias fornecidas — NUNCA invente percentuais ou estatísticas.\n"
            "- CTA: chamada única e clara (25-30s). SEMPRE direcionar para comentário ou direct. NUNCA mencionar site ou link.\n"
            "slides deve ser null."
        ),
        FormatoConteudo.CARROSSEL: (
            "Gere um roteiro de CARROSSEL com:\n"
            "- HOOK: título da capa que faz parar o scroll.\n"
            "- DESENVOLVIMENTO: lista dos pontos principais (1 por slide).\n"
            "- CTA: texto do slide final.\n"
            "- SLIDES: array completo e numerado — capa (slide 1) + desenvolvimento + slide final de CTA.\n"
            "Cada slide deve ter texto enxuto, máximo 3 linhas."
        ),
        FormatoConteudo.STORIES: (
            "Gere uma sequência de STORIES com:\n"
            "- HOOK: primeira tela que captura atenção.\n"
            "- DESENVOLVIMENTO: ['enquete com pergunta e duas opções', 'caixinha: convite para mandar dúvida'].\n"
            "- CTA: direcionamento ao direct.\n"
            "slides deve ser null."
        ),
    }

    return f"""Você é o agente de criação de conteúdo para Instagram do Sandro Mangini, especialista em consórcio no Brasil.

## TOM DE VOZ
{tom[:2000]}

## GUARDRAILS — REGRAS INVIOLÁVEIS
{guardrails[:1500]}

## PILARES E CALENDÁRIO
{pilares[:1500]}

## ESTRUTURA DOS FORMATOS
{formatos[:1000]}

## HOOKS E CTAs
{hooks_ctas[:1500]}

## FATOS TÉCNICOS INVIOLÁVEIS — nunca contradizer
- A taxa de administração do consórcio é FIXA em contrato. NÃO varia com a Selic.
- O consórcio NÃO tem juros. Apenas taxa de administração + fundo de reserva.
- Quando a Selic sobe, o financiamento fica mais caro — o consórcio fica MAIS vantajoso, não mais caro.
- A contemplação ocorre por sorteio ou lance. Lance NÃO garante contemplação.
- O consorciado continua pagando parcelas mesmo após ser contemplado.
- Taxas variam por administradora — sempre mencionar isso ao citar valores.

## EXEMPLO DE ROTEIRO BOM (referência de tom):
HOOK: "A Selic mexeu — e o que isso muda pra quem quer comprar imóvel?"
DESENVOLVIMENTO:
- "Quando a Selic sobe, o financiamento fica mais caro. Os juros do banco seguem a Selic."
- "No consórcio, a Selic não muda nada. Taxa de administração é fixa desde o contrato."
- "Quanto mais a Selic sobe, mais vantajoso o consórcio fica em comparação."
CTA: "Comenta 'SELIC' aqui que eu te explico o impacto no seu caso."

## EXEMPLO DE ROTEIRO RUIM (nunca fazer):
HOOK: "Você sabia que o mercado está mudando em 2026?"
DESENVOLVIMENTO:
- "Estudos mostram que 70% dos consumidores..." ← NUNCA invente percentuais sem fonte real
- "O mercado está se transformando..." ← vago demais
CTA: "Entre no nosso site para saber mais" ← NUNCA mencionar site

## TAREFA
Pilar: {pilar.value}
Formato: {formato.value.upper()}

{instrucao_formato[formato]}

## SAÍDA — JSON OBRIGATÓRIO
Responda APENAS com JSON válido. Sem markdown. Sem texto fora do JSON.

{{
  "titulo_interno": "referência interna curta",
  "roteiro": {{
    "hook": "texto do gancho",
    "desenvolvimento": ["ponto 1", "ponto 2", "ponto 3"],
    "cta": "texto do CTA direcionando para comentário ou direct",
    "slides": [{{"ordem": 1, "texto": "texto"}}]
  }},
  "hashtags": ["hashtag1", "hashtag2"],
  "compliance_checou": true
}}

compliance_checou = true APENAS se verificou que nenhum guardrail foi violado e nenhum dado foi inventado.
"""


# ── Gera roteiro para um tema específico ─────────────────────────────────────
def _gerar_roteiro_para_tema(tema: TemaResearch, hoje: str) -> ContentOutput:
    pilar = tema.pilar_sugerido
    formato = FORMATO_POR_PILAR.get(pilar, FormatoConteudo.REEL)

    print(f"\n   Tema: {tema.titulo}")
    print(f"     Pilar: {pilar.value} → Formato: {formato.value.upper()}")

    fontes_str = "\n".join([f"- {f.titulo}: {f.url}" for f in tema.fontes])

    user_prompt = f"""Tema do dia (Agente de Pesquisa):

TÍTULO: {tema.titulo}
RESUMO: {tema.resumo}
ÂNGULO SUGERIDO: {tema.angulo_sugerido}
PILAR: {pilar.value}
FONTES:
{fontes_str or "Não especificadas"}

Crie o roteiro completo no formato {formato.value.upper()} usando APENAS as informações acima.
Não invente dados, percentuais ou estatísticas que não estejam nas fontes.
O roteiro deve soar como Sandro falando para um amigo — direto, concreto, sem enrolação."""

    resposta_raw = get_completion(
        system=_build_system_prompt(pilar, formato),
        user=user_prompt,
        max_tokens=2000,
        json_mode=True,
    )

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

    return ContentOutput(
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


# ── Função principal ──────────────────────────────────────────────────────────
def run(data: str | None = None) -> ContentDiario:
    """
    Gera um roteiro por tema retornado pelo Research Agent.
    Se research retornou 3 temas → gera 3 roteiros.
    """
    hoje = data or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print(f" {hoje} — gerando roteiros por tema")

    # 1. Carregar pesquisa do dia
    print(" Carregando pesquisa...")
    research = _load_research(hoje)
    if not research or not research.temas:
        erro = f"Pesquisa do dia {hoje} não encontrada. Rode o research_agent primeiro."
        log_execution("content_agent", "falha", erro=erro)
        raise FileNotFoundError(erro)

    print(f"   {len(research.temas)} temas encontrados — gerando {len(research.temas)} roteiros")

    # 2. Gerar um roteiro por tema
    roteiros = []
    erros = []

    for i, tema in enumerate(research.temas, 1):
        print(f"\nRoteiro {i}/{len(research.temas)}...")
        try:
            roteiro = _gerar_roteiro_para_tema(tema, hoje)
            roteiros.append(roteiro)
            print(f" Gerado: {roteiro.titulo_interno}")
        except Exception as e:
            erro = f"Erro no tema '{tema.titulo}': {e}"
            erros.append(erro)
            print(f"  {erro}")

    if not roteiros:
        erro = f"Nenhum roteiro gerado. Erros: {'; '.join(erros)}"
        log_execution("content_agent", "falha", erro=erro)
        raise ValueError(erro)

    # 3. Montar ContentDiario
    output = ContentDiario(
        data=hoje,
        gerado_em=datetime.now(timezone.utc),
        total_roteiros=len(roteiros),
        roteiros=roteiros,
    )

    # 4. Salvar JSON
    output_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", f"content_{hoje}.json"
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(output.model_dump_json(indent=2))
    print(f"\n {len(roteiros)} roteiros salvos em data/content_{hoje}.json")

    # 5. Logar
    titulos = [r.titulo_interno for r in roteiros]
    log_execution(
        agent="content_agent",
        status="ok",
        resultado=f"{len(roteiros)} roteiros gerados: {', '.join(titulos)}",
        metadata={"data": hoje, "total": len(roteiros), "erros": erros},
    )

    return output
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.core.llm import get_completion
from backend.core.logger import log_execution
from schemas.content import ContentOutput, RoteiroConteudo, SlideCarrossel
from schemas.research import ResearchOutput, TemaResearch
from backend.models.enums import FormatoConteudo, Pilar, StatusRevisao


CALENDARIO = {
    0: {"pilar": Pilar.ATUALIDADES_E_MERCADO, "formato": FormatoConteudo.REEL},
    1: {"pilar": Pilar.MITOS_E_VERDADES, "formato": FormatoConteudo.REEL},
    2: {"pilar": Pilar.EDUCACAO_FINANCEIRA, "formato": FormatoConteudo.CARROSSEL},
    3: {"pilar": Pilar.PROVA_SOCIAL, "formato": FormatoConteudo.REEL},
    4: {"pilar": Pilar.CONVERSAO, "formato": FormatoConteudo.STORIES},
}


def _load_knowledge(filename: str) -> str:
    base = os.path.join(os.path.dirname(__file__), "..", "..", "knowledge")
    path = os.path.join(base, filename)

    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return f"[arquivo nao encontrado: {filename}]"


def _load_research(data: str) -> ResearchOutput | None:
    path = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", f"research_{data}.json"
    )

    if not os.path.exists(path):
        return None

    with open(path, "r", encoding="utf-8") as f:
        dados = json.load(f)

    return ResearchOutput(**dados)


def _selecionar_tema(research: ResearchOutput, pilar: Pilar) -> TemaResearch:
    for tema in research.temas:
        if tema.pilar_sugerido == pilar:
            return tema

    return research.temas[0]


def _build_system_prompt(pilar: Pilar, formato: FormatoConteudo) -> str:
    tom = _load_knowledge("brand/tone_of_voice.md")
    guardrails = _load_knowledge("brand/compliance_guardrails.md")
    formatos = _load_knowledge("content/formats.md")
    hooks_ctas = _load_knowledge("content/hooks_and_ctas.md")
    pilares = _load_knowledge("content/pillars_and_calendar.md")

    instrucao_formato = {
        FormatoConteudo.REEL: (
            "Gere um roteiro de Reel com:\n"
            "- HOOK: frase de impacto que para o scroll (0-3s)\n"
            "- DESENVOLVIMENTO: corpo do conteudo em topicos (3-25s)\n"
            "- CTA: chamada para acao unica e clara (25-30s)\n"
            "O campo slides deve ser null."
        ),
        FormatoConteudo.CARROSSEL: (
            "Gere um Carrossel com:\n"
            "- HOOK: titulo da capa que faz parar\n"
            "- DESENVOLVIMENTO: lista de pontos principais\n"
            "- CTA: texto do slide final\n"
            "- SLIDES: array com todos os slides numerados (capa + desenvolvimento + CTA)"
        ),
        FormatoConteudo.STORIES: (
            "Gere uma sequencia de Stories com:\n"
            "- HOOK: primeira tela que captura atencao\n"
            "- DESENVOLVIMENTO: ['enquete: pergunta + opcoes', 'caixinha: convite para pergunta']\n"
            "- CTA: direcionamento ao direct\n"
            "O campo slides deve ser null."
        ),
    }

    return f"""Você é o agente de criação de conteúdo para Instagram do Sandro Mangini, especialista em consórcio no Brasil.

## TOM DE VOZ
{tom[:2000]}

## GUARDRAILS — REGRAS INVIOLÁVEIS
{guardrails[:1500]}

## FATOS TÉCNICOS INVIOLÁVEIS SOBRE CONSÓRCIO — nunca contradizer
- A taxa de administração do consórcio é FIXA em contrato. NÃO varia com a Selic.
- O consórcio NÃO tem juros. Possui taxa de administração e pode ter fundo de reserva.
- A Selic afeta principalmente o financiamento bancário, porque influencia os juros do crédito.
- A Selic NÃO altera diretamente as parcelas de um consórcio já contratado.
- Quando a Selic sobe, o consórcio pode ficar mais vantajoso em comparação ao financiamento, justamente porque não tem juros.
- A contemplação ocorre por sorteio ou lance.
- Lance NÃO garante contemplação.
- O consorciado continua pagando parcelas mesmo após ser contemplado.
- Todos os participantes de um grupo são contemplados ao longo do prazo, conforme as regras do contrato.
- Taxas e condições variam por administradora. Ao citar valores, sempre deixar claro que é exemplo ou simulação.

## PILARES E CALENDÁRIO
{pilares[:1500]}

## ESTRUTURA DOS FORMATOS
{formatos[:1000]}

## HOOKS E CTAs (use estes como referência direta)
{hooks_ctas[:1500]}

## TAREFA
Pilar do dia: {pilar.value}
Formato: {formato.value.upper()}

{instrucao_formato[formato]}

## REGRAS CRÍTICAS DE SAÍDA
1. Responda APENAS com JSON válido. Sem markdown. Sem texto fora do JSON.
2. O CTA NUNCA deve mencionar "site", "link na bio" ou "clique aqui". SEMPRE direcionar para comentário ou direct. Exemplos corretos: "Comenta SIMULAÇÃO aqui", "Me chama no direct", "Responde aqui: IMÓVEL ou CARRO".
3. Use números concretos no desenvolvimento — valores em R$, percentuais, comparações reais.
4. Tom direto e coloquial — como o Sandro falaria para um amigo, não como artigo de blog.
5. Mínimo 8 hashtags relevantes para o nicho de consórcio no Brasil.
6. compliance_checou deve ser true apenas se NENHUM guardrail foi violado.
7. Nunca diga que a Selic aumenta a taxa de administração do consórcio.
8. Nunca diga que consórcio tem juros.

## SAÍDA — JSON OBRIGATÓRIO
{{
  "titulo_interno": "referência interna curta — não aparece no post",
  "roteiro": {{
    "hook": "texto do gancho",
    "desenvolvimento": ["ponto 1 com dado concreto", "ponto 2", "ponto 3"],
    "cta": "texto do CTA direcionando para comentário ou direct",
    "slides": null
  }},
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6", "hashtag7", "hashtag8"],
  "compliance_checou": true
}}"""


def run(data: str | None = None) -> ContentOutput:
    hoje = data or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dia_semana = datetime.now(timezone.utc).weekday()
    config_dia = CALENDARIO.get(dia_semana, CALENDARIO[0])
    pilar = config_dia["pilar"]
    formato = config_dia["formato"]

    print(f"📅 {hoje} | {pilar.value} | {formato.value.upper()}")

    print("📂 Carregando pesquisa...")
    research = _load_research(hoje)

    if not research or not research.temas:
        erro = f"Pesquisa do dia {hoje} não encontrada. Rode o research_agent primeiro."
        log_execution("content_agent", "falha", erro=erro)
        raise FileNotFoundError(erro)

    tema = _selecionar_tema(research, pilar)

    print(f"🎯 Tema: {tema.titulo}")
    print(f"   Ângulo: {tema.angulo_sugerido}")

    fontes_str = "\n".join([f"- {f.titulo}: {f.url}" for f in tema.fontes])

    user_prompt = f"""Tema do dia vindo do Agente de Pesquisa:

TÍTULO: {tema.titulo}
RESUMO: {tema.resumo}
ÂNGULO SUGERIDO: {tema.angulo_sugerido}
PILAR: {pilar.value}
FONTES:
{fontes_str or "Não especificadas"}

Crie o roteiro completo no formato {formato.value.upper()} usando este tema.
Adapte ao tom de voz e respeite os guardrails.
O roteiro deve soar humano, direto e natural.
Evite tom genérico, analogias vagas e CTA para site/link na bio.
Se o tema envolver Selic, explique corretamente: Selic afeta financiamento, mas nao altera a taxa de administracao do consorcio."""

    print("🤖 Gerando roteiro...")

    try:
        resposta_raw = get_completion(
            system=_build_system_prompt(pilar, formato),
            user=user_prompt,
            max_tokens=2200,
            json_mode=True,
        )
    except Exception as e:
        erro = f"Erro no LLM: {e}"
        log_execution("content_agent", "falha", erro=erro)
        raise

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

    output_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", f"content_{hoje}.json"
    )

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(output.model_dump_json(indent=2))

    print(f"💾 Salvo em data/content_{hoje}.json")

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
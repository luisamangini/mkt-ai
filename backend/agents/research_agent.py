import json
import os
from datetime import datetime, timezone

from backend.core.llm import get_completion
from backend.core.search import search_web
from backend.core.logger import log_execution
from schemas.research import ResearchOutput
from backend.models.enums import StatusAgente


def _load_knowledge(relative_path: str) -> str:
    base = os.path.join(os.path.dirname(__file__), "..", "..", "knowledge")
    path = os.path.join(base, relative_path)

    try:
        with open(path, "r", encoding="utf-8") as file:
            return file.read()
    except FileNotFoundError:
        return ""


def _build_search_queries() -> list[str]:
    hoje = datetime.now(timezone.utc).strftime("%d/%m/%Y")
    ano_mes = datetime.now(timezone.utc).strftime("%Y-%m")

    return [
        f"consórcio imóvel novidade notícia {ano_mes}",
        f"taxa Selic decisão Copom impacto {ano_mes}",
        f"preço carro aumento queda mercado Brasil {ano_mes}",
        f"consórcio contemplação lance record {ano_mes}",
        f"financiamento imóvel juros banco Brasil {ano_mes}",
    ]

def _build_system_prompt() -> str:
    pilares = _load_knowledge("content/pillars_and_calendar.md")
    personas = _load_knowledge("brand/personas.md")
    guardrails = _load_knowledge("brand/compliance_guardrails.md")

    return f"""
Você é um agente especializado em pesquisa de mercado para conteúdo sobre consórcios no Brasil.

Sua função é analisar notícias recentes e transformar essas notícias em oportunidades de conteúdo para Instagram.

Pilares de conteúdo:
{pilares[:2000]}

Personas:
{personas[:1200]}

Guardrails:
{guardrails[:800]}

Regras:
1. Selecione de 2 a 3 temas relevantes.
2. Priorize temas ligados a consórcio, Selic, mercado imobiliário, mercado automotivo e planejamento financeiro.
3. Escreva em linguagem simples.
4. Nunca prometa contemplação, retorno financeiro ou resultado garantido.
5. Responda APENAS com JSON válido.

Formato obrigatório:
{{
  "temas": [
    {{
      "titulo": "string",
      "resumo": "string",
      "angulo_sugerido": "string",
      "pilar_sugerido": "Atualidades e Mercado",
      "relevancia": "alta",
      "fontes": [
        {{"titulo": "string", "url": "string"}}
      ]
    }}
  ]
}}

Valores aceitos para pilar_sugerido:
"Educação Financeira", "Mitos e Verdades", "Prova Social", "Atualidades e Mercado", "Conversão"

Valores aceitos para relevancia:
"alta", "media", "baixa"
"""


def run() -> ResearchOutput:
    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print("Buscando notícias...")

    resultados_brutos = []

    for query in _build_search_queries():
        try:
            resultados = search_web(query=query, max_results=3)
            resultados_brutos.extend(resultados)
            print(f"OK busca: {query} ({len(resultados)} resultados)")
        except Exception as error:
            print(f"Erro na busca '{query}': {error}")

    if not resultados_brutos:
        erro = "Nenhum resultado retornado pela busca web."
        log_execution("research_agent", "falha", erro=erro)

        return ResearchOutput(
            data=hoje,
            gerado_em=datetime.now(timezone.utc),
            temas=[],
            status=StatusAgente.FALHA,
            erro=erro,
        )

    noticias_formatadas = "\n\n".join(
        [
            f"TITULO: {item['title']}\nURL: {item['url']}\nCONTEUDO: {item['content'][:500]}"
            for item in resultados_brutos[:9]
        ]
    )

    user_prompt = f"""
Data de hoje: {hoje}

Notícias encontradas:
{noticias_formatadas}

Com base nessas notícias, gere os 2 a 3 melhores temas de conteúdo para o público de consórcios.
"""

    print("Analisando com LLM...")

    try:
        resposta_raw = get_completion(
            system=_build_system_prompt(),
            user=user_prompt,
            max_tokens=1800,
            json_mode=True,
        )

        dados = json.loads(resposta_raw)

        output = ResearchOutput(
            data=hoje,
            gerado_em=datetime.now(timezone.utc),
            temas=dados["temas"],
            status=StatusAgente.OK,
        )

    except Exception as error:
        erro = f"Erro ao gerar ou validar resposta: {error}"
        log_execution("research_agent", "falha", erro=erro)

        return ResearchOutput(
            data=hoje,
            gerado_em=datetime.now(timezone.utc),
            temas=[],
            status=StatusAgente.FALHA,
            erro=erro,
        )

    output_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "data",
        f"research_{hoje}.json",
    )

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as file:
        file.write(output.model_dump_json(indent=2))

    log_execution(
        agent="research_agent",
        status="ok",
        resultado=f"{len(output.temas)} temas encontrados",
        metadata={"data": hoje},
    )

    print(f"JSON salvo em data/research_{hoje}.json")

    return output
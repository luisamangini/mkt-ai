import json
import os
from datetime import datetime, timezone

from backend.core.llm import get_completion
from backend.core.logger import log_execution
from backend.core.search import search_web
from backend.models.enums import StatusAgente
from schemas.research import ResearchOutput


def _load_knowledge(relative_path: str) -> str:
    base = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "knowledge",
    )
    path = os.path.join(base, relative_path)

    try:
        with open(path, "r", encoding="utf-8") as file:
            return file.read()
    except FileNotFoundError:
        return ""


def _build_search_queries() -> list[str]:
    ano_mes = datetime.now(timezone.utc).strftime("%Y-%m")

    return [
        f"consórcio imóvel novidade notícia {ano_mes}",
        f"taxa Selic decisão Copom impacto {ano_mes}",
        f"preço carro aumento queda mercado Brasil {ano_mes}",
        f"consórcio contemplação lance record {ano_mes}",
        f"financiamento imóvel juros banco Brasil {ano_mes}",
    ]


def _build_system_prompt() -> str:
    pilares = _load_knowledge(
        "content/pillars_and_calendar.md"
    )
    personas = _load_knowledge(
        "brand/personas.md"
    )
    guardrails = _load_knowledge(
        "brand/compliance_guardrails.md"
    )

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
        {{
          "titulo": "string",
          "url": "string"
        }}
      ]
    }}
  ]
}}

Valores aceitos para pilar_sugerido:
"Educação Financeira", "Mitos e Verdades", "Prova Social", "Atualidades e Mercado", "Conversão"

Valores aceitos para relevancia:
"alta", "media", "baixa"
""".strip()


def run() -> ResearchOutput:
    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print("Buscando notícias...")

    resultados_brutos: list[dict] = []
    erros_busca: list[str] = []
    total_buscas = 0
    buscas_com_sucesso = 0

    for query in _build_search_queries():
        total_buscas += 1

        try:
            resultados = search_web(
                query=query,
                max_results=3,
            )

            if resultados:
                resultados_brutos.extend(resultados)
                buscas_com_sucesso += 1

            print(
                f"OK busca: {query} "
                f"({len(resultados)} resultados)"
            )

        except Exception as error:
            mensagem_erro = (
                f"Erro na busca '{query}': {error}"
            )
            erros_busca.append(mensagem_erro)
            print(mensagem_erro)

    # Falha fatal: nenhuma das buscas conseguiu produzir resultados.
    # O agente registra a falha e lança uma exceção para que API,
    # orquestrador e n8n interrompam corretamente o fluxo.
    if not resultados_brutos:
        detalhes = " | ".join(erros_busca)

        erro = (
            "Nenhum resultado foi obtido pela busca web. "
            f"Buscas executadas: {total_buscas}. "
            f"Buscas com resultados: {buscas_com_sucesso}."
        )

        if detalhes:
            erro = f"{erro} Erros: {detalhes}"

        log_execution(
            agent="research_agent",
            status="falha",
            erro=erro,
            metadata={
                "data": hoje,
                "total_buscas": total_buscas,
                "buscas_com_sucesso": buscas_com_sucesso,
                "erros_busca": erros_busca,
            },
        )

        raise RuntimeError(erro)

    noticias_formatadas = "\n\n".join(
        [
            (
                f"TITULO: {item.get('title', '')}\n"
                f"URL: {item.get('url', '')}\n"
                f"CONTEUDO: {item.get('content', '')[:500]}"
            )
            for item in resultados_brutos[:9]
        ]
    )

    user_prompt = f"""
Data de hoje: {hoje}

Notícias encontradas:
{noticias_formatadas}

Com base nessas notícias, gere os 2 a 3 melhores temas de conteúdo para o público de consórcios.
""".strip()

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
        erro = (
            "Erro ao gerar ou validar a resposta do "
            f"Research Agent: {error}"
        )

        log_execution(
            agent="research_agent",
            status="falha",
            erro=erro,
            metadata={
                "data": hoje,
                "resultados_busca": len(resultados_brutos),
                "buscas_com_sucesso": buscas_com_sucesso,
            },
        )

        raise RuntimeError(erro) from error

    output_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "data",
        f"research_{hoje}.json",
    )

    os.makedirs(
        os.path.dirname(output_path),
        exist_ok=True,
    )

    with open(
        output_path,
        "w",
        encoding="utf-8",
    ) as file:
        file.write(
            output.model_dump_json(indent=2)
        )

    log_execution(
        agent="research_agent",
        status="ok",
        resultado=f"{len(output.temas)} temas encontrados",
        metadata={
            "data": hoje,
            "total_buscas": total_buscas,
            "buscas_com_sucesso": buscas_com_sucesso,
            "resultados_encontrados": len(resultados_brutos),
        },
    )

    print(
        f"JSON salvo em data/research_{hoje}.json"
    )

    return output
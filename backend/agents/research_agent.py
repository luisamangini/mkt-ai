import json
import os
from datetime import datetime, timezone

from backend.config.settings import (
    RESEARCH_MAX_SEARCHES,
    SEARCH_PROVIDER,
)
from backend.core.llm import get_completion
from backend.core.logger import log_execution
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
        f"consórcio contemplação lance recorde {ano_mes}",
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
4. Use fatos concretos, números, datas e fontes reais.
5. Evite matérias antigas, genéricas ou sem novidade.
6. Nunca prometa contemplação, retorno financeiro ou resultado garantido.
7. Responda APENAS com JSON válido.

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


def _carregar_json_resposta(
    resposta_raw: str,
) -> dict:
    """
    Extrai e valida o objeto JSON retornado pelo LLM.

    Aceita JSON puro, texto antes do JSON e blocos Markdown.
    """
    texto = resposta_raw.strip()

    if texto.startswith("```"):
        linhas = texto.splitlines()

        if linhas and linhas[0].strip().startswith("```"):
            linhas = linhas[1:]

        if linhas and linhas[-1].strip() == "```":
            linhas = linhas[:-1]

        texto = "\n".join(linhas).strip()

    inicio = texto.find("{")
    fim = texto.rfind("}")

    if inicio == -1 or fim == -1 or fim < inicio:
        raise ValueError(
            "O LLM não retornou um objeto JSON identificável. "
            f"Resposta recebida: {texto[:500]!r}"
        )

    json_texto = texto[inicio: fim + 1]

    try:
        dados = json.loads(json_texto)
    except json.JSONDecodeError as exc:
        raise ValueError(
            "O JSON retornado pelo LLM é inválido. "
            f"Erro: {exc}. "
            f"Resposta: {json_texto[:800]!r}"
        ) from exc

    if not isinstance(dados, dict):
        raise ValueError(
            "A resposta deve ser um objeto JSON."
        )

    temas = dados.get("temas")

    if not isinstance(temas, list):
        raise ValueError(
            "O JSON não contém a lista obrigatória 'temas'."
        )

    if not temas:
        raise ValueError(
            "O Research Agent retornou uma lista vazia de temas."
        )

    return dados


def _salvar_output(
    output: ResearchOutput,
    hoje: str,
    metadata: dict,
) -> None:
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
        resultado=(
            f"{len(output.temas)} temas encontrados"
        ),
        metadata=metadata,
    )

    print(
        f"JSON salvo em data/research_{hoje}.json"
    )


def _run_anthropic(
    hoje: str,
) -> ResearchOutput:
    print(
        "Buscando e analisando notícias via "
        "Anthropic Web Search..."
    )

    user_prompt = f"""
Data de hoje: {hoje}

Pesquise notícias publicadas hoje ou nesta semana sobre:

1. Consórcio no Brasil
2. Taxa Selic e decisões do Copom
3. Mercado imobiliário
4. Mercado automotivo
5. Crédito, financiamento e planejamento financeiro

Selecione de 2 a 3 temas com maior potencial de conteúdo
para o público de consórcio.

Para cada tema:
- use dados concretos;
- inclua números, datas e percentuais quando disponíveis;
- cite fontes reais;
- evite artigos genéricos ou antigos;
- sugira um ângulo claro para Reel ou Carrossel.
""".strip()

    resposta_raw = get_completion(
        system=_build_system_prompt(),
        user=user_prompt,
        max_tokens=4000,
        json_mode=True,
        use_web_search=True,
        max_searches=RESEARCH_MAX_SEARCHES,
    )

    dados = _carregar_json_resposta(
        resposta_raw
    )

    output = ResearchOutput(
        data=hoje,
        gerado_em=datetime.now(timezone.utc),
        temas=dados["temas"],
        status=StatusAgente.OK,
    )

    _salvar_output(
        output=output,
        hoje=hoje,
        metadata={
            "data": hoje,
            "provider": "anthropic",
            "max_searches": RESEARCH_MAX_SEARCHES,
            "temas": len(output.temas),
            "titulos": [
                tema.titulo
                for tema in output.temas
            ],
        },
    )

    return output


def _run_tavily(
    hoje: str,
) -> ResearchOutput:
    from backend.core.search import search_web

    print("Buscando notícias via Tavily...")

    resultados_brutos: list[dict] = []
    erros_busca: list[str] = []
    total_buscas = 0
    buscas_com_sucesso = 0

    queries = _build_search_queries()[
        :RESEARCH_MAX_SEARCHES
    ]

    for query in queries:
        total_buscas += 1

        try:
            resultados = search_web(
                query=query,
                max_results=3,
            )

            if resultados:
                resultados_brutos.extend(
                    resultados
                )
                buscas_com_sucesso += 1

            print(
                f"OK busca: {query} "
                f"({len(resultados)} resultados)"
            )

        except Exception as error:
            mensagem = (
                f"Erro na busca '{query}': {error}"
            )
            erros_busca.append(mensagem)
            print(mensagem)

    if not resultados_brutos:
        detalhes = " | ".join(erros_busca)

        erro = (
            "Nenhum resultado foi obtido pela busca web. "
            f"Buscas executadas: {total_buscas}. "
            f"Buscas com resultados: {buscas_com_sucesso}."
        )

        if detalhes:
            erro = f"{erro} Erros: {detalhes}"

        raise RuntimeError(erro)

    noticias_formatadas = "\n\n".join(
        (
            f"TÍTULO: {item.get('title', '')}\n"
            f"URL: {item.get('url', '')}\n"
            f"CONTEÚDO: "
            f"{item.get('content', '')[:500]}"
        )
        for item in resultados_brutos[:9]
    )

    user_prompt = f"""
Data de hoje: {hoje}

Notícias encontradas:
{noticias_formatadas}

Com base nessas notícias, gere os 2 a 3 melhores temas
de conteúdo para o público de consórcios.
""".strip()

    print("Analisando notícias com LLM...")

    resposta_raw = get_completion(
        system=_build_system_prompt(),
        user=user_prompt,
        max_tokens=2200,
        json_mode=True,
    )

    dados = _carregar_json_resposta(
        resposta_raw
    )

    output = ResearchOutput(
        data=hoje,
        gerado_em=datetime.now(timezone.utc),
        temas=dados["temas"],
        status=StatusAgente.OK,
    )

    _salvar_output(
        output=output,
        hoje=hoje,
        metadata={
            "data": hoje,
            "provider": "tavily",
            "total_buscas": total_buscas,
            "buscas_com_sucesso": (
                buscas_com_sucesso
            ),
            "resultados_encontrados": len(
                resultados_brutos
            ),
            "temas": len(output.temas),
        },
    )

    return output


def run() -> ResearchOutput:
    hoje = datetime.now(
        timezone.utc
    ).strftime("%Y-%m-%d")

    print("=" * 60)
    print("AGENTE DE PESQUISA")
    print("=" * 60)
    print("Buscando notícias...")

    try:
        if SEARCH_PROVIDER == "anthropic":
            return _run_anthropic(hoje)

        if SEARCH_PROVIDER == "tavily":
            return _run_tavily(hoje)

        raise ValueError(
            f"SEARCH_PROVIDER inválido: "
            f"'{SEARCH_PROVIDER}'. "
            "Use 'anthropic' ou 'tavily'."
        )

    except Exception as error:
        erro = (
            "Erro ao executar o Research Agent: "
            f"{error}"
        )

        log_execution(
            agent="research_agent",
            status="falha",
            erro=erro,
            metadata={
                "data": hoje,
                "provider": SEARCH_PROVIDER,
                "max_searches": (
                    RESEARCH_MAX_SEARCHES
                ),
            },
        )

        raise RuntimeError(erro) from error
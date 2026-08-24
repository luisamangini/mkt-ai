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
        f"consórcio Brasil regulamentação Banco Central novidade {ano_mes}",
        f"comportamento consumidor planejamento compra pesquisa Brasil {ano_mes}",
        f"educação financeira direitos consumidor golpes notícia {ano_mes}",
        f"mercado imobiliário tendências consumo Brasil {ano_mes}",
        f"mercado automotivo tendências consumo Brasil {ano_mes}",
    ]


def _formatar_historico_tematico(
    pesquisas: list[dict],
) -> str:
    itens: list[str] = []

    for pesquisa in pesquisas:
        data = str(pesquisa.get("data", "data desconhecida"))
        temas = pesquisa.get("temas")
        if not isinstance(temas, list):
            continue

        for tema in temas:
            if not isinstance(tema, dict):
                continue
            titulo = str(tema.get("titulo", "")).strip()
            if not titulo:
                continue
            resumo = str(tema.get("resumo", "")).strip()[:350]
            pilar = str(tema.get("pilar_sugerido", "")).strip()
            angulo = str(tema.get("angulo_sugerido", "")).strip()[:220]
            itens.append(
                f"- Data: {data}\n"
                f"  Título: {titulo}\n"
                f"  Resumo/tese: {resumo}\n"
                f"  Pilar: {pilar}\n"
                f"  Oportunidade usada: {angulo}"
            )

    if not itens:
        return "Nenhum tema persistido nos últimos 90 dias."

    return "\n".join(itens)


def _build_system_prompt(historico_tematico: str) -> str:
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

Memória temática — temas usados nos últimos 90 dias:
{historico_tematico}

Regras:
1. Selecione no máximo 3 temas relevantes. Retorne somente 1 ou 2 quando não houver 3 opções novas, atuais e bem sustentadas. Se não houver nenhuma opção válida, retorne "temas": []. Nunca invente um tema para completar quantidade.
2. Rejeite qualquer candidato substancialmente semelhante à memória temática, mesmo que título, formato ou ângulo superficial tenham mudado. Compare assunto central, tese principal, fato/notícia principal, pergunta central e oportunidade de conteúdo.
3. Um tema recente só pode voltar quando houver fato novo material: nova decisão oficial, lei ou regulação, dado oficial, recorde, mudança relevante de mercado ou evento que altere substancialmente a conclusão anterior. Nesse caso, explicite no resumo qual é o fato novo, sua data e por que ele justifica revisitar o assunto.
4. Os temas da mesma execução também devem ser semanticamente distintos entre si. Não selecione três variações do mesmo eixo.
5. Busque diversidade entre Atualidades, Economia, Mercado imobiliário, Mercado automotivo, Educação financeira, Mitos e verdades, Tendências de consumo, Comportamento do consumidor, Dados do setor de consórcios, Regulação/legislação, Comparações financeiras e Prova social/cases. Quando houver material confiável, cubra pelo menos 2 eixos diferentes.
6. Escreva em linguagem simples.
7. Use fatos concretos, números, datas e fontes reais.
8. Evite matérias antigas, genéricas ou sem novidade.
9. Nunca prometa contemplação, retorno financeiro ou resultado garantido.
10. Responda APENAS com JSON válido.

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
    historico_tematico: str,
) -> ResearchOutput:
    print(
        "Buscando e analisando notícias via "
        "Anthropic Web Search..."
    )

    user_prompt = f"""
Data de hoje: {hoje}

Pesquise notícias publicadas hoje ou nesta semana em diferentes eixos relevantes para o público de consórcio. Avalie também regulação, comportamento do consumidor, tendências de consumo, educação financeira, dados oficiais do setor e cases, sem se limitar a Selic, imóveis e automóveis.

Selecione até 3 temas realmente novos em relação à memória de 90 dias fornecida no prompt de sistema.

Para cada tema:
- use dados concretos;
- inclua números, datas e percentuais quando disponíveis;
- cite fontes reais;
- evite artigos genéricos ou antigos;
- sugira um ângulo claro para Reel ou Carrossel.
""".strip()

    resposta_raw = get_completion(
        system=_build_system_prompt(historico_tematico),
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
    historico_tematico: str,
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

Com base nessas notícias, selecione até 3 temas realmente novos em relação à memória de 90 dias fornecida no prompt de sistema. Retorne menos temas quando os candidatos forem repetitivos ou insuficientemente sustentados.
""".strip()

    print("Analisando notícias com LLM...")

    resposta_raw = get_completion(
        system=_build_system_prompt(historico_tematico),
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
        from backend.integrations.supabase import get_pesquisas

        historico_tematico = _formatar_historico_tematico(
            get_pesquisas("ultimos_90_dias")
        )

        if SEARCH_PROVIDER == "anthropic":
            return _run_anthropic(hoje, historico_tematico)

        if SEARCH_PROVIDER == "tavily":
            return _run_tavily(hoje, historico_tematico)

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

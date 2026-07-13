# backend/agents/content_agent.py

import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone

sys.path.insert(
    0,
    os.path.join(os.path.dirname(__file__), "..", ".."),
)

from backend.core.llm import get_completion
from backend.core.logger import log_execution
from backend.models.enums import (
    FormatoConteudo,
    Pilar,
    StatusRevisao,
)
from schemas.content import (
    ContentDiario,
    ContentOutput,
    RoteiroConteudo,
    SlideCarrossel,
)
from schemas.research import ResearchOutput, TemaResearch


# Formato recomendado para cada pilar.
FORMATO_POR_PILAR = {
    Pilar.ATUALIDADES_E_MERCADO: FormatoConteudo.REEL,
    Pilar.MITOS_E_VERDADES: FormatoConteudo.REEL,
    Pilar.EDUCACAO_FINANCEIRA: FormatoConteudo.CARROSSEL,
    Pilar.PROVA_SOCIAL: FormatoConteudo.REEL,
    Pilar.CONVERSAO: FormatoConteudo.STORIES,
}


# Limite de tokens ajustado ao tamanho esperado de cada formato.
MAX_TOKENS_POR_FORMATO = {
    FormatoConteudo.REEL: 1800,
    FormatoConteudo.CARROSSEL: 3000,
    FormatoConteudo.STORIES: 1800,
}


# Hashtags de apoio usadas apenas quando o modelo retorna menos de oito.
HASHTAGS_BASE = [
    "consorcio",
    "planejamentofinanceiro",
    "educacaofinanceira",
    "organizacaofinanceira",
    "compraplanejada",
    "patrimonio",
    "imovel",
    "veiculo",
]

HASHTAGS_POR_PILAR = {
    Pilar.ATUALIDADES_E_MERCADO: [
        "mercadofinanceiro",
        "economiabrasileira",
        "selic",
        "mercadoimobiliario",
    ],
    Pilar.MITOS_E_VERDADES: [
        "mitoseverdades",
        "consorciosemmitos",
        "duvidasdeconsorcio",
        "consorcioconsciente",
    ],
    Pilar.EDUCACAO_FINANCEIRA: [
        "financaspessoais",
        "decisaofinanceira",
        "planejamentopatrimonial",
        "consorcioimobiliario",
    ],
    Pilar.PROVA_SOCIAL: [
        "historiasreais",
        "clientes",
        "resultadosreais",
        "experienciadocliente",
    ],
    Pilar.CONVERSAO: [
        "simulacaodeconsorcio",
        "cartadecredito",
        "consorcioparavoce",
        "falecomumespecialista",
    ],
}


def _load_knowledge(filename: str) -> str:
    base = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "knowledge",
    )
    path = os.path.join(base, filename)

    try:
        with open(path, "r", encoding="utf-8") as arquivo:
            return arquivo.read()
    except FileNotFoundError:
        return f"[arquivo não encontrado: {filename}]"


def _load_research(data: str) -> ResearchOutput | None:
    path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "data",
        f"research_{data}.json",
    )

    if not os.path.exists(path):
        return None

    with open(path, "r", encoding="utf-8") as arquivo:
        dados = json.load(arquivo)

    return ResearchOutput(**dados)


def _normalizar_texto(texto: str) -> str:
    """Normaliza texto para comparação e remoção de duplicações."""
    return " ".join(
        str(texto or "")
        .lower()
        .strip()
        .split()
    )


def _normalizar_hashtag(hashtag: object) -> str:
    """
    Remove acentos, espaços, caracteres inválidos e o símbolo #.

    Exemplo:
    Educação Financeira -> educacaofinanceira
    """
    texto = str(hashtag or "").strip().lstrip("#")

    texto = unicodedata.normalize(
        "NFKD",
        texto,
    ).encode(
        "ascii",
        "ignore",
    ).decode(
        "ascii",
    )

    texto = texto.lower()
    texto = re.sub(r"\s+", "", texto)
    texto = re.sub(r"[^a-z0-9_]", "", texto)

    return texto


def _normalizar_hashtags(
    hashtags_raw: list | None,
    pilar: Pilar,
) -> list[str]:
    """
    Normaliza, remove duplicações e garante entre 8 e 12 hashtags.

    Hashtags adicionais vêm de uma lista controlada e compatível
    com o nicho e com o pilar do conteúdo.
    """
    hashtags: list[str] = []

    candidatas = list(hashtags_raw or [])
    candidatas.extend(HASHTAGS_POR_PILAR.get(pilar, []))
    candidatas.extend(HASHTAGS_BASE)

    for hashtag in candidatas:
        hashtag_limpa = _normalizar_hashtag(hashtag)

        if not hashtag_limpa:
            continue

        if hashtag_limpa in hashtags:
            continue

        hashtags.append(hashtag_limpa)

        if len(hashtags) >= 12:
            break

    return hashtags[:12]


def _processar_slides(
    slides_raw: list[dict] | None,
    formato: FormatoConteudo,
) -> list[SlideCarrossel] | None:
    """
    Normaliza e valida os slides.

    Para Reel e Stories, slides sempre será None.
    Para Carrossel, remove duplicações exatas, renumera e valida
    a quantidade e a integridade mínima dos textos.
    """
    if formato != FormatoConteudo.CARROSSEL:
        return None

    if not slides_raw:
        raise ValueError(
            "O modelo não retornou slides para o carrossel."
        )

    textos_vistos: set[str] = set()
    slides_processados: list[SlideCarrossel] = []

    finais_suspeitos = (
        " e",
        " ou",
        " para",
        " porque",
        " com",
        " sem",
        " de",
        " da",
        " do",
        " dos",
        " das",
        ",",
        ":",
        ";",
    )

    for slide_raw in slides_raw:
        texto = str(
            slide_raw.get("texto", "")
        ).strip()

        texto_normalizado = _normalizar_texto(texto)

        if not texto_normalizado:
            continue

        if texto_normalizado in textos_vistos:
            continue

        if len(texto) < 12:
            raise ValueError(
                f"Slide muito curto ou incompleto: '{texto}'"
            )

        if texto_normalizado.endswith(finais_suspeitos):
            raise ValueError(
                f"Slide possivelmente truncado: '{texto}'"
            )

        textos_vistos.add(texto_normalizado)

        slides_processados.append(
            SlideCarrossel(
                ordem=len(slides_processados) + 1,
                texto=texto,
            )
        )

    if len(slides_processados) < 5:
        raise ValueError(
            "O carrossel precisa ter no mínimo cinco slides "
            "com conteúdo único e completo."
        )

    if len(slides_processados) > 8:
        slides_processados = slides_processados[:8]

        # Garante que o último slide continue sendo o CTA original.
        ultimo_slide_raw = slides_raw[-1]
        ultimo_texto = str(
            ultimo_slide_raw.get("texto", "")
        ).strip()

        if (
            ultimo_texto
            and _normalizar_texto(ultimo_texto)
            != _normalizar_texto(
                slides_processados[-1].texto
            )
        ):
            slides_processados[-1] = SlideCarrossel(
                ordem=8,
                texto=ultimo_texto,
            )

    return slides_processados


def _build_system_prompt(
    pilar: Pilar,
    formato: FormatoConteudo,
) -> str:
    tom = _load_knowledge(
        "brand/tone_of_voice.md"
    )
    guardrails = _load_knowledge(
        "brand/compliance_guardrails.md"
    )
    formatos = _load_knowledge(
        "content/formats.md"
    )
    hooks_ctas = _load_knowledge(
        "content/hooks_and_ctas.md"
    )
    pilares = _load_knowledge(
        "content/pillars_and_calendar.md"
    )

    instrucao_formato = {
    FormatoConteudo.REEL: (
        "Gere um roteiro de REEL seguindo EXATAMENTE este template:\n\n"
        "HOOK: [DADO CONCRETO ou SITUAÇÃO] — [CONSEQUÊNCIA ou TENSÃO]\n"
        "Exemplos obrigatórios de estrutura:\n"
        "  'A Selic caiu para 14,5% — e isso muda o jogo pra quem quer comprar imóvel.'\n"
        "  'Carro usado subiu 12% em 6 meses. Mas existe uma saída sem pagar juros.'\n"
        "  'Consórcio cresceu 18% em 2026 — e a maioria das pessoas ainda não sabe por quê.'\n"
        "PROIBIDO começar com: 'Você sabia', 'Será que', 'Você já pensou'.\n\n"
        "DESENVOLVIMENTO: exatamente 3 bullets. Cada bullet:\n"
        "  - máximo 15 palavras\n"
        "  - ensina UM conceito concreto\n"
        "  - NUNCA repete o hook\n"
        "  - NUNCA usa frases vagas como 'isso é importante' ou 'é uma boa opção'\n\n"
        "CTA: uma pergunta ou ação específica. Máximo 20 palavras.\n"
        "Exemplos: 'Comenta SELIC aqui.' / 'Me chama no direct.' / 'Comenta 1 se imóvel ou 2 se carro.'\n\n"
        "slides deve ser null."
    ),
    FormatoConteudo.CARROSSEL: (
        "Gere um CARROSSEL com exatamente 6 slides.\n\n"
        "REGRA CRÍTICA: cada slide deve ter NO MÁXIMO 12 palavras. Textos curtos.\n\n"
        "Slide 1 (CAPA): título impactante. Máximo 8 palavras.\n"
        "Slides 2, 3, 4 (DESENVOLVIMENTO): 1 conceito por slide. Máximo 12 palavras cada.\n"
        "Slide 5 (APLICAÇÃO): como isso afeta o público. Máximo 12 palavras.\n"
        "Slide 6 (CTA): ação específica. Máximo 10 palavras.\n\n"
        "PROIBIDO cortar texto no meio. Se não couber em 12 palavras, simplifique.\n"
        "NUNCA repita o conteúdo entre slides.\n\n"
        "O array slides DEVE ter exatamente 6 itens numerados de 1 a 6."
    ),
    FormatoConteudo.STORIES: (
        "Gere uma sequência de STORIES:\n\n"
        "HOOK: Primeira tela. Máximo 10 palavras.\n"
        "DESENVOLVIMENTO: [\n"
        "  'Enquete: [pergunta direta]? [opção A] ou [opção B]',\n"
        "  'Caixinha: Manda aqui sua maior dúvida sobre [tema]'\n"
        "]\n"
        "CTA: 'Me chama no direct' ou 'Comenta [palavra] aqui'.\n\n"
        "slides deve ser null."
    ),
}
    return f"""
Você é o agente de criação de conteúdo para o Instagram de Sandro Mangini, especialista em consórcio no Brasil.

Sua função é transformar um tema pesquisado em um conteúdo útil, específico, interessante e compatível com o jeito de Sandro se comunicar.

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

## FATOS TÉCNICOS INVIOLÁVEIS

- A taxa de administração do consórcio é definida em contrato.
- A taxa de administração não acompanha automaticamente a Selic.
- O consórcio não utiliza juros como um financiamento tradicional.
- Podem existir taxa de administração, fundo de reserva e outros encargos contratuais.
- A contemplação ocorre por sorteio ou lance.
- Um lance não garante contemplação.
- O consorciado continua pagando as parcelas após ser contemplado.
- Condições, taxas e regras variam conforme a administradora e o grupo.
- Nunca apresente consórcio como investimento com rentabilidade garantida.
- Nunca prometa contemplação, economia ou aprovação garantida.

## O QUE É UM BOM HOOK

Um bom hook:
- apresenta tensão, contraste, dúvida ou consequência prática;
- é específico para o tema;
- pode ser entendido imediatamente;
- não depende de uma introdução longa.

Exemplos de estrutura:
- "A taxa mudou. Mas será que isso muda alguma coisa no consórcio?"
- "Financiamento e consórcio parecem semelhantes, mas o custo funciona de outro jeito."
- "O erro não é escolher consórcio. É entrar sem entender o prazo."

Não copie os exemplos literalmente. Adapte ao tema recebido.

## O QUE NÃO FAZER

- Não começar com "Você sabia que".
- Não criar estatísticas sem fonte.
- Não usar expressões vagas como "o mercado está mudando".
- Não repetir a mesma ideia no hook, no desenvolvimento e nos slides.
- Não usar CTA genérico como "saiba mais".
- Não direcionar para site ou link.
- Não declarar que consórcio é sempre a melhor opção.
- Não comparar produtos sem apresentar contexto.

## TAREFA

Pilar: {pilar.value}
Formato: {formato.value.upper()}

{instrucao_formato[formato]}

## HASHTAGS

Gere entre 8 e 12 hashtags relevantes para o conteúdo e para o nicho de consórcio no Brasil.

Regras:
- Escreva sem o símbolo #.
- Não use espaços.
- Prefira hashtags sem acentos.
- Não repita hashtags.
- Misture hashtags amplas, específicas e relacionadas ao pilar.
- Não utilize palavras cortadas ou incompletas.

## SAÍDA — JSON OBRIGATÓRIO

Responda somente com JSON válido.
Não use markdown.
Não escreva nenhuma explicação fora do JSON.

{{
  "titulo_interno": "referência interna curta e clara",
  "roteiro": {{
    "hook": "texto completo do gancho",
    "desenvolvimento": [
      "ponto concreto 1",
      "ponto concreto 2",
      "ponto concreto 3"
    ],
    "cta": "uma ação específica direcionada a comentário ou direct",
    "slides": [
      {{
        "ordem": 1,
        "texto": "texto completo do slide"
      }}
    ]
  }},
  "hashtags": [
    "consorcio",
    "educacaofinanceira"
  ],
  "compliance_checou": true
}}

Use slides somente para CARROSSEL.
Para REEL e STORIES, retorne "slides": null.

compliance_checou deve ser true somente se:
- nenhum guardrail foi violado;
- nenhum fato foi inventado;
- nenhuma promessa indevida foi feita;
- o texto não apresenta contemplação como garantida.
""".strip()


def _gerar_roteiro_para_tema(
    tema: TemaResearch,
    hoje: str,
) -> ContentOutput:
    pilar = tema.pilar_sugerido
    formato = FORMATO_POR_PILAR.get(
        pilar,
        FormatoConteudo.REEL,
    )

    print(f"\n   Tema: {tema.titulo}")
    print(
        f"     Pilar: {pilar.value} "
        f"→ Formato: {formato.value.upper()}"
    )

    fontes_str = "\n".join(
        [
            f"- {fonte.titulo}: {fonte.url}"
            for fonte in tema.fontes
        ]
    )

    user_prompt = f"""
Tema selecionado pelo Agente de Pesquisa:

TÍTULO: {tema.titulo}
RESUMO: {tema.resumo}
ÂNGULO SUGERIDO: {tema.angulo_sugerido}
PILAR: {pilar.value}

FONTES:
{fontes_str or "Não especificadas"}

Crie um roteiro completo no formato {formato.value.upper()}.

Use somente fatos presentes no título, resumo, ângulo e fontes fornecidas.
Não invente percentuais, estatísticas, acontecimentos ou condições comerciais.

O conteúdo deve:
- ensinar algo prático;
- apresentar consequência ou aplicação para o público;
- soar como Sandro conversando com uma pessoa;
- evitar linguagem institucional;
- evitar frases vagas;
- não repetir o mesmo argumento em diferentes partes.
""".strip()

    max_tokens = MAX_TOKENS_POR_FORMATO.get(
        formato,
        2000,
    )

    resposta_raw = get_completion(
        system=_build_system_prompt(
            pilar,
            formato,
        ),
        user=user_prompt,
        max_tokens=max_tokens,
        json_mode=True,
    )

    dados = json.loads(resposta_raw)

    roteiro_raw = dados.get("roteiro")

    if not isinstance(roteiro_raw, dict):
        raise ValueError(
            "O modelo não retornou o objeto 'roteiro'."
        )

    hook = str(
        roteiro_raw.get("hook", "")
    ).strip()

    desenvolvimento = roteiro_raw.get(
        "desenvolvimento",
        [],
    )

    cta = str(
        roteiro_raw.get("cta", "")
    ).strip()

    if not hook:
        raise ValueError(
            "O modelo retornou um hook vazio."
        )

    if not isinstance(desenvolvimento, list):
        raise ValueError(
            "O campo desenvolvimento deve ser uma lista."
        )

    desenvolvimento = [
        str(item).strip()
        for item in desenvolvimento
        if str(item).strip()
    ]

    if not desenvolvimento:
        raise ValueError(
            "O modelo não retornou desenvolvimento válido."
        )

    if not cta:
        raise ValueError(
            "O modelo retornou um CTA vazio."
        )

    slides = _processar_slides(
        roteiro_raw.get("slides"),
        formato,
    )

    hashtags = _normalizar_hashtags(
        dados.get("hashtags"),
        pilar,
    )

    roteiro = RoteiroConteudo(
        hook=hook,
        desenvolvimento=desenvolvimento,
        cta=cta,
        slides=slides,
    )

    return ContentOutput(
        data=hoje,
        gerado_em=datetime.now(timezone.utc),
        pilar=pilar,
        formato=formato,
        titulo_interno=str(
            dados.get(
                "titulo_interno",
                tema.titulo,
            )
        ).strip(),
        roteiro=roteiro,
        hashtags=hashtags,
        compliance_checou=bool(
            dados.get(
                "compliance_checou",
                False,
            )
        ),
        revisao_humana=StatusRevisao.PENDENTE,
    )


def run(
    data: str | None = None,
) -> ContentDiario:
    """
    Gera um roteiro para cada tema retornado pelo Research Agent.
    """
    hoje = data or datetime.now(
        timezone.utc
    ).strftime("%Y-%m-%d")

    print(
        f" {hoje} — gerando roteiros por tema"
    )

    print(" Carregando pesquisa...")

    research = _load_research(hoje)

    if not research or not research.temas:
        erro = (
            f"Pesquisa do dia {hoje} não encontrada. "
            "Rode o research_agent primeiro."
        )

        log_execution(
            agent="content_agent",
            status="falha",
            erro=erro,
            metadata={
                "data": hoje,
                "etapa": "carregar_pesquisa",
            },
        )

        raise FileNotFoundError(erro)

    print(
        f"   {len(research.temas)} temas encontrados "
        f"— gerando {len(research.temas)} roteiros"
    )

    roteiros: list[ContentOutput] = []
    erros: list[str] = []

    for indice, tema in enumerate(
        research.temas,
        start=1,
    ):
        print(
            f"\nRoteiro {indice}/"
            f"{len(research.temas)}..."
        )

        try:
            roteiro = _gerar_roteiro_para_tema(
                tema,
                hoje,
            )

            roteiros.append(roteiro)

            print(
                f" Gerado: "
                f"{roteiro.titulo_interno}"
            )

        except Exception as error:
            erro = (
                f"Erro no tema '{tema.titulo}': "
                f"{error}"
            )

            erros.append(erro)
            print(f"  {erro}")

    if not roteiros:
        erro = (
            "Nenhum roteiro foi gerado. "
            f"Erros: {'; '.join(erros)}"
        )

        log_execution(
            agent="content_agent",
            status="falha",
            erro=erro,
            metadata={
                "data": hoje,
                "total_temas": len(
                    research.temas
                ),
                "erros": erros,
            },
        )

        raise ValueError(erro)

    output = ContentDiario(
        data=hoje,
        gerado_em=datetime.now(
            timezone.utc
        ),
        total_roteiros=len(roteiros),
        roteiros=roteiros,
    )

    output_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "data",
        f"content_{hoje}.json",
    )

    os.makedirs(
        os.path.dirname(output_path),
        exist_ok=True,
    )

    with open(
        output_path,
        "w",
        encoding="utf-8",
    ) as arquivo:
        arquivo.write(
            output.model_dump_json(indent=2)
        )

    print(
        f"\n {len(roteiros)} roteiros salvos em "
        f"data/content_{hoje}.json"
    )

    titulos = [
        roteiro.titulo_interno
        for roteiro in roteiros
    ]

    formatos = [
        roteiro.formato.value
        for roteiro in roteiros
    ]

    log_execution(
        agent="content_agent",
        status="ok",
        resultado=(
            f"{len(roteiros)} roteiros gerados"
        ),
        metadata={
            "data": hoje,
            "total": len(roteiros),
            "titulos": titulos,
            "formatos": formatos,
            "erros": erros,
        },
    )

    return output
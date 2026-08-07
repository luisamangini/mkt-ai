import json
import os
import re
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.core.llm import get_completion
from backend.core.logger import log_execution
from backend.integrations.supabase import (
    get_leads_ativos,
    get_interacoes_lead,
    inserir_interacao,
    atualizar_lead,
)
from schemas.qualification import QualificationOutput, QualificationAction
from backend.models.enums import PrioridadeLead, StatusLead


def _load_knowledge(filename: str) -> str:
    base = os.path.join(os.path.dirname(__file__), "..", "..", "knowledge")
    path = os.path.join(base, filename)

    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return f"[arquivo não encontrado: {filename}]"


def _carregar_json_resposta(resposta_raw: str) -> dict:
    """
    Converte a resposta do LLM em dicionário.

    Aceita:
    - JSON puro
    - JSON dentro de bloco ```json
    - Texto adicional antes ou depois do JSON
    """
    if not resposta_raw or not resposta_raw.strip():
        raise ValueError("O LLM retornou uma resposta vazia.")

    texto = resposta_raw.strip()

    texto = re.sub(
        r"^```(?:json)?\s*",
        "",
        texto,
        flags=re.IGNORECASE,
    )
    texto = re.sub(r"\s*```$", "", texto)
    texto = texto.strip()

    try:
        dados = json.loads(texto)
    except json.JSONDecodeError:
        inicio = texto.find("{")
        fim = texto.rfind("}")

        if inicio == -1 or fim == -1 or fim <= inicio:
            raise ValueError(
                "Não foi possível encontrar um objeto JSON válido "
                "na resposta do LLM."
            )

        trecho_json = texto[inicio: fim + 1]

        try:
            dados = json.loads(trecho_json)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"A resposta do LLM contém JSON inválido: {e}"
            ) from e

    if not isinstance(dados, dict):
        raise ValueError("A resposta do LLM deve ser um objeto JSON.")

    return dados


def _normalizar_enum(valor: object) -> str:
    texto = str(valor or "").lower().strip()

    substituicoes = {
        "á": "a",
        "à": "a",
        "ã": "a",
        "â": "a",
        "é": "e",
        "ê": "e",
        "í": "i",
        "ó": "o",
        "ô": "o",
        "õ": "o",
        "ú": "u",
        "ç": "c",
        " ": "_",
        "-": "_",
    }

    for antigo, novo in substituicoes.items():
        texto = texto.replace(antigo, novo)

    return texto


def _parse_prioridade(valor: object) -> PrioridadeLead:
    prioridade = _normalizar_enum(valor)

    if prioridade in {item.value for item in PrioridadeLead}:
        return PrioridadeLead(prioridade)

    return PrioridadeLead.MEDIA


def _parse_status_lead(valor: object) -> StatusLead | None:
    status = _normalizar_enum(valor)

    if not status or status in {"none", "null", "nenhum"}:
        return None

    if status in {item.value for item in StatusLead}:
        return StatusLead(status)

    return None


def _formatar_lead_para_prompt(
    lead: dict,
    interacoes: list[dict],
) -> str:
    tempo_sem_contato = "desconhecido"

    if lead.get("ultimo_contato"):
        try:
            ultimo = datetime.fromisoformat(
                lead["ultimo_contato"].replace("Z", "+00:00")
            )
            delta = datetime.now(timezone.utc) - ultimo
            tempo_sem_contato = f"{delta.days} dia(s)"
        except Exception:
            tempo_sem_contato = "erro ao calcular"

    historico_str = "Nenhuma interação registrada."

    if interacoes:
        historico_str = "\n".join(
            [
                (
                    f"[{i.get('criado_em', '')[:10]}] "
                    f"{i.get('tipo', '')}: "
                    f"{i.get('nota', '')}"
                )
                for i in interacoes[:5]
            ]
        )

    return f"""
LEAD: {lead.get('nome', 'Sem nome')}
ID: {lead.get('id', '')}
Status: {lead.get('status', '')}
Origem: {lead.get('origem', '')}
Objetivo: {lead.get('objetivo', 'não informado')}
Valor carta: R$ {lead.get('valor_carta', 'não informado')}
Prazo de uso: {lead.get('prazo_uso', 'não informado')}
Conhece consórcio: {lead.get('conhece_consorcio', 'não informado')}
Qualificado: {lead.get('qualificado', 'não avaliado')}
Último contato: {tempo_sem_contato} atrás
Precisa follow-up: {lead.get('precisa_followup', False)}
Lead frio (>7 dias): {lead.get('lead_frio', False)}
Observações: {lead.get('observacoes', 'nenhuma')}

Histórico de interações:
{historico_str}
""".strip()


def _build_system_prompt() -> str:
    qualification = _load_knowledge(
        "sales/qualification_playbook.md"
    )
    crm = _load_knowledge(
        "sales/crm_and_funnel.md"
    )
    objections = _load_knowledge(
        "sales/objections_and_faq.md"
    )
    tom = _load_knowledge(
        "brand/tone_of_voice.md"
    )
    guardrails = _load_knowledge(
        "brand/compliance_guardrails.md"
    )

    return f"""Você é o Agente de Qualificação de Leads do Sandro Mangini, especialista em consórcio no Brasil.

Sua função é analisar um lead ativo do CRM, entender sua situação e sugerir a ação mais adequada para o operador humano.

Você NÃO executa ações sozinho.
Você NÃO envia mensagens sozinho.
Você NÃO promete contemplação.
Você apenas recomenda o próximo passo.

## ROTEIRO DE QUALIFICAÇÃO
{qualification[:3000]}

## CRM E FUNIL
{crm[:1200]}

## OBJEÇÕES E FAQ
{objections[:1200]}

## TOM DE VOZ
{tom[:1000]}

## GUARDRAILS
{guardrails[:800]}

## CRITÉRIOS DE PRIORIDADE

PRIORIDADE ALTA:
- Lead frio há mais de 7 dias
- Lead qualificado que pediu simulação e não recebeu follow-up há mais de 2 dias
- Lead em negociação parado há mais de 5 dias
- Lead com prazo imediato e sem próximo passo claro

PRIORIDADE MÉDIA:
- Lead parado entre 3 e 7 dias
- Lead novo que ainda não passou pela qualificação
- Lead qualificado aguardando simulação

PRIORIDADE BAIXA:
- Lead com contato recente, menos de 3 dias
- Lead que acabou de entrar há menos de 24 horas

## QUANDO O LEAD É NOVO E NÃO PASSOU PELA QUALIFICAÇÃO

Se o lead não tem objetivo, valor_carta, prazo_uso ou conhece_consorcio preenchidos, a mensagem_reengajamento deve conter perguntas do roteiro de qualificação.

Use uma abordagem parecida com:

"Oi [Nome]! Vi seu interesse e consigo te ajudar melhor se eu entender rapidinho seu objetivo. Você está pensando em consórcio para imóvel, carro ou patrimônio? Mais ou menos qual valor de carta você tem em mente? E você pretende usar esse crédito agora, em até 1 ano, em até 2 anos ou está sem pressa?"

Quando faltarem dados, NÃO tente vender diretamente.
Primeiro ajude o operador a coletar as informações certas.

## PRÓXIMO PASSO POR SITUAÇÃO

Lead novo sem qualificação:
- Aplicar as perguntas do roteiro

Lead qualificado com prazo imediato:
- Sugerir simulação e estratégia de lance, sem prometer contemplação

Lead qualificado com prazo de até 1 ano:
- Enviar simulação e comparar com financiamento

Lead qualificado sem pressa:
- Focar em planejamento, custos e previsibilidade

Lead que não conhece consórcio:
- Explicar o básico antes de oferecer simulação

Lead com objetivo patrimônio:
- Apresentar opções de administradoras/parceiras e estratégia de longo prazo

Lead em negociação parado:
- Entender o que está travando a decisão

## SAÍDA — JSON OBRIGATÓRIO

Responda APENAS com JSON válido.
Sem markdown.
Sem bloco de código.
Sem texto fora do JSON.

Gere exatamente UMA ação para o lead analisado.

{{
  "acoes": [
    {{
      "lead_id": "uuid exato do lead",
      "lead_nome": "nome exato do lead",
      "prioridade": "alta",
      "acao_sugerida": "instrução clara e objetiva para o operador",
      "proximo_passo": "próximo passo contextual",
      "mensagem_reengajamento": "texto pronto para enviar no WhatsApp ou null",
      "novo_status_sugerido": "qualificado",
      "registrar_no_historico": "texto curto que será gravado no CRM",
      "executar": false
    }}
  ],
  "resumo": "resumo curto da situação deste lead"
}}

REGRAS CRÍTICAS:
1. executar é SEMPRE false.
2. Nunca prometer contemplação garantida.
3. Nunca pressionar o lead.
4. A mensagem deve ser específica para o lead.
5. Se faltar dado de qualificação, gere perguntas antes de vender.
6. Se novo_status_sugerido não fizer sentido, use null.
7. Retorne exatamente uma ação.
8. Preserve exatamente o ID recebido.
"""


def _analisar_um_lead_com_llm(
    lead_formatado: str,
) -> tuple[dict, str]:
    user_prompt = f"""Analise este único lead do CRM:

{lead_formatado}

Faça o seguinte:
1. Avalie a prioridade.
2. Defina o próximo passo.
3. Gere uma mensagem de reengajamento quando fizer sentido.
4. Sugira atualização de status apenas quando fizer sentido.
5. Nunca execute nenhuma ação automaticamente.
6. Retorne somente o JSON solicitado."""

    resposta_raw = get_completion(
        system=_build_system_prompt(),
        user=user_prompt,
        max_tokens=2000,
        json_mode=True,
    )

    dados = _carregar_json_resposta(resposta_raw)
    acoes = dados.get("acoes", [])

    if not isinstance(acoes, list) or not acoes:
        raise ValueError(
            "O LLM não retornou nenhuma ação para o lead."
        )

    if not isinstance(acoes[0], dict):
        raise ValueError(
            "A ação retornada pelo LLM possui formato inválido."
        )

    return acoes[0], str(dados.get("resumo", "")).strip()


def _analisar_leads_com_llm(
    leads_formatados: list[str],
) -> tuple[list[dict], str]:
    """
    Analisa um lead por chamada para evitar respostas cortadas
    pelo limite de tokens da Anthropic.
    """
    acoes: list[dict] = []
    resumos: list[str] = []

    total = len(leads_formatados)

    for indice, lead_formatado in enumerate(
        leads_formatados,
        start=1,
    ):
        print(f"   Analisando lead {indice}/{total}...")

        try:
            acao, resumo = _analisar_um_lead_com_llm(
                lead_formatado
            )
            acoes.append(acao)

            if resumo:
                resumos.append(resumo)

        except Exception as e:
            print(
                f"   Erro ao analisar lead {indice}/{total}: {e}"
            )

    if not acoes:
        raise ValueError(
            "Nenhum lead pôde ser analisado pelo LLM."
        )

    resumo_geral = (
        f"{len(acoes)} de {total} leads foram analisados. "
        "As ações sugeridas aguardam revisão humana."
    )

    if resumos:
        resumo_geral += " " + " ".join(resumos)

    return acoes, resumo_geral


def run() -> QualificationOutput:
    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print("=" * 50)
    print("Agente de Qualificação — iniciando")
    print("=" * 50)

    print("\nBuscando leads ativos...")
    leads = get_leads_ativos()

    if not leads:
        output = QualificationOutput(
            data=hoje,
            total_leads_analisados=0,
            acoes=[],
            leads_prioritarios=0,
            leads_frios=0,
            resumo="Nenhum lead ativo no CRM hoje.",
        )

        log_execution(
            "qualification_agent",
            "ok",
            resultado="Nenhum lead ativo",
        )

        return output

    print(f"{len(leads)} leads encontrados")

    leads_formatados: list[str] = []

    print("\nCarregando histórico dos leads...")

    for lead in leads:
        interacoes = get_interacoes_lead(lead["id"])

        leads_formatados.append(
            _formatar_lead_para_prompt(
                lead,
                interacoes,
            )
        )

        status_followup = (
            "precisa follow-up"
            if lead.get("precisa_followup")
            else "ok"
        )

        print(
            f"• {lead['nome']} | "
            f"{lead['status']} | "
            f"{status_followup}"
        )

    print("\nAnalisando leads com LLM...")

    try:
        acoes_raw, resumo = _analisar_leads_com_llm(
            leads_formatados
        )
    except Exception as e:
        erro = f"Erro na análise do LLM: {e}"

        log_execution(
            "qualification_agent",
            "falha",
            erro=erro,
        )

        raise

    print("\nValidando e registrando ações...")

    acoes_validadas: list[QualificationAction] = []
    leads_prioritarios = 0
    leads_frios = 0

    for acao_raw in acoes_raw:
        try:
            acao = QualificationAction(
                lead_id=acao_raw["lead_id"],
                lead_nome=acao_raw["lead_nome"],
                prioridade=_parse_prioridade(
                    acao_raw.get("prioridade")
                ),
                acao_sugerida=acao_raw["acao_sugerida"],
                proximo_passo=acao_raw["proximo_passo"],
                mensagem_reengajamento=acao_raw.get(
                    "mensagem_reengajamento"
                ),
                novo_status_sugerido=_parse_status_lead(
                    acao_raw.get("novo_status_sugerido")
                ),
                registrar_no_historico=acao_raw[
                    "registrar_no_historico"
                ],
                executar=False,
            )

            inserir_interacao(
                lead_id=acao.lead_id,
                tipo="agente_sugestao",
                nota=acao.registrar_no_historico,
                proximo_passo=acao.proximo_passo,
            )

            if acao.novo_status_sugerido:
                atualizar_lead(
                    acao.lead_id,
                    {
                        "status": (
                            acao.novo_status_sugerido.value
                        )
                    },
                )

            acoes_validadas.append(acao)

            if acao.prioridade == PrioridadeLead.ALTA:
                leads_prioritarios += 1

            lead_data = next(
                (
                    lead
                    for lead in leads
                    if lead["id"] == acao.lead_id
                ),
                None,
            )

            if lead_data and lead_data.get("lead_frio"):
                leads_frios += 1

            print(
                f"✓ {acao.lead_nome} "
                f"[{acao.prioridade.value}] — "
                f"{acao.acao_sugerida[:70]}..."
            )

        except Exception as e:
            print(f"Erro ao processar ação: {e}")

    output = QualificationOutput(
        data=hoje,
        total_leads_analisados=len(leads),
        acoes=acoes_validadas,
        leads_prioritarios=leads_prioritarios,
        leads_frios=leads_frios,
        resumo=resumo,
    )

    log_execution(
        agent="qualification_agent",
        status="ok",
        resultado=(
            f"{len(acoes_validadas)} ações geradas | "
            f"{leads_prioritarios} prioritários | "
            f"{leads_frios} frios"
        ),
        metadata={
            "data": hoje,
            "total_leads": len(leads),
            "acoes_geradas": len(acoes_validadas),
        },
    )

    return output
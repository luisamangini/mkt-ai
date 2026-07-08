import json
import os
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


def _formatar_lead_para_prompt(lead: dict, interacoes: list[dict]) -> str:
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
                f"[{i.get('criado_em', '')[:10]}] {i.get('tipo', '')}: {i.get('nota', '')}"
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
    qualification = _load_knowledge("sales/qualification_playbook.md")
    crm = _load_knowledge("sales/crm_and_funnel.md")
    objections = _load_knowledge("sales/objections_and_faq.md")
    tom = _load_knowledge("brand/tone_of_voice.md")
    guardrails = _load_knowledge("brand/compliance_guardrails.md")

    return f"""Você é o Agente de Qualificação de Leads do Sandro Mangini, especialista em consórcio no Brasil.

Sua função é analisar leads ativos do CRM, entender a situação de cada um e sugerir a ação mais adequada para o operador humano.

Você NÃO executa ações sozinho.
Você NÃO envia mensagem sozinho.
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
- Lead que acabou de entrar há menos de 24h

## QUANDO O LEAD É NOVO E NÃO PASSOU PELA QUALIFICAÇÃO

Se o lead não tem objetivo, valor_carta, prazo_uso ou conhece_consorcio preenchidos,
a mensagem_reengajamento deve conter perguntas do roteiro de qualificação.

Use uma abordagem parecida com:

"Oi [Nome]! Vi seu interesse e consigo te ajudar melhor se eu entender rapidinho seu objetivo.
Você está pensando em consórcio para imóvel, carro ou patrimônio?
Mais ou menos qual valor de carta você tem em mente?
E você pretende usar esse crédito agora, em até 1 ano, em até 2 anos ou está sem pressa?"

Quando faltarem dados, NÃO tente vender direto.
Primeiro ajude o operador a coletar as informações certas.

## PRÓXIMO PASSO POR SITUAÇÃO

Lead novo sem qualificação:
- Aplicar as perguntas do roteiro

Lead qualificado com prazo imediato:
- Sugerir simulação e estratégia de lance, sem prometer contemplação

Lead qualificado com prazo de até 1 ano:
- Enviar simulação e comparar com financiamento

Lead qualificado sem pressa:
- Focar em planejamento sem juros e previsibilidade

Lead que não conhece consórcio:
- Explicar o básico antes de oferecer simulação

Lead com objetivo patrimônio:
- Apresentar opções de administradoras/parceiras e estratégia de longo prazo

Lead em negociação parado:
- Entender o que está travando a decisão

## SAÍDA — JSON OBRIGATÓRIO

Responda APENAS com JSON válido. Sem markdown. Sem texto fora do JSON.
Gere UMA ação por lead analisado.

{{
  "acoes": [
    {{
      "lead_id": "uuid do lead",
      "lead_nome": "nome do lead",
      "prioridade": "alta",
      "acao_sugerida": "instrução clara para o operador",
      "proximo_passo": "próximo passo contextual",
      "mensagem_reengajamento": "texto pronto para enviar no WhatsApp ou null",
      "novo_status_sugerido": "qualificado",
      "registrar_no_historico": "texto que será gravado no CRM",
      "executar": false
    }}
  ],
  "resumo": "resumo geral em 2-3 frases para o operador"
}}

REGRAS CRÍTICAS:
1. executar é SEMPRE false.
2. Nunca prometer contemplação garantida.
3. Nunca pressionar o lead.
4. A mensagem deve ser específica para aquele lead.
5. Se faltar dado de qualificação, gere perguntas antes de vender.
6. Se novo_status_sugerido não fizer sentido, use null.
"""


def _analisar_leads_com_llm(leads_formatados: str, total_leads: int) -> tuple[list[dict], str]:
    user_prompt = f"""Analise estes {total_leads} leads do CRM e gere uma ação específica para cada um:

{leads_formatados}

Para cada lead:
1. Avalie a prioridade.
2. Defina o próximo passo.
3. Gere mensagem de reengajamento quando fizer sentido.
4. Sugira atualização de status apenas se fizer sentido.
5. Nunca execute ação automaticamente."""

    resposta_raw = get_completion(
        system=_build_system_prompt(),
        user=user_prompt,
        max_tokens=3000,
        json_mode=True,
    )

    dados = json.loads(resposta_raw)
    return dados.get("acoes", []), dados.get("resumo", "")


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
        log_execution("qualification_agent", "ok", resultado="Nenhum lead ativo")
        return output

    print(f"{len(leads)} leads encontrados")

    leads_formatados = []

    print("\nCarregando histórico dos leads...")
    for lead in leads:
        interacoes = get_interacoes_lead(lead["id"])
        leads_formatados.append(_formatar_lead_para_prompt(lead, interacoes))

        status_followup = "precisa follow-up" if lead.get("precisa_followup") else "ok"
        print(f"• {lead['nome']} | {lead['status']} | {status_followup}")

    leads_formatados_str = "\n\n---\n\n".join(leads_formatados)

    print("\nAnalisando leads com LLM...")
    try:
        acoes_raw, resumo = _analisar_leads_com_llm(
            leads_formatados_str,
            len(leads),
        )
    except Exception as e:
        erro = f"Erro na análise do LLM: {e}"
        log_execution("qualification_agent", "falha", erro=erro)
        raise

    print("\nValidando e registrando ações...")

    acoes_validadas = []
    leads_prioritarios = 0
    leads_frios = 0

    for acao_raw in acoes_raw:
        try:
            acao = QualificationAction(
                lead_id=acao_raw["lead_id"],
                lead_nome=acao_raw["lead_nome"],
                prioridade=PrioridadeLead(acao_raw["prioridade"]),
                acao_sugerida=acao_raw["acao_sugerida"],
                proximo_passo=acao_raw["proximo_passo"],
                mensagem_reengajamento=acao_raw.get("mensagem_reengajamento"),
                novo_status_sugerido=(
                    StatusLead(acao_raw["novo_status_sugerido"])
                    if acao_raw.get("novo_status_sugerido")
                    else None
                ),
                registrar_no_historico=acao_raw["registrar_no_historico"],
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
                    {"status": acao.novo_status_sugerido.value},
                )

            acoes_validadas.append(acao)

            if acao.prioridade == PrioridadeLead.ALTA:
                leads_prioritarios += 1

            lead_data = next((l for l in leads if l["id"] == acao.lead_id), None)
            if lead_data and lead_data.get("lead_frio"):
                leads_frios += 1

            print(f"✓ {acao.lead_nome} [{acao.prioridade.value}] — {acao.acao_sugerida[:70]}...")

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
        resultado=f"{len(acoes_validadas)} ações geradas | {leads_prioritarios} prioritários | {leads_frios} frios",
        metadata={"data": hoje, "total_leads": len(leads)},
    )

    return output
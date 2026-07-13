import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(
    0,
    os.path.join(os.path.dirname(__file__), "..", ".."),
)

from backend.core.llm import get_completion
from backend.core.logger import log_execution
from backend.integrations.dashboard_builder import build_snapshot
from schemas.analysis import AnalysisOutput
from schemas.dashboard import DashboardSnapshot


def _load_knowledge(filename: str) -> str:
    base = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "knowledge",
    )
    path = os.path.join(base, filename)

    try:
        with open(path, "r", encoding="utf-8") as file:
            return file.read()
    except FileNotFoundError:
        return f"[arquivo não encontrado: {filename}]"


def _formatar_snapshot_para_prompt(
    snapshot: DashboardSnapshot,
) -> str:
    """
    Converte o snapshot tipado em texto estruturado para o LLM.
    """

    if snapshot.anuncios.campanhas:
        campanhas_str = "\n".join(
            [
                (
                    f"- {campanha.nome[:60]} | "
                    f"Gasto: R$ {campanha.gasto:.2f} | "
                    f"Impressões: {campanha.impressoes} | "
                    f"Cliques: {campanha.cliques} | "
                    f"CTR: {campanha.ctr:.2f}% | "
                    f"Leads: {campanha.leads} | "
                    f"CPL: R$ {campanha.cpl:.2f}"
                )
                for campanha in snapshot.anuncios.campanhas
            ]
        )
    else:
        campanhas_str = (
            "Nenhuma campanha possui métricas no período analisado."
        )

    aviso_str = (
        f"\nAVISO SOBRE OS DADOS: {snapshot.aviso}"
        if snapshot.aviso
        else ""
    )

    return f"""
SEMANA: {snapshot.semana}
GERADO EM: {snapshot.gerado_em}
{aviso_str}

MÉTRICAS DE ANÚNCIOS — META ADS

Período solicitado: {snapshot.anuncios.periodo_solicitado}
Período utilizado: {snapshot.anuncios.periodo_utilizado}
Gasto total: R$ {snapshot.anuncios.gasto:.2f}
Impressões: {snapshot.anuncios.impressoes}
Alcance: {snapshot.anuncios.alcance}
Cliques: {snapshot.anuncios.cliques}
CTR: {snapshot.anuncios.ctr:.2f}%
CPM: R$ {snapshot.anuncios.cpm:.2f}
Leads via Meta: {snapshot.anuncios.leads_meta}
CPL bruto: R$ {snapshot.anuncios.cpl_bruto:.2f}
Frequência: {snapshot.anuncios.frequencia:.2f}
Hook rate: {snapshot.anuncios.hook_rate:.2f}%

CAMPANHAS

{campanhas_str}

MÉTRICAS DO CRM

Período: {snapshot.crm.periodo}
Leads novos: {snapshot.crm.leads_novos}
Leads qualificados: {snapshot.crm.leads_qualificados}
Leads em negociação: {snapshot.crm.leads_em_negociacao}
Leads fechados: {snapshot.crm.leads_fechados}
Leads perdidos: {snapshot.crm.leads_perdidos}
Taxa de qualificação: {snapshot.crm.taxa_qualificacao:.2%}
Taxa de fechamento: {snapshot.crm.taxa_fechamento:.2%}
Custo por lead qualificado: R$ {snapshot.crm.custo_lead_qualificado:.2f}
Custo por lead fechado: R$ {snapshot.crm.custo_lead_fechado:.2f}
""".strip()


def _build_system_prompt() -> str:
    benchmarks = _load_knowledge(
        "performance/kpis_and_benchmarks.md"
    )
    playbook = _load_knowledge(
        "performance/analysis_playbook.md"
    )
    guardrails = _load_knowledge(
        "brand/compliance_guardrails.md"
    )

    return f"""
Você é o Agente de Análise da plataforma de marketing de Sandro Mangini, especialista em consórcio no Brasil.

Sua responsabilidade é interpretar um DashboardSnapshot já calculado pelo sistema e produzir um diagnóstico semanal claro, honesto e acionável.

Você NÃO consulta APIs.
Você NÃO calcula métricas.
Você NÃO altera campanhas.
Você NÃO executa recomendações.
Você apenas interpreta os dados já fornecidos e sugere ações para aprovação humana.

BENCHMARKS E KPIs DE REFERÊNCIA

{benchmarks[:2500]}

PLAYBOOK DE ANÁLISE

{playbook[:2000]}

GUARDRAILS

{guardrails[:700]}

REGRAS OBRIGATÓRIAS

1. Não invente conclusões quando os dados estiverem zerados ou ausentes.

2. Quando não houver gasto, impressões ou campanhas com métricas, declare explicitamente que não há dados suficientes para avaliar desempenho de mídia.

3. Não trate automaticamente uma taxa de qualificação de 100% como erro. Ela pode ocorrer quando todos os leads do período já avançaram para qualificado, em negociação ou fechado.

4. Toda recomendação precisa conter:
- o que fazer;
- por que fazer;
- quando fazer.

5. Gere no máximo cinco recomendações, ordenadas por impacto.

6. Não apresente recomendações genéricas como:
- continuar monitorando;
- melhorar campanhas;
- analisar resultados.

7. Relacione Meta Ads e CRM apenas quando existirem dados suficientes para esse cruzamento.

8. Se não houver campanhas com métricas:
- melhor_campanha deve ser "Sem dados suficientes para comparar campanhas";
- pior_campanha deve ser "Sem dados suficientes para comparar campanhas".

9. Responda somente com JSON válido, sem markdown e sem texto externo.

FORMATO OBRIGATÓRIO

{{
  "situacao_geral": "Diagnóstico direto em duas ou três frases",
  "destaque_positivo": "Principal resultado positivo ou ausência de dados suficientes",
  "alerta": "Principal ponto de atenção ou null",
  "melhor_campanha": "Nome e justificativa ou mensagem de ausência de dados",
  "pior_campanha": "Nome e justificativa ou mensagem de ausência de dados",
  "recomendacoes": [
    "Ação específica com justificativa e prazo"
  ]
}}
""".strip()


def _analisar_snapshot(
    snapshot: DashboardSnapshot,
) -> dict:
    snapshot_formatado = _formatar_snapshot_para_prompt(
        snapshot
    )

    user_prompt = f"""
Analise o DashboardSnapshot abaixo e gere o diagnóstico semanal.

{snapshot_formatado}

Priorize honestidade sobre limitações dos dados e gere somente recomendações que possam ser executadas pelo operador.
""".strip()

    resposta_raw = get_completion(
        system=_build_system_prompt(),
        user=user_prompt,
        max_tokens=1500,
        json_mode=True,
    )

    return json.loads(resposta_raw)


def run(
    date_preset: str = "last_7d",
) -> AnalysisOutput:
    """
    Constrói o snapshot e gera a análise semanal.

    O agente apenas interpreta o snapshot.
    A formatação de e-mail será responsabilidade da API.
    """
    agora = datetime.now(timezone.utc)
    gerado_em = agora.isoformat()

    print("=" * 50)
    print("Agente de Análise — iniciando")
    print("=" * 50)

    print("\nConstruindo Dashboard Snapshot...")

    try:
        snapshot = build_snapshot(date_preset)
    except Exception as exc:
        erro = f"Erro ao construir snapshot: {exc}"

        log_execution(
            agent="analysis_agent",
            status="falha",
            erro=erro,
        )
        raise

    if snapshot.aviso:
        print(f"Aviso: {snapshot.aviso}")

    print("\nAnalisando snapshot com LLM...")

    try:
        dados = _analisar_snapshot(snapshot)
    except Exception as exc:
        erro = f"Erro ao analisar snapshot: {exc}"

        log_execution(
            agent="analysis_agent",
            status="falha",
            erro=erro,
        )
        raise

    print("Validando resposta...")

    try:
        output = AnalysisOutput(
            semana=snapshot.semana,
            gerado_em=gerado_em,
            situacao_geral=dados["situacao_geral"],
            destaque_positivo=dados[
                "destaque_positivo"
            ],
            alerta=dados.get("alerta"),
            melhor_campanha=dados[
                "melhor_campanha"
            ],
            pior_campanha=dados[
                "pior_campanha"
            ],
            recomendacoes=dados["recomendacoes"],
            resumo_email="",
        )
    except Exception as exc:
        resposta_resumida = str(dados)[:500]
        erro = (
            f"Erro ao validar resposta do agente: {exc}. "
            f"Resposta: {resposta_resumida}"
        )

        log_execution(
            agent="analysis_agent",
            status="falha",
            erro=erro,
        )
        raise ValueError(erro) from exc

    log_execution(
        agent="analysis_agent",
        status="ok",
        resultado=(
            f"Análise {snapshot.semana} gerada com "
            f"{len(output.recomendacoes)} recomendações"
        ),
        metadata={
            "semana": snapshot.semana,
            "periodo_solicitado": (
                snapshot.anuncios.periodo_solicitado
            ),
            "periodo_utilizado": (
                snapshot.anuncios.periodo_utilizado
            ),
            "gasto_meta": snapshot.anuncios.gasto,
            "leads_meta": snapshot.anuncios.leads_meta,
            "leads_em_negociacao": (
                snapshot.crm.leads_em_negociacao
            ),
            "aviso": snapshot.aviso,
        },
    )

    print("Análise validada com sucesso.")

    return output
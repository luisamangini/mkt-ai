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
from backend.integrations.supabase import get_snapshots_anteriores
from schemas.analysis import AnalysisOutput
from schemas.dashboard import DashboardSnapshot
from backend.config.settings import CPL_LIMITE_ALERTA


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


def _calcular_variacao(
    atual: float | int,
    anterior: float | int,
) -> str:
    """
    Calcula a variação percentual entre o valor atual e o anterior.
    """

    atual_float = float(atual or 0)
    anterior_float = float(anterior or 0)

    if anterior_float == 0:
        if atual_float == 0:
            return "Sem variação calculável: atual e anterior iguais a zero"

        return "N/A: semana anterior sem valor para comparação"

    variacao = (
        (atual_float - anterior_float)
        / anterior_float
    ) * 100

    if abs(variacao) < 0.05:
        return "Estável vs semana anterior"

    sinal = "aumentou" if variacao > 0 else "diminuiu"

    return (
        f"{sinal} {abs(variacao):.1f}% "
        "vs semana anterior"
    )


def _media_snapshots(
    snapshots: list[dict],
    campo: str,
) -> float:
    """
    Calcula a média de um campo numérico nos snapshots anteriores.
    """

    valores: list[float] = []

    for snapshot in snapshots:
        valor = snapshot.get(campo)

        if valor is None:
            continue

        try:
            valores.append(float(valor))
        except (TypeError, ValueError):
            continue

    if not valores:
        return 0.0

    return sum(valores) / len(valores)


def _formatar_historico(
    snapshot: DashboardSnapshot,
    anteriores: list[dict],
) -> str:
    """
    Formata a comparação entre o snapshot atual e o histórico.
    """

    if not anteriores:
        return (
            "HISTÓRICO COMPARATIVO\n\n"
            "Esta é a primeira semana com snapshot salvo. "
            "Não há histórico anterior para comparação."
        )

    semana_anterior = anteriores[0]

    media_cpl = _media_snapshots(
        anteriores,
        "cpl_bruto",
    )
    media_ctr = _media_snapshots(
        anteriores,
        "ctr",
    )
    media_gasto = _media_snapshots(
        anteriores,
        "gasto",
    )
    media_leads_meta = _media_snapshots(
        anteriores,
        "leads_meta",
    )
    media_qualificados = _media_snapshots(
        anteriores,
        "leads_qualificados",
    )
    media_fechados = _media_snapshots(
        anteriores,
        "leads_fechados",
    )

    return f"""
HISTÓRICO COMPARATIVO

Semanas anteriores consideradas: {len(anteriores)}
Semana anterior: {semana_anterior.get("semana", "não informada")}

CPL bruto atual:
R$ {snapshot.anuncios.cpl_bruto:.2f}
Variação: {_calcular_variacao(
    snapshot.anuncios.cpl_bruto,
    semana_anterior.get("cpl_bruto", 0),
)}
Média histórica: R$ {media_cpl:.2f}

CTR atual:
{snapshot.anuncios.ctr:.2f}%
Variação: {_calcular_variacao(
    snapshot.anuncios.ctr,
    semana_anterior.get("ctr", 0),
)}
Média histórica: {media_ctr:.2f}%

Gasto atual:
R$ {snapshot.anuncios.gasto:.2f}
Variação: {_calcular_variacao(
    snapshot.anuncios.gasto,
    semana_anterior.get("gasto", 0),
)}
Média histórica: R$ {media_gasto:.2f}

Leads via Meta atuais:
{snapshot.anuncios.leads_meta}
Variação: {_calcular_variacao(
    snapshot.anuncios.leads_meta,
    semana_anterior.get("leads_meta", 0),
)}
Média histórica: {media_leads_meta:.1f}

Leads qualificados atuais:
{snapshot.crm.leads_qualificados}
Variação: {_calcular_variacao(
    snapshot.crm.leads_qualificados,
    semana_anterior.get("leads_qualificados", 0),
)}
Média histórica: {media_qualificados:.1f}

Leads fechados atuais:
{snapshot.crm.leads_fechados}
Variação: {_calcular_variacao(
    snapshot.crm.leads_fechados,
    semana_anterior.get("leads_fechados", 0),
)}
Média histórica: {media_fechados:.1f}
""".strip()


def _formatar_snapshot_para_prompt(
    snapshot: DashboardSnapshot,
    anteriores: list[dict],
) -> str:
    """
    Converte o snapshot tipado e o histórico em texto estruturado
    para o LLM.
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

    historico_str = _formatar_historico(
        snapshot,
        anteriores,
    )

    instagram_str = ""

    if snapshot.instagram:
        instagram_str = f"""
MÉTRICAS ORGÂNICAS — INSTAGRAM

Username: @{snapshot.instagram.username}
Seguidores: {snapshot.instagram.seguidores}
Posts publicados: {snapshot.instagram.total_posts}
Alcance orgânico: {snapshot.instagram.alcance}
Visualizações: {snapshot.instagram.visualizacoes}
Visitas ao perfil: {snapshot.instagram.visitas_perfil}
""".strip()

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

{instagram_str}

{historico_str}
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

Você também recebe comparações com semanas anteriores quando existe histórico disponível.

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

3. Use o histórico comparativo quando ele estiver disponível.

4. Quando não existir histórico, declare claramente que esta é a primeira semana de dados e que ainda não há base de comparação.

5. Mencione variações superiores a 20% quando forem relevantes para a tomada de decisão.

6. Variações inferiores a 5% podem ser tratadas como estabilidade.

7. Não trate automaticamente uma taxa de qualificação de 100% como erro. Ela pode ocorrer quando todos os leads do período já avançaram para qualificado, em negociação ou fechado.

8. Toda recomendação precisa conter:
- o que fazer;
- por que fazer;
- quando fazer.

9. Gere no máximo cinco recomendações, ordenadas por impacto.

10. Não apresente recomendações genéricas como:
- continuar monitorando;
- melhorar campanhas;
- analisar resultados.

11. Relacione Meta Ads e CRM apenas quando existirem dados suficientes para esse cruzamento.

12. Se não houver campanhas com métricas:
- melhor_campanha deve ser "Sem dados suficientes para comparar campanhas";
- pior_campanha deve ser "Sem dados suficientes para comparar campanhas".

13. Responda somente com JSON válido, sem markdown e sem texto externo.

FORMATO OBRIGATÓRIO

{{
  "situacao_geral": "Diagnóstico direto em duas ou três frases, usando comparação histórica quando disponível",
  "destaque_positivo": "Principal resultado positivo ou ausência de dados suficientes",
  "alerta": "Principal ponto de atenção com dado concreto ou null",
  "melhor_campanha": "Nome e justificativa ou mensagem de ausência de dados",
  "pior_campanha": "Nome e justificativa ou mensagem de ausência de dados",
  "recomendacoes": [
    "Ação específica com justificativa e prazo"
  ]
}}
""".strip()


def _analisar_snapshot(
    snapshot: DashboardSnapshot,
    anteriores: list[dict],
) -> dict:
    snapshot_formatado = _formatar_snapshot_para_prompt(
        snapshot,
        anteriores,
    )

    user_prompt = f"""
Analise o DashboardSnapshot abaixo e gere o diagnóstico semanal.

{snapshot_formatado}

Priorize honestidade sobre limitações dos dados.

Use as comparações históricas somente quando houver base válida.

Gere somente recomendações que possam ser executadas pelo operador.
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
    Constrói e persiste o snapshot, busca o histórico e gera
    a análise semanal.

    O agente apenas interpreta os dados.
    A formatação de e-mail continua sendo responsabilidade da API.
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

    print("\nBuscando histórico de semanas anteriores...")

    try:
        anteriores = get_snapshots_anteriores(
            semana_atual=snapshot.semana,
            limite=4,
        )

        if anteriores:
            print(
                f"{len(anteriores)} semana(s) anterior(es) "
                "encontrada(s)."
            )

            for anterior in anteriores:
                semana_anterior = anterior.get(
                    "semana",
                    "não informada",
                )
                cpl_anterior = float(
                    anterior.get("cpl_bruto", 0) or 0
                )
                gasto_anterior = float(
                    anterior.get("gasto", 0) or 0
                )

                print(
                    f"- {semana_anterior} | "
                    f"CPL: R$ {cpl_anterior:.2f} | "
                    f"Gasto: R$ {gasto_anterior:.2f}"
                )
        else:
            print(
                "Nenhum histórico anterior encontrado. "
                "Esta é a primeira semana de dados."
            )

    except Exception as exc:
        print(
            "Falha ao buscar histórico: "
            f"{exc}. Continuando sem comparação."
        )
        anteriores = []

    print("\nAnalisando snapshot com LLM...")

    try:
        dados = _analisar_snapshot(
            snapshot,
            anteriores,
        )
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
        cpl_atual = float(
            snapshot.anuncios.cpl_bruto or 0
        )

        cpl_alerta_disparado = (
            cpl_atual > 0
            and cpl_atual > CPL_LIMITE_ALERTA
        )

        mensagem_alerta_cpl = None

        if cpl_alerta_disparado:
            if CPL_LIMITE_ALERTA > 0:
                percentual_acima = (
                    (
                        cpl_atual
                        - CPL_LIMITE_ALERTA
                    )
                    / CPL_LIMITE_ALERTA
                    * 100
                )
            else:
                percentual_acima = 0.0

            recomendacao_principal = (
                dados["recomendacoes"][0]
                if dados.get("recomendacoes")
                else (
                    "Revisar as campanhas ativas e reduzir "
                    "a verba das campanhas com maior CPL."
                )
            )

            mensagem_alerta_cpl = (
                f"CPL médio atual: R$ {cpl_atual:.2f}\n"
                f"Limite configurado: "
                f"R$ {CPL_LIMITE_ALERTA:.2f}\n"
                f"Variação: {percentual_acima:.1f}% "
                "acima do limite\n"
                f"Pior campanha: "
                f"{dados['pior_campanha']}\n\n"
                f"Ação sugerida: "
                f"{recomendacao_principal}"
            )

        output = AnalysisOutput(
            semana=snapshot.semana,
            gerado_em=gerado_em,
            situacao_geral=dados[
                "situacao_geral"
            ],
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
            recomendacoes=dados[
                "recomendacoes"
            ],
            resumo_email="",
            cpl_atual=cpl_atual,
            cpl_limite=CPL_LIMITE_ALERTA,
            cpl_alerta_disparado=(
                cpl_alerta_disparado
            ),
            mensagem_alerta_cpl=(
                mensagem_alerta_cpl
            ),
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
    
    if output.cpl_alerta_disparado:
        print(
            "\nCPL alto detectado: "
            f"R$ {output.cpl_atual:.2f} > "
            f"R$ {output.cpl_limite:.2f}"
        )

    elif output.cpl_atual == 0:
        print(
            "\nCPL igual a zero — sem campanhas "
            "ativas; alerta não disparado."
        )

    else:
        print(
            "\nCPL dentro do limite: "
            f"R$ {output.cpl_atual:.2f} <= "
            f"R$ {output.cpl_limite:.2f}"
        )

    log_execution(
        agent="analysis_agent",
        status="ok",
        resultado=(
            f"Análise {snapshot.semana} gerada com "
            f"{len(anteriores)} semana(s) de histórico e "
            f"{len(output.recomendacoes)} recomendações"
        ),
        metadata={
            "semana": snapshot.semana,
            "semanas_historico": len(anteriores),
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
                        "cpl_atual": (
                output.cpl_atual
            ),
            "cpl_limite": (
                output.cpl_limite
            ),
            "cpl_alerta_disparado": (
                output.cpl_alerta_disparado
            ),
            "aviso": snapshot.aviso,
        },
    )

    print("Análise validada com sucesso.")

    return output
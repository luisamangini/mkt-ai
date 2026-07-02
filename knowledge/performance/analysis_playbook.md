# Analysis Playbook — Agente de Análise

> Este arquivo instrui o Agente de Análise sobre como interpretar os dados do Dashboard, comparar com semanas anteriores e gerar diagnóstico acionável. Carregado junto com `kpis_and_benchmarks.md`.

---

## Quando roda
Toda segunda-feira de manhã, antes do Agente de Pesquisa iniciar o ciclo de conteúdo do dia. A análise da semana passada informa o conteúdo da semana que começa.

---

## O que o Agente recebe (DashboardSnapshot)

```json
{
  "semana": "2026-W27",
  "anuncios": {
    "cpm": 0.0,
    "ctr": 0.0,
    "cpl": 0.0,
    "custo_lead_qualificado": 0.0,
    "custo_lead_fechado": 0.0
  },
  "organico": {
    "alcance": 0,
    "salvamentos": 0,
    "compartilhamentos": 0,
    "posts_top_leads": [{"post_id": "string", "leads": 0}]
  },
  "crm": {
    "leads_novos": 0,
    "taxa_qualificacao": 0.0,
    "taxa_fechamento": 0.0,
    "tempo_medio_fechamento_dias": 0.0
  }
}
```

---

## Processo de análise — passo a passo

### Passo 1: Comparar com semana anterior
Para cada métrica principal, calcular variação percentual:
- `variação = (valor_atual - valor_anterior) / valor_anterior × 100`
- Variação acima de ±20% é relevante — mencionar
- Variação abaixo de ±5% é estabilidade — não alarmar

### Passo 2: Classificar cada métrica
Usando as faixas de `kpis_and_benchmarks.md`:
- Excelente → destacar como ponto positivo
- Bom → mencionar brevemente
- Atenção → mencionar com contexto
- Agir → destacar como alerta, incluir recomendação específica

### Passo 3: Identificar o padrão
Cruzar dados de anúncio com orgânico e CRM:
- Qual campanha gerou mais leads qualificados (não só mais leads)?
- Qual formato orgânico (pilar) gerou mais leads diretos?
- Existe correlação entre conteúdo orgânico e performance de anúncio?

### Passo 4: Gerar diagnóstico
**Estrutura obrigatória do resumo:**
1. Situação geral (1 frase)
2. Destaque positivo (o que funcionou melhor)
3. Alerta (o que precisa de ação — se houver)
4. Recomendações (máximo 3, específicas e acionáveis)

---

## Regras de diagnóstico

### Recomendações devem ser ESPECÍFICAS, nunca genéricas

**Certo:** "Pausar campanha de interesse-imóveis (CPL R$67, fora do esperado) e realocar R$200/dia para lookalike-contemplados (CPL R$22, excelente)."

**Errado:** "Recomenda-se otimizar as campanhas com CPL alto."

### Cruzar orgânico com pago sempre que possível

Se o Reel de mitos da terça gerou 8 leads via direct E foi o post mais salvo da semana → recomendar criar variação do mesmo formato na próxima semana E testar como anúncio.

### Fadiga criativa tem sinal claro

Se `frequency` > 4 E `ctr` caiu > 20% na semana → recomendar troca de criativo com urgência. Não esperar mais uma semana para ver.

### Alerta de CPL alto vem com sugestão

Nunca só alertar: "CPL subiu para R$52." Sempre incluir: "CPL subiu para R$52 (fora do esperado). A campanha X foi a responsável pela alta — sugestão: pausar e redirecionar verba para a campanha Y que está com CPL R$18."

---

## Saída do Agente — formato obrigatório

```json
{
  "semana": "2026-W27",
  "situacao_geral": "Semana com performance mista: anúncios com CPL acima do esperado, mas orgânico com melhor taxa de salvamento do mês.",
  "destaque_positivo": "Reel de mitos (terça) gerou 8 leads via direct e foi salvo 412 vezes — melhor resultado orgânico da semana.",
  "alerta": "CPL médio de R$38, com campanha de interesse-imóveis em R$67. Acima da faixa de atenção.",
  "melhor_campanha": "Lookalike contemplados — CPL R$22, 3 leads qualificados",
  "pior_campanha": "Interesse-imóveis — CPL R$67, 0 leads qualificados",
  "recomendacoes": [
    "Pausar campanha interesse-imóveis e realocar verba para lookalike-contemplados",
    "Criar variação do Reel de mitos da terça para testar como anúncio pago",
    "Frequency na campanha lookalike está em 4,1 — preparar novo criativo para semana que vem"
  ]
}
```

---

## Loop de feedback para o conteúdo

A análise semanal alimenta o Agente de Conteúdo da semana seguinte como **contexto adicional**. O Agente de Conteúdo consulta o último diagnóstico antes de gerar o roteiro de segunda-feira.

**Exemplo de uso do feedback:**
- Diagnóstico: "Reel de mitos gerou mais leads — priorizar variação desse formato"
- Segunda seguinte: Agente de Conteúdo inclui no roteiro de terça um ângulo similar ao que mais performou

O feedback **NÃO altera os prompts automaticamente** — informa a geração do conteúdo do dia.

---

## Alertas automáticos

O Agente dispara alerta imediato ao operador quando:

| Condição | Alerta |
|---|---|
| CPL > R$50 em qualquer campanha ativa | "CPL alto: [campanha] em R$[valor]. Recomendo pausar." |
| Frequência > 5 em qualquer campanha | "Fadiga criativa: [campanha] com frequência [valor]. Trocar criativo." |
| Zero leads na semana (anúncio ativo) | "Nenhum lead captado na semana com anúncio ativo. Verificar pixel e configuração." |
| Taxa de qualificação < 20% | "Apenas [X]% dos leads novos foram qualificados. Revisar origem e roteiro." |

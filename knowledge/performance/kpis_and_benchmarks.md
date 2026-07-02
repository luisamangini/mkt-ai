# KPIs e Benchmarks de Performance

> Este arquivo é carregado pelo Agente de Análise. Define o que é bom, aceitável e preocupante para cada métrica. Sem esta régua, o agente não consegue classificar resultados — só descreve números.
>
> Os valores de baseline e meta marcados como [CALIBRAR] devem ser preenchidos com dados reais após as primeiras 4 semanas de operação.

---

## Métricas de anúncios (Meta Ads)

### CPL — Custo por Lead

| Faixa | Classificação | Ação sugerida |
|---|---|---|
| Abaixo de R$15 | Excelente | Escalar orçamento |
| R$15–R$30 | Dentro do esperado | Manter, monitorar |
| R$30–R$50 | Atenção | Revisar criativo ou público |
| Acima de R$50 | Alto — agir | Pausar campanha, reformular |

**Baseline atual:** [CALIBRAR nas primeiras 4 semanas]
**Meta de médio prazo:** [CALIBRAR após 2 meses de dados]
**Fonte:** Meta Ads Insights API — `cost_per_action_type` filtrado por `action_type = lead`

---

### CTR — Taxa de Cliques

| Faixa | Classificação | O que indica |
|---|---|---|
| Acima de 2,5% | Excelente | Criativo chama muita atenção |
| 1,5%–2,5% | Bom | Criativo funcionando bem |
| 0,8%–1,5% | Aceitável | Criativo mediano, testar variação |
| Abaixo de 0,8% | Baixo | Trocar criativo urgente |

**Fonte:** `ctr` (clicks / impressions)

---

### CPM — Custo por Mil Impressões

| Faixa | Classificação | O que indica |
|---|---|---|
| Abaixo de R$15 | Excelente | Público barato |
| R$15–R$30 | Dentro do esperado | Normal para nicho financeiro |
| R$30–R$50 | Atenção | Público saturado ou muito concorrido |
| Acima de R$50 | Alto | Revisar segmentação |

**Contexto:** nicho financeiro tem CPM naturalmente mais alto que e-commerce. Comparar sempre com semanas anteriores, não com outros nichos.

---

### Frequência

| Faixa | Classificação | Ação |
|---|---|---|
| 1,0–2,0 | Ideal | Manter |
| 2,0–3,5 | Aceitável | Monitorar |
| 3,5–5,0 | Atenção | Renovar criativo em breve |
| Acima de 5,0 | Fadiga criativa | Trocar criativo imediatamente |

---

### Hook Rate (% que assistiu os primeiros 25% do vídeo)

| Faixa | Classificação | O que indica |
|---|---|---|
| Acima de 50% | Excelente | Gancho muito forte |
| 35%–50% | Bom | Gancho funcionando |
| 20%–35% | Mediano | Gancho pode melhorar |
| Abaixo de 20% | Fraco | Reformular os primeiros 3 segundos |

**Fonte:** `video_p25_watched_actions` ÷ `impressions`

---

### Hold Rate (% que chegou ao fim depois de pegar o gancho)

| Faixa | Classificação | O que indica |
|---|---|---|
| Acima de 30% | Excelente | Conteúdo mantém o interesse |
| 15%–30% | Bom | Desenvolvimento sólido |
| 8%–15% | Mediano | Conteúdo perde atenção no meio |
| Abaixo de 8% | Fraco | Revisão completa do roteiro |

**Fonte:** `video_p100_watched_actions` ÷ `video_p25_watched_actions`

---

## Métricas orgânicas (Instagram)

### Taxa de salvamento

| Faixa | Classificação | O que indica |
|---|---|---|
| Acima de 5% | Excelente | Conteúdo muito útil/educativo |
| 2%–5% | Bom | Conteúdo com valor percebido |
| 0,5%–2% | Mediano | Conteúdo pouco acionável |
| Abaixo de 0,5% | Baixo | Reformular abordagem |

**Cálculo:** salvamentos ÷ alcance × 100
**Pilar que mais deve ter salvamento:** Educação Financeira (quarta)

---

### Taxa de compartilhamento

| Faixa | Classificação | O que indica |
|---|---|---|
| Acima de 3% | Excelente | Conteúdo muito relevante/polêmico |
| 1%–3% | Bom | Conteúdo com apelo social |
| 0,3%–1% | Mediano | Normal para nicho educativo |
| Abaixo de 0,3% | Baixo | Reavaliar ângulo |

**Pilar que mais deve ter compartilhamento:** Atualidades e Mercado (segunda)

---

## Métricas de CRM

### Taxa de qualificação (Novo → Qualificado)

| Faixa | Classificação | O que indica |
|---|---|---|
| Acima de 60% | Excelente | Público muito alinhado |
| 40%–60% | Bom | Qualificação saudável |
| 20%–40% | Mediano | Revisar origem dos leads |
| Abaixo de 20% | Baixo | Problema na captação ou no roteiro |

**Cálculo:** leads qualificados ÷ leads novos no período × 100

---

### Taxa de fechamento (Qualificado → Fechado)

| Faixa | Classificação | O que indica |
|---|---|---|
| Acima de 25% | Excelente | Atendimento muito eficiente |
| 15%–25% | Bom | Conversão saudável |
| 8%–15% | Mediano | Melhorar follow-up e negociação |
| Abaixo de 8% | Baixo | Investigar onde os leads escapam |

---

### Tempo médio até fechamento

| Faixa | Classificação | O que indica |
|---|---|---|
| Abaixo de 15 dias | Muito rápido | Lead muito qualificado ou urgência alta |
| 15–45 dias | Ideal | Ciclo normal de consórcio |
| 45–90 dias | Longo | Precisar de mais follow-up estruturado |
| Acima de 90 dias | Muito longo | Revisar processo de nurturing |

---

## Métricas calculadas (Meta + CRM cruzados)

### Custo por lead qualificado
`spend da semana` ÷ `leads qualificados no CRM na semana`

Esperado: entre 2–3x o CPL bruto. Se muito mais alto, o público de anúncio está desalinhado com o ICP.

### Custo por lead fechado
`spend da semana` ÷ `leads fechados no CRM na semana`

Esta é a métrica mais importante do negócio. [CALIBRAR com dados reais — meta depende do valor médio de carta e da margem do negócio]

---

## Como o Agente de Análise usa este arquivo

1. Lê o DashboardSnapshot da semana
2. Compara cada métrica com as faixas acima
3. Classifica como Excelente / Bom / Atenção / Agir
4. Identifica a métrica mais preocupante e a mais positiva
5. Gera diagnóstico com recomendação específica (não genérica)
6. Entrega resumo ao operador em linguagem simples

**Exemplo de saída correta:**
"CPL médio na semana: R$38. Está na faixa de Atenção (R$30–50). A campanha lookalike-contemplados teve CPL de R$22 (Bom) enquanto a campanha interesse-imóveis teve CPL de R$67 (Alto). Recomendação: pausar campanha de interesse-imóveis e realocar orçamento para lookalike-contemplados."

**Exemplo de saída incorreta (genérica):**
"O CPL está alto. Recomenda-se revisar as campanhas."

# MKT-AI — Plataforma de Marketing Automatizado com Agentes de IA

Plataforma de automação de marketing para influenciador de consórcio no Instagram.
O sistema utiliza agentes de IA para pesquisar notícias, gerar roteiros de conteúdo, qualificar leads e analisar métricas — de forma autônoma, todos os dias úteis, sem intervenção manual.

---

## Sumário

- [Visão geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Agentes](#agentes)
- [Infraestrutura](#infraestrutura)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Como rodar localmente](#como-rodar-localmente)
- [Deploy](#deploy)
- [Orquestração n8n](#orquestração-n8n)
- [Base de conhecimento](#base-de-conhecimento)
- [Pendências e próximos passos](#pendências-e-próximos-passos)

---

## Visão geral

O sistema automatiza quatro operações que hoje são feitas manualmente:

| Operação | Antes | Depois |
|---|---|---|
| Pesquisa de mercado | 30–40 min/dia manual | Agente roda às 7h automaticamente |
| Criação de roteiros | Horas de escrita | 3 roteiros gerados e entregues por e-mail |
| Qualificação de leads | 30–60 min/dia manual | Agente analisa e sugere ações às 13h |
| Análise de métricas | 1–2h por semana | Diagnóstico semanal entregue toda segunda |

**Segmento:** influenciador de consórcio no Instagram (Sandro Mangini)
**Idioma:** português brasileiro
**Regulação:** consórcio regulado pela Lei 11.795/2008 e fiscalizado pelo Banco Central — guardrails de compliance implementados em todos os agentes

---

## Arquitetura

```
Tavily (busca web)
      │
      ▼
Research Agent (7h)
      │ JSON estruturado
      ▼
Content Agent (logo após pesquisa)
      │ roteiros formatados
      ▼
Gmail (entrega ao operador)
      │ revisão humana obrigatória antes de publicar

Supabase (CRM)
      │ leads ativos
      ▼
Qualification Agent (13h)
      │ sugestões de ação
      ▼
Gmail (entrega ao operador)
      │ operador age manualmente

Meta Marketing API + Supabase (CRM)
      │ snapshot semanal
      ▼
Analysis Agent (segunda 6h50)
      │ diagnóstico e recomendações
      ▼
Gmail (entrega ao operador)
```

**Provedores atuais:**
- LLM: Groq (llama-3.3-70b-versatile) — migração para Anthropic Claude pendente
- Busca web: Tavily — migração para busca nativa Anthropic pendente
- Banco de dados: Supabase (PostgreSQL)
- Hosting: Railway
- Orquestração: n8n Cloud

**Troca de provedor sem alterar agentes:**
```
# .env — mudar duas linhas para migrar para Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Estrutura do projeto

```
mkt-ai/
├── backend/
│   ├── agents/
│   │   ├── research_agent.py       # Agente de Pesquisa
│   │   ├── content_agent.py        # Agente de Conteúdo
│   │   ├── qualification_agent.py  # Agente de Qualificação
│   │   └── analysis_agent.py       # Agente de Análise
│   ├── core/
│   │   ├── llm.py                  # Abstração de LLM (Groq → Anthropic)
│   │   ├── search.py               # Abstração de busca web (Tavily → Anthropic)
│   │   └── logger.py               # Log local (JSONL) + persistente (Supabase)
│   ├── integrations/
│   │   ├── supabase.py             # CRM — leitura e escrita de leads
│   │   ├── meta_ads.py             # Meta Marketing API
│   │   ├── dashboard_builder.py    # Cruza Meta + CRM para métricas reais
│   │   └── notifier.py             # Alertas por e-mail em caso de falha
│   ├── orchestrator/
│   │   ├── run_research.py         # Entry point → chamado pelo n8n às 7h
│   │   ├── run_content.py          # Entry point → chamado após pesquisa
│   │   ├── run_qualification.py    # Entry point → chamado pelo n8n às 13h
│   │   └── run_analysis.py         # Entry point → chamado pelo n8n segunda 6h50
│   ├── config/
│   │   └── settings.py             # Variáveis de ambiente centralizadas
│   └── models/
│       └── enums.py                # Enums compartilhados por todos os agentes
│
├── schemas/
│   ├── research.py                 # ResearchOutput — saída do Agente de Pesquisa
│   ├── content.py                  # ContentOutput + ContentDiario
│   ├── qualification.py            # QualificationOutput + QualificationAction
│   ├── dashboard.py                # DashboardSnapshot — Meta + CRM cruzados
│   └── analysis.py                 # AnalysisOutput — diagnóstico semanal
│
├── knowledge/
│   ├── brand/
│   │   ├── positioning.md          # Missão, visão, proposta de valor
│   │   ├── personas.md             # Gabriel, Mariana, Ricardo
│   │   ├── tone_of_voice.md        # Tom de voz operacional
│   │   └── compliance_guardrails.md # Regras invioláveis (Lei 11.795/2008)
│   ├── content/
│   │   ├── pillars_and_calendar.md # 5 pilares + calendário seg–sex
│   │   ├── formats.md              # Estrutura de Reel, Carrossel, Stories
│   │   ├── hooks_and_ctas.md       # Biblioteca de hooks e CTAs
│   │   └── scripts_reference.md    # Índice dos 20 scripts few-shot
│   ├── sales/
│   │   ├── crm_and_funnel.md       # Funil + campos do CRM
│   │   ├── qualification_playbook.md # Roteiro das 4 perguntas
│   │   └── objections_and_faq.md   # Objeções do ICP + respostas
│   └── performance/
│       ├── kpis_and_benchmarks.md  # Faixas de CPL, CTR, hook rate etc.
│       └── analysis_playbook.md    # Como o Agente de Análise interpreta dados
│
├── scripts/
│   ├── test_fire_groq.py           # Teste de fogo da API Groq
│   ├── test_core_llm.py            # Valida core/llm.py
│   ├── test_search.py              # Valida core/search.py (Tavily)
│   ├── test_supabase.py            # Valida integração Supabase
│   ├── test_meta.py                # Valida token Meta
│   ├── test_meta_campaigns.py      # Lista campanhas e insights Meta
│   ├── test_dashboard.py           # Valida DashboardSnapshot
│   ├── test_failure.py             # Teste de falha intencional (RF-ORQ-03)
│   └── test_api_qualification.py   # Testa endpoint /run/qualification
│
├── data/                           # JSONs gerados pelos agentes (gitignored)
├── logs/                           # execucoes.jsonl local (gitignored)
├── docs/                           # Documentação adicional
├── frontend/                       # Pendente — não implementado
├── prompts/                        # Pendente — não implementado
├── tests/                          # Pendente — não implementado
├── .env                            # Variáveis de ambiente (gitignored)
├── .gitignore
├── Procfile                        # Railway: uvicorn backend.api:app
├── requirements.txt
├── runtime.txt                     # python-3.11
└── README.md
```

---

## Agentes

### Agente de Pesquisa
**Arquivo:** `backend/agents/research_agent.py`
**Roda:** todo dia útil às 7h
**O que faz:** executa 5 queries dinâmicas no Tavily, filtra 2–3 temas relevantes para o nicho de consórcio, entrega JSON validado por Pydantic
**Saída:** `data/research_YYYY-MM-DD.json` (schema: `ResearchOutput`)
**Queries:** geradas dinamicamente com data do dia para priorizar notícias recentes

### Agente de Conteúdo
**Arquivo:** `backend/agents/content_agent.py`
**Roda:** logo após o Agente de Pesquisa
**O que faz:** consome o JSON da pesquisa, gera um roteiro por tema (formato definido pelo pilar: Reel, Carrossel ou Stories), entrega por e-mail
**Saída:** `data/content_YYYY-MM-DD.json` (schema: `ContentDiario`)
**Importante:** revisão humana obrigatória antes de publicar — o agente nunca publica sozinho

**Calendário editorial:**
| Dia | Pilar | Formato |
|---|---|---|
| Segunda | Atualidades e Mercado | Reel |
| Terça | Mitos e Verdades | Reel |
| Quarta | Educação Financeira | Carrossel |
| Quinta | Prova Social | Reel |
| Sexta | Conversão | Stories |

### Agente de Qualificação
**Arquivo:** `backend/agents/qualification_agent.py`
**Roda:** todo dia útil às 13h
**O que faz:** lê todos os leads ativos do Supabase, analisa histórico de cada um, sugere ação específica e mensagem de reengajamento pronta para enviar, registra sugestão no histórico automaticamente
**Saída:** email com ações priorizadas (schema: `QualificationOutput`)
**Importante:** o agente sugere — o operador decide e age manualmente

**Critérios de prioridade:**
- Alta: lead parado >7 dias ou simulação pendente >2 dias
- Média: lead parado 3–7 dias
- Baixa: contato recente (<3 dias)

### Agente de Análise
**Arquivo:** `backend/agents/analysis_agent.py`
**Roda:** toda segunda-feira às 6h50 (antes da pesquisa)
**O que faz:** constrói DashboardSnapshot cruzando Meta Ads + CRM, analisa métricas com LLM, entrega diagnóstico semanal com recomendações específicas
**Saída:** email com diagnóstico (schema: `AnalysisOutput`)
**Fallback:** se não houver dados em last_7d, tenta last_30d; se ambos vazios, entrega análise do CRM com aviso explícito

---

## Infraestrutura

### Supabase
**Tabelas:**
- `leads` — entidade central do CRM (campos: nome, whatsapp, origem, status, objetivo, valor_carta, prazo_uso, conhece_consorcio, qualificado, observacoes, etc.)
- `interacoes` — histórico de contatos por lead (lead_id, tipo, nota, proximo_passo)
- `execucoes` — log persistente de todas as execuções dos agentes
- `leads_ativos` — view que filtra leads com status novo/qualificado/em_negociacao e calcula precisa_followup e lead_frio

**Funil de status dos leads:**
```
Novo → Qualificado → Em negociação → Fechado → Perdido
```

**Chave de deduplicação:** campo `whatsapp` — mesmo número nunca gera dois registros

### Meta Marketing API
- App Business configurado no Meta for Developers
- System User com permissão `ads_read` e token permanente
- Ad Account ID: `act_1285585419379663`
- Endpoints usados: `/insights` (CPM, CTR, CPL, frequência, hook rate) e `/campaigns`

### Railway
- Deploy automático via push no GitHub
- Procfile: `web: uvicorn backend.api:app --host 0.0.0.0 --port $PORT`
- URL de produção: `https://web-production-b0aad.up.railway.app`
- Endpoints disponíveis:
  - `GET /health`
  - `POST /run/research`
  - `POST /run/content/full`
  - `POST /run/qualification`
  - `POST /run/analysis`

### n8n Cloud
**Workflow 1 — Pipeline diário (7h):**
```
Schedule (seg–sex 7h) → POST /run/research → POST /run/content/full → Gmail (roteiros)
                                          ↓ erro
                                    Gmail (alerta)
```

**Workflow 2 — Qualificação (13h):**
```
Schedule (seg–sex 13h) → POST /run/qualification → Gmail (ações do dia)
                                               ↓ erro
                                         Gmail (alerta)
```

> O Agente de Análise (segunda 6h50) ainda precisa de workflow próprio no n8n.

---

## Configuração do ambiente

Cria o arquivo `.env` na raiz do projeto:

```env
# LLM — hoje Groq, migrar para Anthropic quando tiver acesso
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Quando migrar para Anthropic: trocar as duas linhas abaixo
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEY=sk-ant-...
# ANTHROPIC_MODEL=claude-sonnet-4-6

# Busca web
SEARCH_PROVIDER=tavily
TAVILY_API_KEY=tvly-...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...

# Meta Marketing API
META_APP_ID=...
META_APP_SECRET=...
META_ACCESS_TOKEN=...
META_AD_ACCOUNT_ID=act_...

# Sistema
ENV=development
LOG_FILE=logs/execucoes.jsonl
API_TOKEN=...
```

---

## Como rodar localmente

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/mkt-ai.git
cd mkt-ai

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente
cp .env.example .env
# editar .env com as chaves reais

# 4. Rodar os agentes manualmente
python backend/orchestrator/run_research.py
python backend/orchestrator/run_content.py
python backend/orchestrator/run_qualification.py
python backend/orchestrator/run_analysis.py

# 5. Rodar a API localmente
uvicorn backend.api:app --reload --port 8000
# Acessar: http://localhost:8000/docs
```

### Scripts de validação

```bash
# Valida LLM + Groq
python scripts/test_core_llm.py

# Valida busca web (Tavily)
python scripts/test_search.py

# Valida integração Supabase
python scripts/test_supabase.py

# Valida token Meta e lista campanhas
python scripts/test_meta_campaigns.py

# Valida Dashboard Snapshot (Meta + CRM)
python scripts/test_dashboard.py

# Teste de falha intencional (RF-ORQ-03)
python scripts/test_failure.py
```

---

## Deploy

O deploy é automático via push no GitHub:

```bash
git add .
git commit -m "descrição da mudança"
git push origin main
# Railway faz o redeploy automaticamente em 1-2 minutos
```

Para verificar se o deploy subiu:
```bash
curl https://web-production-b0aad.up.railway.app/health
# Retorno esperado: {"status": "ok", "timestamp": "..."}
```

---

## Orquestração n8n

Os agentes são chamados pelo n8n via HTTP. Para acionar manualmente sem o n8n:

```bash
# Agente de Pesquisa
curl -X POST https://web-production-b0aad.up.railway.app/run/research \
  -H "Authorization: Bearer SEU_API_TOKEN"

# Agente de Conteúdo
curl -X POST https://web-production-b0aad.up.railway.app/run/content/full \
  -H "Authorization: Bearer SEU_API_TOKEN"

# Agente de Qualificação
curl -X POST https://web-production-b0aad.up.railway.app/run/qualification \
  -H "Authorization: Bearer SEU_API_TOKEN"

# Agente de Análise
curl -X POST https://web-production-b0aad.up.railway.app/run/analysis \
  -H "Authorization: Bearer SEU_API_TOKEN"
```

---

## Base de conhecimento

A pasta `knowledge/` contém os arquivos que os agentes carregam nos system prompts. São a "memória estratégica" do sistema — definem tom de voz, pilares, guardrails e critérios de análise.

**Não alterar sem entender o impacto:** mudanças nesses arquivos afetam diretamente o comportamento de todos os agentes.

| Arquivo | Carregado por |
|---|---|
| `brand/compliance_guardrails.md` | Todos os agentes |
| `brand/tone_of_voice.md` | Content Agent, Qualification Agent |
| `brand/personas.md` | Research Agent, Content Agent |
| `content/pillars_and_calendar.md` | Research Agent, Content Agent |
| `content/formats.md` | Content Agent |
| `content/hooks_and_ctas.md` | Content Agent |
| `sales/qualification_playbook.md` | Qualification Agent |
| `sales/crm_and_funnel.md` | Qualification Agent |
| `sales/objections_and_faq.md` | Qualification Agent |
| `performance/kpis_and_benchmarks.md` | Analysis Agent |
| `performance/analysis_playbook.md` | Analysis Agent |

---

## Pendências e próximos passos

### Bloqueado — aguardando acesso Anthropic
- [ ] Migrar `LLM_PROVIDER=groq` para `LLM_PROVIDER=anthropic` no `.env` e Railway
- [ ] Habilitar busca web nativa da Anthropic no Research Agent (substituir Tavily)
- [ ] Refinamento de qualidade do Content Agent (tom de voz mais próximo do Sandro, bullets concretos com dados reais das notícias)

**Como migrar quando o acesso chegar:**
1. Adicionar `ANTHROPIC_API_KEY` no `.env` e nas variáveis do Railway
2. Trocar `LLM_PROVIDER=groq` para `LLM_PROVIDER=anthropic`
3. No `research_agent.py`: adicionar `tools=[{"type": "web_search_20250305", "name": "web_search"}]` na chamada
4. Trocar `SEARCH_PROVIDER=tavily` para `SEARCH_PROVIDER=anthropic`
5. Push → Railway faz o redeploy

### Independentes de Anthropic
- [ ] Workflow n8n para o Agente de Análise (segunda 6h50)
- [ ] Alerta de CPL alto no Analysis Agent
- [ ] Frontend do CRM — painel para o Sandro cadastrar leads e ver funil
- [ ] Dashboard visual de métricas
- [ ] Captura automática de leads do Instagram/WhatsApp
- [ ] Métricas orgânicas do Instagram (Graph API)
- [ ] Entrega de roteiros via WhatsApp (além do e-mail)
- [ ] Validação do CPL contra o Gerenciador de Anúncios (depende de campanhas ativas)
- [ ] README do `.env.example`

### Débito técnico
- [ ] Encoding nos logs (caracteres especiais como `Ã³` — parcialmente corrigido)
- [ ] `frontend/`, `prompts/` e `tests/` estão vazios
- [ ] `backend/database/` e `backend/services/` estão vazios — avaliar se serão usados ou remover
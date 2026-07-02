# Formatos de Conteúdo — Estruturas Padrão

> O Agente de Conteúdo gera no formato definido pelo calendário do dia. Estas estruturas são o molde obrigatório.

---

## Reel (30 segundos)

O formato dominante. Tempo médio efetivo: 25–45 segundos. Estrutura em 3 blocos rígidos.

### Estrutura

**Gancho (0–3s)**
- Uma frase ou pergunta que para o scroll imediatamente
- Deve comunicar o benefício ou a tensão do vídeo inteiro
- Nunca começar com "Olá, pessoal" ou apresentação
- Funciona: pergunta direta, afirmação contraintuitiva, dado surpreendente, validação de dúvida

**Desenvolvimento (3–25s)**
- Entrega o conteúdo prometido no gancho
- Uma única ideia central — não tentar cobrir tudo
- Ritmo rápido, frases curtas, pausas estratégicas
- Usar analogias, comparações e números concretos
- Máximo 3–4 pontos de conteúdo

**CTA (25–30s)**
- Uma única chamada para ação, clara e específica
- Nunca dois CTAs no mesmo vídeo ("salva E me chama E comenta")
- Escolher o CTA pelo objetivo do pilar do dia:
  - Educação: salvar / compartilhar
  - Mitos: comentar / caixinha
  - Prova social: "me chama no direct"
  - Atualidades: salvar / comentar opinião
  - Conversão: "comenta SIMULAÇÃO" / "chama no direct"

### Tipos de Reel por abordagem

**Talking Head** (câmera direta)
- Sandro fala direto para a câmera
- Tom: consultivo, como conversa entre amigos
- Melhor para: educação, mitos, opinião de mercado
- Referência: Natália Arcuri (5,1M) — dor comum como gancho

**React** (reagindo a notícia ou vídeo)
- Sandro comenta acontecimento em tempo real
- Tom: comentarista, analista de mercado
- Melhor para: Atualidades e Mercado (pilar 4)
- Referência: Thiago Nigro (21M) — notícia + opinião + impacto na vida do público

**Storytelling**
- Conta a história de um cliente do início ao resultado
- Tom: caloroso, narrativo, com arco emocional
- Melhor para: Prova Social (pilar 3)
- Referência: Bruno Perini (7,5M) — história pessoal + música instrumental de fundo

### Instruções de gravação por tipo

**Talking Head:** câmera fixa, fundo limpo, iluminação frontal, cortes rápidos entre frases longas.

**React:** tela dividida ou câmera com o conteúdo ao fundo, gesticulação natural, tom urgente no gancho.

**Storytelling:** ritmo mais lento, pausas dramáticas, música instrumental suave ao fundo, olhar para a câmera nos momentos de virada.

---

## Carrossel

Formato de profundidade. Salvo para consultar depois. Melhor KPI de salvamentos.

### Estrutura

**Capa (slide 1)**
- Título de impacto — é a "thumbnail" que decide se a pessoa vai deslizar
- Deve comunicar claramente o que o carrossel vai ensinar
- Funciona: pergunta + promessa, afirmação ousada, número concreto

**Slides de desenvolvimento (2 a N-1)**
- Uma única ideia por slide
- Texto enxuto — máximo 4–5 linhas por slide
- Progressão lógica: cada slide abre para o próximo
- Nunca repetir o que o slide anterior disse

**Slide final — CTA**
- Ação específica relacionada ao pilar do dia
- Educação/Mitos: "Salva esse carrossel e compartilha com quem precisa"
- Prova Social: "Me chama no direct — a sua história pode ser a próxima"
- Conversão: "Comenta aqui: 1, 2, 3 ou 4 — e eu te explico a estratégia certa"

### Número de slides por tema

- Comparações (consórcio vs financiamento): 6–7 slides
- Passo a passo / como funciona: 5–7 slides
- Mitos (lista): 7–8 slides (1 por mito + capa + CTA)
- Linha do tempo (prova social): 6–7 slides
- Situações / quando usar: 5–6 slides

---

## Stories — Sequência de Conversão

Usado principalmente na sexta (Pilar 5). Objetivo: mover o seguidor do Stories para o Direct.

### Sequência padrão

**Stories 1 — Enquete**
- Pergunta simples com duas opções
- Exemplos: "Você pensa em comprar nos próximos 2 anos?" Sim / Não
- Ou: "Qual é o seu objetivo?" Imóvel / Carro
- Objetivo: engajamento + segmentação da audiência

**Stories 2 — Caixinha de perguntas**
- Abrir espaço para dúvida específica
- Texto: "Me conta: qual é a sua maior dúvida sobre consórcio?"
- Objetivo: coletar dúvidas reais que viram conteúdo futuro + identificar leads quentes

**Stories 3 — Direcionamento ao Direct**
- Mensagem direta: "Você que respondeu [X] — me chama aqui no direct"
- Ou: "Manda SIMULAÇÃO aqui que eu te respondo hoje"
- Objetivo: mover para conversa privada → entra no CRM como lead

### Stories de bastidores (complementar, não obrigatório)
- Rotina do Sandro, processos de trabalho, escolha de administradora
- Tom: humanização, não venda
- Frequência: 2–3x por semana, sem script fixo

---

## Campos dinâmicos (preenchidos pelo Agente de Conteúdo)

Marcados com `[NOTA AGENTE]` nos roteiros de referência. O agente substitui pelo dado real do JSON do Agente de Pesquisa:

- `[X%]` → valor real da Selic ou variação de mercado do dia
- `[mês/ano]` → data real do caso do cliente
- `[valor da carta]` → valor específico da simulação
- `[cidade]` → localização real do cliente (com autorização)
- `[contexto real do dia]` → texto gerado a partir do resumo da pesquisa

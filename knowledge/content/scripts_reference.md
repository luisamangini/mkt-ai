# Scripts de Referência (Few-Shot)

> Este arquivo referencia os 20 scripts completos gerados como base de few-shot para o Agente de Conteúdo.
> O arquivo completo com todos os roteiros está em: `docs/scripts_referencia.docx`
>
> O Agente usa esses scripts como modelo de estrutura, tom e formato — não replica o conteúdo, adapta ao tema do dia.

---

## Índice dos scripts por pilar

### Pilar 1 — Educação Financeira
- **Reel 1:** "A conta que o banco não quer que você faça" — Talking Head, comparação financiamento vs consórcio, gancho no dado (R$640k)
- **Reel 2:** "Lance embutido em 30 segundos" — explicação rápida com analogia concreta
- **Carrossel 1:** "Consórcio vs financiamento: a comparação honesta" — 6 slides, desvantagens dos dois incluídas
- **Carrossel 2:** "Como funciona um grupo de consórcio (do zero)" — passo a passo evergreen, 6 slides

### Pilar 2 — Mitos e Verdades
- **Reel 1:** "Consórcio é golpe? Vamos aos fatos" — valida a dúvida, apresenta a Lei 11.795, CTA para lista do Bacen
- **Reel 2:** "Consórcio demora demais? Depende do que você faz" — gancho que valida a objeção, explica o lance sem prometer
- **Carrossel 1:** "5 mitos sobre consórcio (e o que é verdade)" — 7 slides, vermelho/verde, mito + verdade por slide
- **Carrossel 2:** "Consórcio vs financiamento: quem ganha em cada situação?" — 6 slides por situação concreta do ICP

### Pilar 3 — Prova Social
- **Reel 1:** "Do 'consórcio é furada' à casa própria" — storytelling estilo Bruno Perini, arco emocional, autorização obrigatória
- **Reel 2:** "3 contemplações. 3 histórias diferentes." — múltipla prova, 3 perfis do ICP, factual e rápido
- **Carrossel 1:** "Linha do tempo: da dúvida à chave na mão" — 7 slides cronológicos, dados reais por mês
- **Carrossel 2:** "O que meus clientes tinham em comum antes de contratar" — espelhamento com ICP, 6 slides empáticos

### Pilar 4 — Atualidades e Mercado
- **Reel 1:** "React: Selic caiu/subiu — o que muda pra você" — DINÂMICO, X% do Agente de Pesquisa, estilo Thiago Nigro
- **Reel 2:** "Mercado imobiliário em alta: o que isso significa" — DINÂMICO, dado de valorização do Agente de Pesquisa
- **Carrossel 1:** "O que a Selic significa pra quem quer comprar imóvel" — DINÂMICO, 6 slides analíticos com números reais
- **Carrossel 2:** "Mercado automotivo: vale comprar agora?" — DINÂMICO, 6 slides, Mariana como persona principal

### Pilar 5 — Conversão
- **Reel 1:** "Quanto ficaria a parcela da sua carta?" — gancho provocador, educação sobre parcela, CTA: comenta SIMULAÇÃO
- **Reel 2:** "Você quer imóvel ou carro? Me conta." — conversa direta, alimenta CRM, sem pressão de venda
- **Carrossel 1:** "3 perguntas antes de entrar em um consórcio" — checklist consultivo, CTA: comentar qual dúvida (1, 2 ou 3)
- **Carrossel 2:** "Por que eu não vendo consórcio. Eu apresento caminhos." — posicionamento, diferenciação, CTA consultivo

---

## Padrão de cada script no documento completo

Cada script contém:
- **Base no benchmark:** qual referência de mercado foi usada (creator, views, por que funcionou)
- **Gancho (0–3s):** texto exato ou modelo
- **Desenvolvimento (3–25s):** falas linha a linha
- **CTA (25–30s):** texto exato da chamada
- **Instruções de gravação/criação:** tom, velocidade, visual, guardrails específicos

---

## Como o Agente usa estes scripts

1. Recebe o JSON do Agente de Pesquisa (tema + resumo + ângulo do dia)
2. Identifica o pilar do dia pelo calendário
3. Seleciona o script de referência mais próximo do tema
4. Adapta o conteúdo ao tema real — mantendo a estrutura, o tom e os guardrails
5. Substitui campos `[NOTA AGENTE]` com dados reais do JSON
6. Gera o roteiro completo no formato do dia (Reel ou Carrossel)
7. Entrega ao operador para revisão — nunca publica diretamente

---

## Scripts dinâmicos (Pilar 4)

Os 4 scripts de Atualidades e Mercado têm campos variáveis marcados como `[NOTA AGENTE]`. O Agente de Conteúdo DEVE substituir antes de entregar:

| Campo | Fonte | Exemplo |
|---|---|---|
| `[X%]` | JSON do Agente de Pesquisa | "10,5%" (taxa Selic atual) |
| `[subiu/caiu]` | JSON do Agente de Pesquisa | "caiu" |
| `[contexto real do dia]` | resumo do JSON | "O Banco Central reduziu a Selic em reunião do Copom..." |
| `[fonte]` | fontes do JSON | "Banco Central, Reuters, Valor Econômico" |

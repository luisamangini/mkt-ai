# Qualification Playbook — Agente de Qualificação

> Este arquivo é carregado exclusivamente pelo Agente de Qualificação. Define o roteiro, os critérios de decisão e as mensagens sugeridas por situação.

---

## Roteiro de qualificação — 4 perguntas

O Agente aplica este roteiro para classificar leads novos. As perguntas são feitas pelo operador humano (via WhatsApp/Direct) — o Agente sugere as perguntas e interpreta as respostas para atualizar o CRM.

### Pergunta 1 — Objetivo
> "Qual é o seu objetivo com o consórcio?"

**Opções esperadas:**
- Imóvel: primeiro, troca, construção, reforma → `objetivo: imovel`
- Veículo: pessoal, trabalho → `objetivo: veiculo`
- Patrimônio, diversificação, outro → `objetivo: patrimonio`

**Impacto:** define qual persona atender, qual administradora apresentar e qual linguagem usar no atendimento.

---

### Pergunta 2 — Valor
> "Qual valor de carta faz sentido para você?"

**Opções esperadas:**
- Até R$100k → `valor_carta: 100000`
- R$100k–R$300k → `valor_carta: 200000` (usar ponto médio)
- R$300k–R$600k → `valor_carta: 450000`
- Acima de R$600k → `valor_carta: 600000` (mínimo, atualizar quando souber)
- Não sabe ainda → `valor_carta: null` (não qualificar sem este dado)

**Impacto:** define qual grupo e qual parcela apresentar na simulação.

---

### Pergunta 3 — Prazo
> "Quando você pretende usar a carta?"

**Opções esperadas:**
- O quanto antes / urgência → `prazo_uso: imediato`
- Em até 1 ano → `prazo_uso: 1_ano`
- Em 2+ anos → `prazo_uso: 2_anos`
- Sem pressa / planejamento de longo prazo → `prazo_uso: sem_pressa`

**Impacto:** urgência define se apresentar estratégia de lance ou consórcio padrão. `imediato` → focar no lance embutido e calcular percentual. `sem_pressa` → focar no planejamento e na vantagem de não pagar juros.

---

### Pergunta 4 — Conhecimento
> "Você já conhece como funciona o consórcio?"

**Opções esperadas:**
- Sim, já pesquisei / já tive um → `conhece_consorcio: sim`
- Ouvi falar mas não entendo bem → `conhece_consorcio: parcialmente`
- Não conheço → `conhece_consorcio: nao`

**Impacto:** define profundidade da explicação. Não educar quem já sabe; não vender para quem ainda não entendeu o produto.

---

## Critérios de qualificação

### Qualificado (`qualificado: true`)
Lead respondeu as 4 perguntas E tem:
- `objetivo` definido (não nulo)
- `valor_carta` > 0 (qualquer valor, mesmo estimado)
- `prazo_uso` definido

→ Mover para status `qualificado`. Próximo passo contextual definido pelo Agente com base nas respostas:

| Condição | Próximo passo sugerido |
|---|---|
| `prazo_uso: imediato` | Apresentar estratégia de lance embutido + calcular percentual necessário |
| `prazo_uso: 1_ano` | Enviar simulação com carta no valor informado + opções de lance moderado |
| `prazo_uso: 2_anos` ou `sem_pressa` | Enviar simulação focando na vantagem de não pagar juros + planejamento de longo prazo |
| `conhece_consorcio: nao` | Antes da simulação: enviar explicação básica de como funciona o grupo |
| `conhece_consorcio: sim` + `objetivo: patrimonio` | Apresentar estratégia patrimonial com múltiplas cartas / administradoras parceiras |
| Qualquer qualificado | Registrar no histórico: "Lead qualificado. Próximo passo: [ação específica acima]" |

### Não qualificado (`qualificado: false`)
- Não respondeu 2 ou mais perguntas essenciais
- Objetivo incompatível com os produtos disponíveis
- "Não sei" em mais de 2 campos críticos

→ Manter em status `novo`. Agente sugere mensagem de reengajamento para tentar completar o roteiro.

### Aguardando (`qualificado: null`)
- Respondeu parcialmente (1–2 perguntas)
- Pediu para responder depois

→ Manter em `novo`. Agente prioriza como "aguardando roteiro completo" no próximo ciclo diário.

---

## Mensagens sugeridas por situação

O Agente gera a mensagem — o operador decide se envia. Campo `executar` é sempre `false`.

### Lead novo — primeira abordagem
```
Oi [Nome]! Vi que você entrou em contato. Fico feliz em ajudar.
Para te mandar a simulação mais certeira, preciso entender melhor o seu objetivo.
Você está pensando em consórcio para imóvel, carro ou outra finalidade?
```

### Lead parado há 3 dias (reengajamento suave)
```
Oi [Nome], tudo bem? Vi que você tinha interesse em consórcio.
Fica à vontade para me chamar quando quiser conversar — sem pressão.
Se tiver alguma dúvida enquanto isso, pode mandar aqui.
```

### Lead frio — 7 dias sem resposta (novo ângulo)
```
Oi [Nome]! Deixa eu te mandar uma coisa que pode ser útil.
[Inserir dado relevante do mercado da semana — Selic, preço de imóvel etc.]
Se ainda tiver interesse em conversamos, estou por aqui.
```

### Lead que pediu simulação há 2 dias sem resposta
```
Oi [Nome]! Preparei a simulação que você pediu.
Posso te mandar agora? É rapidinho, e fica mais fácil a gente conversar com os números na tela.
```

### Lead qualificado — apresentar simulação (padrão)
```
Oi [Nome]! Com base no que você me contou:
• Objetivo: [objetivo]
• Carta: R$ [valor]
• Prazo: [prazo_uso]

Preparei uma simulação para o seu caso. Posso te mandar agora?
```

### Lead qualificado — precisa de introdução ao produto primeiro (`conhece_consorcio: nao`)
```
Oi [Nome]! Antes de te mandar os números, deixa eu te explicar rapidinho como funciona.
O consórcio é um grupo de pessoas que contribuem mensalmente para um fundo.
Todo mês alguém recebe a carta de crédito — por sorteio ou por lance.
Não tem juros — você paga só a taxa de administração.
Com base no que você me contou, preparei uma simulação. Posso te mandar?
```

### Lead qualificado — estratégia patrimonial (`objetivo: patrimonio` + `conhece_consorcio: sim`)
```
Oi [Nome]! Com o seu perfil, consórcio pode ser uma estratégia interessante de aquisição de patrimônio.
Com carta de R$ [valor], você consegue negociar o bem à vista — o que costuma gerar desconto na compra.
Tenho algumas administradoras parceiras com boas condições para esse perfil.
Posso te apresentar as opções?
```

### Lead em negociação parado há 5 dias
```
Oi [Nome]! Passando para saber se ficou alguma dúvida sobre o que conversamos.
Estou à disposição para explicar qualquer ponto antes de você decidir.
```

---

## Saída do Agente de Qualificação (schema)

```json
{
  "lead_id": "string",
  "prioridade": "alta | media | baixa",
  "acao_sugerida": "instrução em linguagem natural para o operador",
  "proximo_passo": "próximo passo contextual baseado nas respostas do roteiro (ex: apresentar administradoras parceiras)",
  "mensagem_reengajamento": "texto pronto para enviar (ou null)",
  "novo_status_sugerido": "qualificado | null",
  "registrar_no_historico": "texto que o agente grava automaticamente no histórico do lead",
  "executar": false
}
```

O campo `executar` é sempre `false`. O operador lê a sugestão e age manualmente.
O campo `registrar_no_historico` é gravado automaticamente pelo agente no CRM — independente da ação do operador.

---

## Horário de execução
O Agente de Qualificação roda todos os dias úteis no início da tarde, após o fluxo de conteúdo da manhã. Lê todos os leads com status `novo`, `qualificado` ou `em_negociacao` e gera a lista de ações prioritizadas do dia.

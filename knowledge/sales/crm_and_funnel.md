# CRM e Funil de Vendas

## Ferramenta
Airtable (MVP). Campos mapeados abaixo constroem a base do sistema.

---

## Funil de status

```
Novo → Qualificado → Em negociação → Fechado → Perdido
```

| Status | Significado | Próximo passo |
|---|---|---|
| **Novo** | Chegou pelo Direct, WhatsApp ou Ads. Ainda não qualificado. | Aplicar roteiro de qualificação (4 perguntas) |
| **Qualificado** | Respondeu as 4 perguntas. Tem objetivo, valor e prazo definidos. | Enviar simulação personalizada |
| **Em negociação** | Simulação enviada. Conversa ativa sobre administradora e valores. | Follow-up ativo, não deixar esfriar |
| **Fechado** | Contratou. Registrar administradora e valor da carta. | Onboarding, relacionamento pós-venda |
| **Perdido** | Desistiu ou escolheu outra solução. | Registrar motivo — dado valioso para conteúdo |

---

## Campos do lead

| Campo | Tipo | Obrigatoriedade | Descrição |
|---|---|---|---|
| `id` | string | Auto | Gerado automaticamente. Chave primária. |
| `nome` | string | Obrigatório | Nome como o lead se apresentou. |
| `whatsapp` | string | Obrigatório | **Chave de deduplicação.** Formato: 11999990000. Mesmo número = mesmo lead. |
| `origem` | enum | Obrigatório | instagram_organico · meta_ads · indicacao · direct · outro |
| `status` | enum | Auto | novo · qualificado · em_negociacao · fechado · perdido. Default: novo. |
| `objetivo` | enum | Qualificação | imovel · veiculo · patrimonio |
| `valor_carta` | number | Qualificação | Valor em R$ da carta de interesse. Ex: 200000 |
| `prazo_uso` | enum | Qualificação | imediato · 1_ano · 2_anos · sem_pressa |
| `conhece_consorcio` | enum | Qualificação | sim · nao · parcialmente |
| `qualificado` | boolean | Auto (Agente) | true · false · null. Definido pelo Agente de Qualificação. |
| `motivo_perda` | enum | Se perdido | preco · concorrente · sem_interesse · sem_resposta · outro |
| `administradora` | string | Se fechado | Qual administradora o cliente contratou. |
| `criado_em` | datetime | Auto | Timestamp de criação. |
| `ultimo_contato` | datetime | Auto | Atualizado a cada interação. Base dos alertas. |
| `observacoes` | string | Opcional | Texto livre do operador. O que foi discutido, contexto importante, informações que não cabem em campo estruturado. |
| `historico` | array | Auto | Interações: {data, tipo, nota, proximo_passo}. Nunca deletar entradas. |

### Regra de deduplicação
Antes de cadastrar qualquer lead: verificar se o `whatsapp` já existe.
- Se existir: adicionar interação ao histórico do lead existente, NÃO criar novo registro.
- Se não existir: criar novo lead com status = novo.

---

## Alertas automáticos

| Alerta | Condição | Prioridade | Ação sugerida pelo Agente |
|---|---|---|---|
| Follow-up suave | Lead em Novo, Qualificado ou Em negociação sem contato há 3 dias | Média | Mensagem de reengajamento suave |
| Lead frio | Lead em qualquer status ativo sem contato há 7 dias | Alta | Mensagem com novo ângulo, diferente do último |
| Simulação pendente | Lead qualificado que pediu simulação há 2 dias sem resposta | Alta | Follow-up direto sobre a simulação |

---

## Campos mais importantes para o negócio

**`motivo_perda`** é o campo mais valioso a longo prazo. Depois de 3 meses de dados, responde:
- Qual objeção mata mais vendas?
- O conteúdo está atacando os motivos certos de perda?
- Em que etapa do funil mais leads escapam?

**`prazo_uso`** define a estratégia de atendimento:
- `imediato` → apresentar estratégia de lance embutido, calcular percentual necessário
- `1_ano` → consórcio padrão com estratégia de lance moderada
- `2_anos` ou `sem_pressa` → foco no planejamento, vantagem de não pagar juros

**`valor_carta`** define qual administradora e qual grupo apresentar.

---

## Regras de uso do CRM

1. Todo lead que chega pelo Direct ou WhatsApp entra no CRM no mesmo dia
2. Cadastro deve ser feito em menos de 1 minuto (critério de aceite obrigatório)
3. Histórico nunca é deletado — só acrescenta
4. Mensagem sugerida pelo Agente de Qualificação NUNCA é enviada automaticamente — operador aprova
5. Status só muda após ação real — não antecipar etapas
6. `ultimo_contato` atualiza a cada interação, incluindo as sugeridas pelo agente
7. **O Agente de Qualificação registra a sugestão gerada no histórico do lead automaticamente após cada execução** — mesmo que o operador não aja, o histórico mostra que o agente avaliou o lead naquele dia

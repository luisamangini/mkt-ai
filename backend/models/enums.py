from enum import Enum


class Pilar(str, Enum):
    EDUCACAO_FINANCEIRA = "Educação Financeira"
    MITOS_E_VERDADES = "Mitos e Verdades"
    PROVA_SOCIAL = "Prova Social"
    ATUALIDADES_E_MERCADO = "Atualidades e Mercado"
    CONVERSAO = "Conversão"


class Relevancia(str, Enum):
    ALTA = "alta"
    MEDIA = "media"
    BAIXA = "baixa"


class StatusAgente(str, Enum):
    OK = "ok"
    FALHA = "falha"

class FormatoConteudo(str, Enum):
    REEL = "reel"
    CARROSSEL = "carrossel"
    STORIES = "stories"

class StatusRevisao(str, Enum):
    PENDENTE = "pendente"
    APROVADO = "aprovado"
    REPROVADO = "reprovado"

class PrioridadeLead(str, Enum):
    ALTA = "alta"
    MEDIA = "media"
    BAIXA = "baixa"


class StatusLead(str, Enum):
    NOVO = "novo"
    QUALIFICADO = "qualificado"
    EM_NEGOCIACAO = "em_negociacao"
    FECHADO = "fechado"
    PERDIDO = "perdido"
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.llm import get_completion
from backend.core.logger import log_execution, get_last_executions

print("Testando core/llm.py...\n")

try:
    resposta = get_completion(
        system="Voce e um assistente especialista em consorcio no Brasil.",
        user="Em uma frase: qual a principal vantagem do consorcio sobre o financiamento?",
        max_tokens=100,
    )
    print("OK Teste 1 - chamada simples:")
    print(resposta + "\n")
except Exception as e:
    print("ERRO Teste 1:", e)

try:
    resposta_json = get_completion(
        system='Responda APENAS com JSON valido no formato {"vantagem":"string","desvantagem":"string"}',
        user="Compare consorcio e financiamento em uma palavra cada.",
        max_tokens=100,
        json_mode=True,
    )
    dados = json.loads(resposta_json)
    print("OK Teste 2 - json_mode:")
    print(dados)
except Exception as e:
    print("ERRO Teste 2:", e)

try:
    log_execution(
        agent="test_llm",
        status="ok",
        resultado="Teste core llm concluido",
        metadata={"provider": "groq"},
    )
    ultimas = get_last_executions(limit=1)
    print("OK Teste 3 - logger:")
    print(ultimas[0])
except Exception as e:
    print("ERRO Teste 3:", e)

print("\nConcluido.")
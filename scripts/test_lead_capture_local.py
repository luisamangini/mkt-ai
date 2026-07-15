import os
import sys

sys.path.insert(
    0,
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
)

from fastapi.testclient import TestClient
from backend.api import app

client = TestClient(app)

print("Testando captura de leads...\n")

print("[1/3] Criando lead novo...")

resposta = client.post(
    "/leads/capture",
    json={
        "nome": "Teste Silva",
        "whatsapp": "11 97777-6666",
        "origem": "meta_ads",
        "objetivo": "imovel",
        "valor_carta": 250000,
        "observacoes": "Clicou no anúncio da campanha lookalike",
    },
)

print(f"HTTP: {resposta.status_code}")
print(resposta.json())

print("\n[2/3] Testando deduplicação...")

resposta_duplicada = client.post(
    "/leads/capture",
    json={
        "nome": "Teste Silva",
        "whatsapp": "11977776666",
        "origem": "direct",
        "observacoes": "Mandou direct após ver o Reel",
    },
)

print(f"HTTP: {resposta_duplicada.status_code}")
print(resposta_duplicada.json())

print("\n[3/3] Testando lead mínimo...")

resposta_minima = client.post(
    "/leads/capture",
    json={
        "nome": "Maria Fernanda",
        "whatsapp": "21 96666-5555",
        "origem": "indicacao",
    },
)

print(f"HTTP: {resposta_minima.status_code}")
print(resposta_minima.json())
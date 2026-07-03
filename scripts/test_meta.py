import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("META_ACCESS_TOKEN")

if not token:
    raise ValueError("META_ACCESS_TOKEN nao encontrado no .env")

url = "https://graph.facebook.com/v25.0/me/adaccounts"

response = requests.get(
    url,
    params={"access_token": token},
    timeout=20,
)

print("Status:", response.status_code)
print("Resposta:")
print(response.json())
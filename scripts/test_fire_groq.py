import json
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

print("Chamando Groq...")

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {
            "role": "system",
            "content": (
                "Você é um agente de pesquisa. "
                "Responda APENAS com JSON válido. "
                'Formato: {"tema":"string","resumo":"string","angulo":"string"}'
            )
        },
        {
            "role": "user",
            "content": (
                "Crie um resumo sobre como a Selic impacta o mercado de consórcios."
            )
        }
    ],
    temperature=0.2
)

texto = response.choices[0].message.content

print("\nResposta:")
print(texto)

dados = json.loads(texto)

print("\n Funcionou!")
print(dados)
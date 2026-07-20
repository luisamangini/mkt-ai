import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.search import search_web


results = search_web(
    query="notícias recentes consórcio Selic mercado imobiliário Brasil",
    max_results=3,
)

print("Resultados encontrados:\n")

for i, item in enumerate(results, start=1):
    print(f"{i}. {item['title']}")
    print(f"   URL: {item['url']}")
    print(f"   Score: {item['score']}")
    print(f"   Resumo: {item['content'][:250]}...\n")    
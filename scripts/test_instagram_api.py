# scripts/test_instagram_api.py
import sys
import os
import requests
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config.settings import META_ACCESS_TOKEN

BASE = "https://graph.facebook.com/v25.0"

print("=" * 50)
print("Verificando acesso Instagram Graph API")
print("=" * 50)

# 1. Verificar contas do Instagram vinculadas
print("\n[1] Buscando contas Instagram vinculadas ao token...")
resp = requests.get(f"{BASE}/me/accounts", params={
    "access_token": META_ACCESS_TOKEN,
    "fields": "id,name,instagram_business_account"
})
data = resp.json()

if "error" in data:
    print(f"    Erro: {data['error'].get('message')}")
else:
    paginas = data.get("data", [])
    print(f"    {len(paginas)} página(s) encontrada(s)")
    ig_account_id = None
    for p in paginas:
        ig = p.get("instagram_business_account")
        print(f"   • Página: {p.get('name')} | IG: {ig.get('id') if ig else 'não vinculado'}")
        if ig:
            ig_account_id = ig.get("id")

    if not ig_account_id:
        print("\n     Nenhuma conta Instagram Business vinculada encontrada.")
        print("   Verifique se a página do Facebook está conectada ao Instagram Business.")
        sys.exit(0)

    print(f"\n   IG Account ID: {ig_account_id}")

# 2. Verificar dados básicos da conta Instagram
print(f"\n[2] Dados da conta Instagram ({ig_account_id})...")
resp2 = requests.get(f"{BASE}/{ig_account_id}", params={
    "access_token": META_ACCESS_TOKEN,
    "fields": "username,followers_count,media_count,biography"
})
data2 = resp2.json()
if "error" in data2:
    print(f"    Erro: {data2['error'].get('message')}")
else:
    print(f"   Username:   @{data2.get('username')}")
    print(f"   Seguidores: {data2.get('followers_count', 0):,}")
    print(f"   Posts:      {data2.get('media_count', 0)}")

# 3. Verificar insights disponíveis
print(f"\n[3] Testando insights da conta...")

# Métrica compatível com period
resp3_reach = requests.get(f"{BASE}/{ig_account_id}/insights", params={
    "access_token": META_ACCESS_TOKEN,
    "metric": "reach",
    "period": "week",
})
data3_reach = resp3_reach.json()

# Métricas que exigem total_value
resp3_total = requests.get(f"{BASE}/{ig_account_id}/insights", params={
    "access_token": META_ACCESS_TOKEN,
    "metric": "views,profile_views",
    "period": "day",
    "metric_type": "total_value",
})
data3_total = resp3_total.json()

if "error" in data3_reach:
    print(f"   Erro reach: {data3_reach['error'].get('message')}")
else:
    for metrica in data3_reach.get("data", []):
        valores = metrica.get("values", [])
        ultimo = valores[-1].get("value", 0) if valores else 0
        print(f"   • {metrica.get('name')}: {ultimo}")

if "error" in data3_total:
    print(f"   Erro total_value: {data3_total['error'].get('message')}")
else:
    for metrica in data3_total.get("data", []):
        total = metrica.get("total_value", {}).get("value", 0)
        print(f"   • {metrica.get('name')}: {total}")

# 4. Testar insights de mídia recente
print(f"\n[4] Testando insights de posts recentes...")
resp4 = requests.get(f"{BASE}/{ig_account_id}/media", params={
    "access_token": META_ACCESS_TOKEN,
    "fields": "id,caption,media_type,timestamp",
    "limit": 3
})
data4 = resp4.json()
if "error" in data4:
    print(f"    Erro: {data4['error'].get('message')}")
else:
    posts = data4.get("data", [])
    print(f"   {len(posts)} post(s) recente(s) encontrado(s)")
    for post in posts[:2]:
        post_id = post.get("id")
        # Testar insights do post
        resp_ins = requests.get(f"{BASE}/{post_id}/insights", params={
            "access_token": META_ACCESS_TOKEN,
            "metric": "reach,saved,shares,likes",
        })
        ins_data = resp_ins.json()
        if "error" in ins_data:
            print(f"    Post {post_id}: {ins_data['error'].get('message')}")
        else:
            ins = {m["name"]: m["values"][0]["value"] for m in ins_data.get("data", [])}
            print(f"    Post {post.get('timestamp', '')[:10]}: {ins}")

print("\nDiagnóstico concluído.")
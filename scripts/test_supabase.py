# scripts/test_supabase.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.integrations.supabase import (
    get_leads_ativos,
    get_lead_por_whatsapp,
    inserir_interacao,
    atualizar_lead,
)

print("Testando integração Supabase...\n")

# Teste 1 — listar leads ativos
try:
    leads = get_leads_ativos()
    print(f" Teste 1 — leads ativos: {len(leads)} encontrados")
    for l in leads:
        followup = " precisa follow-up" if l.get("precisa_followup") else "ok"
        frio = " lead frio" if l.get("lead_frio") else ""
        print(f"   • {l['nome']} | {l['status']} | {followup} {frio}")
except Exception as e:
    print(f" Teste 1 falhou: {e}")

# Teste 2 — busca por whatsapp
try:
    lead = get_lead_por_whatsapp("11999990001")
    print(f"\n Teste 2 — busca por WhatsApp: {lead['nome']} ({lead['status']})")
except Exception as e:
    print(f"\n Teste 2 falhou: {e}")

# Teste 3 — inserir interação
try:
    lead = get_lead_por_whatsapp("11999990001")
    interacao = inserir_interacao(
        lead_id=lead["id"],
        tipo="agente_sugestao",
        nota="Agente sugeriu envio de simulação para carta de R$200k, prazo 1 ano",
        proximo_passo="Enviar simulação personalizada",
    )
    print(f" Teste 3 — interação inserida: {interacao['id']}")
except Exception as e:
    print(f" Teste 3 falhou: {e}")

print("\nConcluído. Me manda o output.")
import socket
import urllib3.util.connection as urllib3_cn
import requests
import json
from datetime import datetime

def allowed_gai_family():
    return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

API_TOKEN = "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To"
BASE_URL = "https://api-partners.oddsscanner.com"
api_headers = {"X-API-Key": API_TOKEN, "accept": "application/json"}

target_link_id = 20954

now = datetime.now()
start = now.replace(day=1).strftime("%Y-%m-%d")
end = now.strftime("%Y-%m-%d")

print(f"=== Investigando Link ID: {target_link_id} (Ana Paula) ===")

# 1. Procurar no relatório de Sources (casas)
params = {
    "start_date": "2026-01-01", # Janela maior para garantir que vemos algo
    "end_date": end,
    "page_size": 100,
    "granularity": "monthly"
}

print(f"Buscando em /api/v1/reports/sources...")
r = requests.get(f"{BASE_URL}/api/v1/reports/sources", headers=api_headers, params=params, timeout=30)
if r.ok:
    data = r.json().get('data', [])
    found = False
    for item in data:
        if str(item.get('affiliate_link_id')) == str(target_link_id):
            print(f"ACHEI o link {target_link_id}!")
            print(json.dumps(item, indent=2))
            found = True
            break
    if not found:
        print(f"Link {target_link_id} NAO encontrado no report do período.")
else:
    print(f"Erro na API: {r.status_code} - {r.text}")

# 2. Procurar na lista geral de Affiliate Links para ver o Nome
print(f"\nBuscando em /api/v1/affiliate-links...")
r = requests.get(f"{BASE_URL}/api/v1/affiliate-links", headers=api_headers, timeout=30)
if r.ok:
    links = r.json().get('data', [])
    found = False
    for l in links:
        if str(l.get('id')) == str(target_link_id):
            print(f"Configuração do Link {target_link_id}:")
            print(json.dumps(l, indent=2))
            found = True
            break
    if not found:
        print(f"Link {target_link_id} NAO existe cadastrado nesta conta de API.")

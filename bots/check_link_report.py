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

now = datetime.now()
start = "2026-01-01"
end = now.strftime("%Y-%m-%d")

print(f"=== Buscando Link ID 20954 em /reports/affiliate-links (desde {start}) ===")
params = {
    "start_date": start,
    "end_date": end,
    "page_size": 100,
    "granularity": "monthly"
}

r = requests.get(f"{BASE_URL}/api/v1/reports/affiliate-links", headers=api_headers, params=params, timeout=30)
if r.ok:
    data = r.json().get('data', [])
    print(f"Links com dados encontrados: {len(data)}")
    found = False
    for item in data:
        lid = str(item.get('affiliate_link_id'))
        if lid == "20954":
            print(f"ACHEI O LINK 20954!")
            print(json.dumps(item, indent=2))
            found = True
            break
    if not found:
        print("Link 20954 NAO encontrado no relatório de links com dados.")
        
        # Opcional: imprimir os primeiros 5 IDs para ver o padrão
        print("\nPrimeiros 5 IDs encontrados:")
        for i in data[:5]:
            print(f"ID: {i.get('affiliate_link_id')} | Nome: {i.get('affiliate_link_name')}")
else:
    print(f"Erro: {r.status_code} - {r.text}")

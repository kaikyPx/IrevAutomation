import requests
import socket
import urllib3.util.connection as urllib3_cn

def allowed_gai_family():
    return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

API_KEY = "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To"
BASE_URL = "https://api-partners.oddsscanner.com/api/v1/reports/dynamic-variables"

headers = {
    "X-API-Key": API_KEY,
    "accept": "application/json"
}

params = {
    "start_date": "2026-03-13", # Ontem
    "end_date": "2026-03-14",   # Hoje
    "page_size": 100
}

print(f"Buscando DADOS BRUTOS (Dynamic Variables) para 13/03 e 14/03...")
r = requests.get(BASE_URL, headers=headers, params=params)
if not r.ok:
    print(f"Erro: {r.status_code} - {r.text}")
else:
    data = r.json()
    items = data.get("data", [])
    print(f"Total de registros brutos encontrados: {len(items)}")
    
    betfair_records = [i for i in items if "Betfair" in i.get("advertiser_name", "")]
    
    if not betfair_records:
        print("Nenhum registro bruto da Betfair encontrado.")
    else:
        for b in betfair_records:
            print(f"REGISTRO: {b.get('date')} | Casa: {b.get('advertiser_name')} | Fonte: {b.get('traffic_source_name')} | Cliques: {b.get('clicks')}")

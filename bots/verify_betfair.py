import requests
import socket
import urllib3.util.connection as urllib3_cn

def allowed_gai_family():
    return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

API_KEY = "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To"
BASE_URL = "https://api-partners.oddsscanner.com/api/v1/reports/sources"

headers = {
    "X-API-Key": API_KEY,
    "accept": "application/json"
}

params = {
    "start_date": "2026-03-01",
    "end_date": "2026-03-14",
    "traffic_source_id": 90 # ID de Pedro Ivan
}

print(f"Buscando dados para Pedro Ivan (ID 90) e Betfair...")
r = requests.get(BASE_URL, headers=headers, params=params)
data = r.json()

found = False
for item in data.get("data", []):
    adv_name = item.get("advertiser_name", "")
    if "Betfair" in adv_name:
        metrics = item.get("dates", [{}])[0].get("metrics", {})
        print(f"ENCONTRADO: {adv_name} | Cliques: {metrics.get('clicks', 0)}")
        found = True

if not found:
    print("Nenhum registro de Betfair encontrado para Pedro Ivan neste período.")

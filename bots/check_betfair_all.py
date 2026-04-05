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
    "end_date": "2026-03-12",
    "advertiser_id": 32 # ID da Betfair
}

print(f"Buscando quem teve cliques na Betfair (ID 32)...")
r = requests.get(BASE_URL, headers=headers, params=params)
data = r.json()

results = data.get("data", [])
if not results:
    print("Ninguém teve cliques na Betfair neste período.")
else:
    for item in results:
        ts_name = item.get("traffic_source_name")
        metrics = item.get("dates", [{}])[0].get("metrics", {})
        print(f"- Fonte: {ts_name} | Cliques: {metrics.get('clicks', 0)}")

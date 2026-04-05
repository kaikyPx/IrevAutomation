import requests
import socket
import urllib3.util.connection as urllib3_cn

def allowed_gai_family():
    return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

API_KEY = "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To"
BASE_URL = "https://api-partners.oddsscanner.com/api/v1/reports/advertisers"

headers = {
    "X-API-Key": API_KEY,
    "accept": "application/json"
}

params = {
    "start_date": "2026-03-01",
    "end_date": "2026-03-14",
    "page_size": 100
}

print(f"Buscando todos os advertisers ativos...")
r = requests.get(BASE_URL, headers=headers, params=params)
data = r.json()

print("Advertisers encontrados:")
for item in data.get("data", []):
    print(f"- {item.get('advertiser_name')} (ID: {item.get('advertiser_id')})")

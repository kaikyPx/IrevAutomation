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
start = now.replace(day=1).strftime("%Y-%m-%d")
end = now.strftime("%Y-%m-%d")

# Pedro Ivan = traffic_source_id 2650
# Ana Paula = traffic_source_id 2700

targets = [
    {"name": "Pedro Ivan", "id": 2650},
    {"name": "Ana Paula", "id": 2700}
]

for target in targets:
    print(f"\n=== Buscando ADVERTISERS filtrado por {target['name']} (TS ID: {target['id']}) ===")
    params = {
        "start_date": start,
        "end_date": end,
        "page_size": 100,
        "granularity": "monthly",
        "traffic_source_id": target["id"]
    }
    r = requests.get(f"{BASE_URL}/api/v1/reports/advertisers", headers=api_headers, params=params, timeout=30)
    print(f"Status: {r.status_code}")
    if r.ok:
        data = r.json().get('data', [])
        print(f"Casas encontradas: {len(data)}")
        for item in data:
            m = item.get('dates', [{}])
            metrics = m[0].get('metrics', {}) if m else {}
            print(f"  - {item['advertiser_name']} | Dep: {metrics.get('deposits',0)} | Rev: {metrics.get('net_revenue',0)}")
    else:
        print(f"Erro: {r.text}")

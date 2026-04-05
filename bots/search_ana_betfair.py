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
start = "2026-03-01"
end = now.strftime("%Y-%m-%d")

print(f"=== Buscando 'Ana Paula' ou 'Betfair' em todos os Links com dados ===")
page = 1
total_pages = 1
while True:
    params = {
        "start_date": start,
        "end_date": end,
        "page_size": 100,
        "page": page,
        "granularity": "monthly"
    }
    r = requests.get(f"{BASE_URL}/api/v1/reports/affiliate-links", headers=api_headers, params=params, timeout=30)
    if not r.ok:
        print(f"Erro na pagina {page}: {r.status_code}")
        break
    
    payload = r.json()
    data = payload.get('data', [])
    total_pages = payload.get('total_pages', 1)
    
    for item in data:
        name = str(item.get('affiliate_link_name', '')).lower()
        ts_name = str(item.get('traffic_source_name', '')).lower()
        adv_name = str(item.get('advertiser_name', '')).lower()
        lid = str(item.get('affiliate_link_id'))
        
        if 'ana paula' in name or 'ana paula' in ts_name or 'betfair' in adv_name or lid == "20954":
            print(f"ACHADO: ID {lid} | Link: {item.get('affiliate_link_name')} | Adv: {item.get('advertiser_name')} | TS: {item.get('traffic_source_name')}")
            metrics = item.get('dates', [{}])[0].get('metrics', {})
            print(f"  > Metrics: Dep: {metrics.get('deposits')} | Rev: {metrics.get('net_revenue')}")

    if page >= total_pages:
        break
    page += 1
print("=== Fim da busca ===")

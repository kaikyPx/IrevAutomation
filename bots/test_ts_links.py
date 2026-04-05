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

ts_id = 2650 # Pedro Ivan

print(f"=== Buscando AFFILIATE LINKS para Pedro Ivan (TS ID {ts_id}) ===")

params = {
    "start_date": start,
    "end_date": end,
    "traffic_source_id": ts_id,
    "granularity": "monthly",
    "page_size": 100
}

# Infelizmente o endpoint /affiliate-links nao aceita traffic_source_id no OpenAPI.
# Mas vamos tentar mesmo assim, as vezes funciona como filtro 'oculto'.
r = requests.get(f"{BASE_URL}/api/v1/reports/affiliate-links", headers=api_headers, params=params, timeout=30)
print(f"Status: {r.status_code}")
if r.ok:
    data = r.json().get('data', [])
    print(f"Links encontrados: {len(data)}")
    for item in data:
        metrics = item.get('dates', [{}])[0].get('metrics', {})
        print(f"  - Link: {item.get('affiliate_link_name')} | ID: {item.get('affiliate_link_id')} | Dep: {metrics.get('deposits')} | Rev: {metrics.get('net_revenue')}")
        if 'betfair' in str(item).lower() or 'seguro' in str(item).lower():
            print("  >>> ACHEI! <<<")
else:
    print(f"Erro: {r.text}")

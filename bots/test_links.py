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

# Pedro Ivan Betfair Link ID = 4021
# Pedro Ivan SeguroBet Link ID = 4056

link_ids = [4021, 4056]

for lid in link_ids:
    print(f"\n=== Buscando /sources filtrado por Link ID {lid} ===")
    params = {
        "start_date": start,
        "end_date": end,
        "affiliate_link_id": lid,
        "granularity": "monthly"
    }
    r = requests.get(f"{BASE_URL}/api/v1/reports/sources", headers=api_headers, params=params, timeout=30)
    print(f"Status: {r.status_code}")
    if r.ok:
        data = r.json().get('data', [])
        print(f"Registros: {len(data)}")
        for i in data:
             m = i.get('dates', [{}])[0].get('metrics', {})
             print(f"  Casa: {i.get('advertiser_name')} | Link: {i.get('affiliate_link_name')} | Dep: {m.get('deposits')} | Rev: {m.get('net_revenue')}")
    else:
        print(f"Erro: {r.text}")

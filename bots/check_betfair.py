import socket
import urllib3.util.connection as urllib3_cn
import requests
import json

def allowed_gai_family():
    return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

API_TOKEN = "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To"
BASE_URL = "https://api-partners.oddsscanner.com"
headers = {"X-API-Key": API_TOKEN, "accept": "application/json"}

# Fetch all historical data without date filter
all_data = []
page = 1
while True:
    params = {"page_size": 100, "page": page}
    r = requests.get(f"{BASE_URL}/api/v1/reports/sources", headers=headers, params=params, timeout=30)
    if r.status_code != 200: break
    payload = r.json()
    data = payload.get('data', [])
    all_data.extend(data)
    if page >= payload.get('total_pages', 1): break
    page += 1

# All unique advertiser names
advertisers = sorted(set([i.get('advertiser_name', '') for i in all_data]))
print("=== TODAS AS CASAS NA API (HISTORICO COMPLETO) ===")
for a in advertisers:
    print(f"  {a}")

# Search specifically for Betfair and Segurabet
print("\n=== BUSCANDO BETFAIR E SEGURABET ===")
for item in all_data:
    name = item.get('advertiser_name', '').lower()
    if 'betfair' in name or 'seguro' in name or 'segura' in name:
        dep = sum(d['metrics'].get('deposits', 0) for d in item.get('dates', []))
        rev = sum(d['metrics'].get('net_revenue', 0) for d in item.get('dates', []))
        print(f"  Encontrado: {item.get('advertiser_name')} | Link: {item.get('affiliate_link_name')} | Dep: {dep:.2f} | Rev: {rev:.2f}")

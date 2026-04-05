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

print("=== /api/v1/reports/advertisers - Marco 2026 (monthly) ===")
r = requests.get(f"{BASE_URL}/api/v1/reports/advertisers", headers=api_headers,
    params={"start_date": start, "end_date": end, "page_size": 100, "granularity": "monthly"}, timeout=30)

print(f"Status: {r.status_code}")
if r.ok:
    data = r.json().get('data', [])
    total = r.json().get('total', '?')
    print(f"Casas retornadas: {len(data)} (total API: {total})")
    print("\nLista de Casas:")
    for item in data:
        m = item.get('dates', [{}])
        mm = m[0].get('metrics', {}) if m else {}
        dep = mm.get('deposits', 0)
        rev = mm.get('net_revenue', 0)
        print(f"  [{item.get('advertiser_id')}] {item.get('advertiser_name')} | Dep: {dep:.2f} | Rev: {rev:.2f}")
    
    has_betfair = any('betfair' in str(i).lower() for i in data)
    has_seguro  = any('seguro' in str(i).lower() for i in data)
    print(f"\nBetfair presente: {has_betfair}")
    print(f"SeguroBet presente: {has_seguro}")
else:
    print(r.text[:500])

print("\n\n=== /api/v1/reports/advertisers - SEM DATA (historico) ===")
r2 = requests.get(f"{BASE_URL}/api/v1/reports/advertisers", headers=api_headers,
    params={"page_size": 100}, timeout=30)
print(f"Status: {r2.status_code}")
if r2.ok:
    data2 = r2.json().get('data', [])
    total2 = r2.json().get('total', '?')
    print(f"Casas retornadas: {len(data2)} (total API: {total2})")
    for item in data2:
        print(f"  [{item.get('advertiser_id')}] {item.get('advertiser_name')}")
    has_betfair2 = any('betfair' in str(i).lower() for i in data2)
    has_seguro2 = any('seguro' in str(i).lower() for i in data2)
    print(f"\nBetfair presente (sem data): {has_betfair2}")
    print(f"SeguroBet presente (sem data): {has_seguro2}")

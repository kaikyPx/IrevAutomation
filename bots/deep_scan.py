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

def fetch_ep(ep, params):
    r = requests.get(f"{BASE_URL}{ep}", headers=api_headers, params=params, timeout=30)
    if r.ok: return r.json().get('data', [])
    return []

print("=== 1. Buscando todos os Affiliate Links (Página 1) ===")
links = fetch_ep("/api/v1/reports/affiliate-links", {"start_date": start, "end_date": end, "page_size": 100})
for l in links:
    m = l.get('dates', [{}])[0].get('metrics', {})
    if m.get('deposits', 0) > 0 or m.get('net_revenue', 0) > 0:
        print(f"  Link: {l.get('affiliate_link_name')} (ID {l.get('affiliate_link_id')}) | Dep: {m.get('deposits')} | Rev: {m.get('net_revenue')}")

print("\n=== 2. Buscando todos os Traffic Sources (Página 1) ===")
sources = fetch_ep("/api/v1/reports/traffic-sources", {"start_date": start, "end_date": end, "page_size": 100})
for s in sources:
    m = s.get('dates', [{}])[0].get('metrics', {})
    if m.get('deposits', 0) > 0 or m.get('net_revenue', 0) > 0:
        print(f"  Source: {s.get('traffic_source_name')} (ID {s.get('traffic_source_id')}) | Dep: {m.get('deposits')} | Rev: {m.get('net_revenue')}")

print("\n=== 3. Buscando no /sources filtrando apenas por Advertiser 32 (Betfair) ===")
bf_sources = fetch_ep("/api/v1/reports/sources", {"start_date": start, "end_date": end, "advertiser_id": 32, "page_size": 100})
if bf_sources:
    print(f"  Encontrados {len(bf_sources)} registros para Betfair no /sources")
    for i in bf_sources:
        print(f"    TS: {i.get('traffic_source_name')} | Link: {i.get('affiliate_link_name')} | Val: {i.get('dates', [{}])[0].get('metrics', {}).get('deposits')}")
else:
    print("  NADA encontrado para Betfair no /sources (confirmado)")

print("\n=== 4. Buscando no /sources filtrando apenas por Advertiser 92 (Segurobet) ===")
sb_sources = fetch_ep("/api/v1/reports/sources", {"start_date": start, "end_date": end, "advertiser_id": 92, "page_size": 100})
if sb_sources:
    print(f"  Encontrados {len(sb_sources)} para Segurobet no /sources")
else:
    print("  NADA encontrado para Segurobet no /sources (confirmado)")

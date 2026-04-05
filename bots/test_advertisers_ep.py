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
headers = {"X-API-Key": API_TOKEN, "accept": "application/json"}

now = datetime.now()
start_date = now.replace(day=1).strftime("%Y-%m-%d")
end_date = now.strftime("%Y-%m-%d")

print("=== GET ADVERTISERS REPORT (com data de março) ===")
all_data = []
page = 1
while True:
    params = {"start_date": start_date, "end_date": end_date, "page_size": 100, "page": page, "granularity": "monthly"}
    r = requests.get(f"{BASE_URL}/api/v1/reports/advertisers", headers=headers, params=params, timeout=30)
    if r.status_code != 200:
        print(f"ERRO: {r.status_code} - {r.text[:200]}")
        break
    payload = r.json()
    data = payload.get('data', [])
    total_pages = payload.get('total_pages', 1)
    total = payload.get('total', '?')
    print(f"Pagina {page}/{total_pages}: {len(data)} casas (total API: {total})")
    all_data.extend(data)
    if page >= total_pages: break
    page += 1

print(f"\nTOTAL CASAS: {len(all_data)}")
print("\nLista de Casas (advertiser_name):")
for item in all_data:
    m = item.get('dates', [{}])
    if m:
        mm = m[0].get('metrics', {})
        dep = mm.get('deposits', 0)
        rev = mm.get('net_revenue', 0)
        sig = mm.get('signups', 0)
        ftd = mm.get('ftds', 0)
    else:
        dep = rev = sig = ftd = 0
    print(f"  [{item.get('advertiser_id')}] {item.get('advertiser_name')} | Regs: {sig} | FTDs: {ftd} | Dep: {dep:.2f} | REV: {rev:.2f}")

print("\n\nBUSCANDO BETFAIR/SEGURABET:")
found = [i for i in all_data if 'betfair' in str(i).lower() or 'seguro' in str(i).lower() or 'segura' in str(i).lower()]
if found:
    print(json.dumps(found, indent=2))
else:
    print("Nao encontrado no /advertisers endpoint (março)")
    
print("\n=== BUSCANDO SEM DATA ===")
r2 = requests.get(f"{BASE_URL}/api/v1/reports/advertisers", headers=headers, params={"page_size": 100, "granularity": "monthly"}, timeout=30)
if r2.status_code == 200:
    all2 = r2.json().get('data', [])
    print(f"Total sem data: {len(all2)}")
    for item in all2:
        print(f"  [{item.get('advertiser_id')}] {item.get('advertiser_name')}")

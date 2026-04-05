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

now = datetime.now()
start_date = now.replace(day=1).strftime("%Y-%m-%d")
end_date = now.strftime("%Y-%m-%d")

headers = {"X-API-Key": API_TOKEN, "accept": "application/json"}

def fetch_all(params_extra, label):
    all_data = []
    page = 1
    while True:
        params = {"page_size": 100, "page": page, **params_extra}
        r = requests.get(f"{BASE_URL}/api/v1/reports/sources", headers=headers, params=params, timeout=30)
        if r.status_code != 200:
            print(f"  ERRO HTTP {r.status_code}: {r.text[:200]}")
            break
        payload = r.json()
        data = payload.get('data', [])
        total_pages = payload.get('total_pages', 1)
        total = payload.get('total', '?')
        print(f"  Pagina {page}/{total_pages}: {len(data)} registros (total API: {total})")
        all_data.extend(data)
        if page >= total_pages:
            break
        page += 1
    print(f"  >>> TOTAL RECEBIDOS: {len(all_data)}\n")
    return all_data

print("=" * 60)
print("TESTE 1: GRANULARITY=DAILY com data do mês atual")
print("=" * 60)
d1 = fetch_all({"start_date": start_date, "end_date": end_date, "granularity": "daily"}, "daily_with_date")

print("=" * 60)
print("TESTE 2: SEM DATA (todos os históricos)")
print("=" * 60)
d2 = fetch_all({}, "no_date")

# Comparar nomes únicos
names1 = sorted(set([i.get('affiliate_link_name') for i in d1]))
names2 = sorted(set([i.get('affiliate_link_name') for i in d2]))

missing = [n for n in names2 if n not in names1]
print(f"Links que existem no histórico mas NÃO aparecem em março (daily): {len(missing)}")
for n in missing:
    print(f"  - {n}")

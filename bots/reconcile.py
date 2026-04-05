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

def get_data(ep, p):
    all_d = []
    page = 1
    while True:
        p['page'] = page
        r = requests.get(f"{BASE_URL}{ep}", headers=api_headers, params=p, timeout=30)
        if not r.ok: break
        payload = r.json()
        all_d.extend(payload.get('data', []))
        if page >= payload.get('total_pages', 1): break
        page += 1
    return all_d

print("1. Buscando Totais por Pessoa (/traffic-sources)...")
ts_data = get_data("/api/v1/reports/traffic-sources", {"start_date": start, "end_date": end, "page_size": 100, "granularity": "monthly"})

print("2. Buscando Breakout Total (/sources)...")
sources_data = get_data("/api/v1/reports/sources", {"start_date": start, "end_date": end, "page_size": 100, "granularity": "monthly"})

print("3. Buscando Totais por Casa (/advertisers)...")
advs_data = get_data("/api/v1/reports/advertisers", {"start_date": start, "end_date": end, "page_size": 100, "granularity": "monthly"})

# Agrupar Sources por TS
breakout_by_ts = {}
for item in sources_data:
    ts_id = item.get('traffic_source_id')
    m = item.get('dates', [{}])[0].get('metrics', {})
    if ts_id not in breakout_by_ts: breakout_by_ts[ts_id] = {"dep": 0, "rev": 0, "name": item.get('traffic_source_name')}
    breakout_by_ts[ts_id]["dep"] += m.get('deposits', 0)
    breakout_by_ts[ts_id]["rev"] += m.get('net_revenue', 0)

print("\n--- ANALISE DE DISCREPANCIAS ---")
total_leaked_dep = 0
total_leaked_rev = 0

for ts in ts_data:
    ts_id = ts.get('traffic_source_id')
    ts_name = ts.get('traffic_source_name')
    m = ts.get('dates', [{}])[0].get('metrics', {})
    ts_dep = m.get('deposits', 0)
    ts_rev = m.get('net_revenue', 0)
    
    brk = breakout_by_ts.get(ts_id, {"dep": 0, "rev": 0})
    diff_dep = ts_dep - brk["dep"]
    diff_rev = ts_rev - brk["rev"]
    
    if abs(diff_dep) > 0.01 or abs(diff_rev) > 0.01:
        print(f"  Pessoa: {ts_name:<20} | Diferenca Dep: {diff_dep:>8.2f} | Diferenca Rev: {diff_rev:>8.2f}")
        total_leaked_dep += diff_dep
        total_leaked_rev += diff_rev

print("\n" + "="*50)
print(f"TOTAL DE DADOS 'ORFÃOS' (Leaked): Dep {total_leaked_dep:.2f} | Rev {total_leaked_rev:.2f}")

# Checar se bate com Betfair + Segurobet
bf_sb_dep = 0
bf_sb_rev = 0
print("\nCasas que nao aparecem no /sources (Betfair/Segurobet/etc):")
houses_in_sources = set([i.get('advertiser_name') for i in sources_data])
for a in advs_data:
    if a['advertiser_name'] not in houses_in_sources:
        m = a.get('dates', [{}])[0].get('metrics', {})
        print(f"  - {a['advertiser_name']}: Dep {m.get('deposits')} | Rev {m.get('net_revenue')}")
        bf_sb_dep += m.get('deposits', 0)
        bf_sb_rev += m.get('net_revenue', 0)

print(f"\nSOMA DAS CASAS ORFÃS: Dep {bf_sb_dep:.2f} | Rev {bf_sb_rev:.2f}")
print("="*50)

if abs(total_leaked_dep - bf_sb_dep) < 1.0:
    print("\n>>> SUCESSO! A MATEMATICA BATE! <<<")
    print("Os dados orfãos nas pessoas correspondem exatamente as casas que faltam (Betfair/Segurobet).")
else:
    print(f"\n>>> AINDA HA UMA DIFERENCA DE {total_leaked_dep - bf_sb_dep:.2f} <<<")

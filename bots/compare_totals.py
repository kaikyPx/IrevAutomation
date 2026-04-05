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

print(f"=== Diagnostico para Pedro Ivan (TS ID {ts_id}) ===")

# 1. Total no /traffic-sources
print("\nFetching total from /traffic-sources...")
p1 = {"start_date": start, "end_date": end, "granularity": "monthly", "traffic_source_id": ts_id}
r1 = requests.get(f"{BASE_URL}/api/v1/reports/traffic-sources", headers=api_headers, params=p1)
total_metrics = {}
if r1.ok and r1.json().get('data'):
    item = r1.json()['data'][0]
    dates = item.get('dates', [{}])
    total_metrics = dates[0].get('metrics', {})
    print(f"TOTAL GERAL (TS EP): Dep: {total_metrics.get('deposits',0)} | Rev: {total_metrics.get('net_revenue',0)}")
else:
    print("Erro ou sem dados no /traffic-sources")

# 2. Breakout no /sources
print("\nFetching breakout from /sources...")
p2 = {"start_date": start, "end_date": end, "granularity": "monthly", "traffic_source_id": ts_id, "page_size": 100}
r2 = requests.get(f"{BASE_URL}/api/v1/reports/sources", headers=api_headers, params=p2)
breakout_sum_dep = 0
breakout_sum_rev = 0
if r2.ok:
    data = r2.json().get('data', [])
    print(f"Casas no breakout: {len(data)}")
    for item in data:
        m = item.get('dates', [{}])
        met = m[0].get('metrics', {}) if m else {}
        breakout_sum_dep += met.get('deposits', 0)
        breakout_sum_rev += met.get('net_revenue', 0)
        print(f"  - {item['advertiser_name']}: Dep {met.get('deposits',0)} | Rev {met.get('net_revenue',0)}")
    
    print(f"\nSOMA DO BREAKOUT: Dep: {breakout_sum_dep} | Rev: {breakout_sum_rev}")

# 3. Comparacao
print("\n=== COMPARACAO ===")
diff_dep = total_metrics.get('deposits', 0) - breakout_sum_dep
diff_rev = total_metrics.get('net_revenue', 0) - breakout_sum_rev
print(f"Diferenca Dep: {diff_dep:.2f}")
print(f"Diferenca Rev: {diff_rev:.2f}")

if abs(diff_dep) > 0.01 or abs(diff_rev) > 0.01:
    print("\nAVISO: O total do afiliado e MAIOR que a soma das casas! Ha dados ocultos.")
else:
    print("\nOs totais batem. Nao ha casas ocultas para este ID especifico.")

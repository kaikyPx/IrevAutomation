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

print(f"=== Buscando DYNAMIC VARIABLES para Pedro Ivan (TS ID {ts_id}) ===")

# Testar o endpoint de dynamic-variables por traffic-source
params = {
    "start_date": start,
    "end_date": end,
    "traffic_source_id": ts_id,
    "granularity": "monthly"
}

r = requests.get(f"{BASE_URL}/api/v1/reports/dynamic-variables/traffic-sources", headers=api_headers, params=params, timeout=30)
print(f"Status: {r.status_code}")
if r.ok:
    data = r.json().get('data', [])
    print(f"Registros encontrados: {len(data)}")
    for item in data:
        # Nota: O esquema do DV e diferente. Ele tem metrics dentro de dates.
        # E pode ter sub1...sub9
        d_list = item.get('dates', [{}])
        metrics = d_list[0].get('metrics', {}) if d_list else {}
        print(f"  - TS: {item.get('traffic_source_name')} | Sub1: {item.get('sub1')} | Dep: {metrics.get('deposits',0)} | NGR: {metrics.get('ngr',0)}")
        # Infelizmente esse endpoint agrupa por TS e Subs, mas cadê a casa?
        # O OpenAPI diz que o objeto DynamicVariableTrafficSourceNestedResponse tem traffic_source_id/name mas NAO tem advertiser_name
else:
    print(f"Erro: {r.text}")

# Testar o endpoint RAW de Dynamic Variables
print("\n=== Buscando DYNAMIC VARIABLES RAW (Sem agrupamento) ===")
r_raw = requests.get(f"{BASE_URL}/api/v1/reports/dynamic-variables", headers=api_headers, params={"start_date": start, "end_date": end, "page_size": 100}, timeout=30)
if r_raw.ok:
    raw_data = r_raw.json().get('data', [])
    print(f"Registros RAW encontrados: {len(raw_data)}")
    for i in raw_data:
        # O RAW RESPONSE TEM advertiser_name!
        if i.get('traffic_source_id') == ts_id:
             print(f"  [RAW] Casa: {i.get('advertiser_name')} | Dep: {i.get('deposits')} | NGR: {i.get('ngr')} | Sub1: {i.get('sub1')}")
             if 'betfair' in i.get('advertiser_name','').lower() or 'seguro' in i.get('advertiser_name','').lower():
                 print("  >>> ACHEI NO RAW DV! <<<")
else:
    print("Erro no RAW DV")

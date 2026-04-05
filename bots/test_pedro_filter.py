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

# Pedro Ivan = traffic_source_id 2650
# Test filtering /sources by traffic_source_id
print("=== /reports/sources filtrado por Pedro Ivan (traffic_source_id=2650) ===")
r = requests.get(f"{BASE_URL}/api/v1/reports/sources", headers=api_headers,
    params={"start_date": start, "end_date": end, "page_size": 100,
            "granularity": "monthly", "traffic_source_id": 2650}, timeout=30)

print(f"Status: {r.status_code}")
if r.ok:
    data = r.json().get('data', [])
    total = r.json().get('total', '?')
    print(f"Registros: {len(data)} (total API: {total})")
    for item in data:
        m = item.get('dates', [{}])
        mm = m[0].get('metrics', {}) if m else {}
        dep = mm.get('deposits', 0)
        rev = mm.get('net_revenue', 0)
        sig = mm.get('signups', 0)
        ftd = mm.get('ftds', 0)
        print(f"  Casa: {item.get('advertiser_name'):<30} Link: {item.get('affiliate_link_name'):<25} Regs:{sig} FTDs:{ftd} Dep:{dep:.2f} REV:{rev:.2f}")
    
    casas = [i.get('advertiser_name') for i in data]
    print(f"\nBetfair aparece: {'Betfair' in str(casas)}")
    print(f"SeguroBet aparece: {'eguro' in str(casas)}")

import requests
import json
import socket
import urllib3.util.connection as urllib3_cn

def allowed_gai_family(): return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

headers={'X-API-Key': 'IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To', 'accept': 'application/json'}
params = {
    'start_date': '2026-03-01',
    'end_date': '2026-03-13',
    'page_size': 100
}
r=requests.get('https://api-partners.oddsscanner.com/api/v1/reports/sources', headers=headers, params=params)
if r.status_code == 200:
    data = r.json().get('data', [])
    with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print(f"Sucesso: {len(data)} registros salvos.")
else:
    print(r.text)

import requests
import json
import socket
import urllib3.util.connection as urllib3_cn

def allowed_gai_family(): return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

headers={'X-API-Key': 'IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To', 'accept': 'application/json'}
# Vamos buscar sem filtros de links, apenas o range de data, e procurar manualmente por "Ana" no retorno
params = {
    'start_date': '2026-03-01',
    'end_date': '2026-03-13',
    'page_size': 100
}
r=requests.get('https://api-partners.oddsscanner.com/api/v1/reports/sources', headers=headers, params=params)
if r.status_code == 200:
    data = r.json().get('data', [])
    # Filtrar apenas o que contém "Ana" ou "#114" no nome do link ou source
    ana_data = [item for item in data if "Ana" in str(item.get('affiliate_link_name')) or "#114" in str(item.get('affiliate_link_name')) or "#114" in str(item.get('traffic_source_name'))]
    print(json.dumps(ana_data, indent=2))
else:
    print(r.text)

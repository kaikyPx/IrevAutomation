import requests
import json
import socket
import urllib3.util.connection as urllib3_cn

def allowed_gai_family(): return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

headers={'X-API-Key': 'IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To', 'accept': 'application/json'}
r=requests.get('https://api-partners.oddsscanner.com/api/v1/reports/sources', headers=headers, params={'affiliate_link_ids': '20094'})
if r.status_code == 200:
    data = r.json().get('data', [])
    print(json.dumps(data, indent=2))
else:
    print(r.text)

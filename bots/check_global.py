import requests
import socket
import urllib3.util.connection as urllib3_cn

def allowed_gai_family():
    return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

API_KEY = "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To"
BASE_URL = "https://api-partners.oddsscanner.com/api/v1/reports"

headers = {
    "X-API-Key": API_KEY,
    "accept": "application/json"
}

params = {
    "start_date": "2026-03-01",
    "end_date": "2026-03-14"
}

print(f"Buscando RELATÓRIO GLOBAL de 01/03 até 14/03...")
r = requests.get(BASE_URL, headers=headers, params=params)
if not r.ok:
    print(f"Erro: {r.status_code} - {r.text}")
else:
    data = r.json()
    items = data.get("data", [])
    if not items:
        print("Nenhum dado no relatório global para hoje.")
    else:
        for item in items:
            metrics = item.get("metrics", {})
            print(f"DATA: {item.get('date')} | Cliques Totais: {metrics.get('clicks')}")

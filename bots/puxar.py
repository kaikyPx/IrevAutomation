import requests
import json
import socket
import urllib3.util.connection as urllib3_cn

# Forçar o uso de IPv4
def allowed_gai_family():
    return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

API_KEY = "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To"
BASE_URL = "https://api-partners.oddsscanner.com/api/v1/reports/sources"

headers = {
    "X-API-Key": "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To",
    "accept": "application/json"
}

params = {
    "start_date": "2026-03-01",
    "end_date": "2026-03-14",
    "page": 1,
    "page_size": 100
}

all_data = []

while True:
    print(f"Baixando página {params['page']}...")
    response = requests.get(BASE_URL, headers=headers, params=params, timeout=30)
    response.raise_for_status()

    data = response.json()

    # A API retorna os dados na chave "data"
    results = data.get("data", [])

    if not results:
        print("Nenhum dado encontrado.")
        break

    for item in results:
        ts_name = item.get("traffic_source_name", "N/A")
        adv_name = item.get("advertiser_name", "N/A")
        # Pega a primeira data disponível para mostrar um exemplo de métrica
        first_date_metrics = item.get("dates", [{}])[0].get("metrics", {})
        clicks = first_date_metrics.get("clicks", 0)
        print(f"Fonte: {ts_name} | Casa: {adv_name} | Cliques: {clicks}")

    all_data.extend(results)

    if len(results) < params["page_size"]:
        break

    params["page"] += 1

with open("traffic_sources_all.json", "w", encoding="utf-8") as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

print(f"Finalizado. Total de registros: {len(all_data)}")
import socket
import urllib3.util.connection as urllib3_cn
import requests
import json

def allowed_gai_family():
    return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

API_TOKEN = "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To"
BASE_URL = "https://api-partners.oddsscanner.com"
api_headers = {"X-API-Key": API_TOKEN, "accept": "application/json"}

print("=== Listando TODOS os Affiliate Links da conta ===")
r = requests.get(f"{BASE_URL}/api/v1/affiliate-links", headers=api_headers, timeout=30)
if r.ok:
    data = r.json().get('data', [])
    print(f"Total de links encontrados: {len(data)}")
    target_found = False
    for l in data:
        print(f"ID: {l.get('id')} | Nome: {l.get('name')} | Adv: {l.get('advertiser_name')}")
        if str(l.get('id')) == "20954":
            target_found = True
            print(">>> ACHEI O LINK 20954 <<<")
    
    if not target_found:
        print("\nAVISO: O ID 20954 NAO ESTA NESTA LISTA.")
else:
    print(f"Erro: {r.status_code} - {r.text}")

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

now = datetime.now()
start_date = now.replace(day=1).strftime("%Y-%m-%d")
end_date = now.strftime("%Y-%m-%d")

headers = {"X-API-Key": API_TOKEN, "accept": "application/json"}

print("--- TESTING MONTHLY GRANULARITY ---")
params = {
    "start_date": start_date, 
    "end_date": end_date, 
    "page_size": 5, 
    "page": 1,
    "granularity": "monthly" # Trying 'monthly'
}

r = requests.get(f"{BASE_URL}/api/v1/reports/sources", headers=headers, params=params)
if r.status_code == 200:
    print("SUCCESS with 'monthly'")
    print(json.dumps(r.json().get('data', [])[:1], indent=2))
else:
    print(f"FAILED with 'monthly': {r.status_code}")
    print(r.text)

print("\n--- TESTING MONTH GRANULARITY ---")
params["granularity"] = "month" # Trying 'month'
r = requests.get(f"{BASE_URL}/api/v1/reports/sources", headers=headers, params=params)
if r.status_code == 200:
    print("SUCCESS with 'month'")
    print(json.dumps(r.json().get('data', [])[:1], indent=2))
else:
    print(f"FAILED with 'month': {r.status_code}")

print("\n--- TESTING WITHOUT GRANULARITY (DEFAULT) ---")
del params["granularity"]
r = requests.get(f"{BASE_URL}/api/v1/reports/sources", headers=headers, params=params)
print(f"Status default: {r.status_code}")
print(json.dumps(r.json().get('data', [])[:1], indent=2))

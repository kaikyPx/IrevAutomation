import json
with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
ids_json = ["1458", "1491", "2216", "2289", "4484"]
found = []
for item in data:
    link_id = str(item.get('affiliate_link_id'))
    link_name = str(item.get('affiliate_link_name'))
    ts_name = str(item.get('traffic_source_name'))
    
    if "Ana" in link_name or "Ana" in ts_name or link_id in ids_json or "#114" in link_name or "#114" in ts_name:
        found.append(item)

print(json.dumps(found, indent=2))

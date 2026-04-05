import json
with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
found = []
for item in data:
    link_id = str(item.get('affiliate_link_id'))
    link_name = str(item.get('affiliate_link_name'))
    ts_name = str(item.get('traffic_source_name'))
    
    if "2216" in link_id or "2216" in link_name:
        found.append(item)

print(json.dumps(found, indent=2))

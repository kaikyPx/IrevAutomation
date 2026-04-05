import json
with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
ids_ana = ["1458", "1491", "2216", "2289", "4484"]
found = []
for item in data:
    if str(item.get('affiliate_link_id')) in ids_ana:
        found.append(item)

print(json.dumps(found, indent=2))

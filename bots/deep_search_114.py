import json
with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
found = []
for item in data:
    if "114" in str(item):
        found.append(item)

print(json.dumps(found, indent=2))

import json
with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
found = []
for item in data:
    s = str(item).lower()
    if 'ana' in s or '#114' in s:
        found.append(item)

print(f"Total encontrados: {len(found)}")
if found:
    print(json.dumps(found, indent=2))
else:
    print("Nenhum registro encontrado para Ana ou #114.")

import json
with open('c:/Users/Kaiky/Desktop/bots/cadastro.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    print(json.dumps(data.get('120'), indent=2))

import json

# Search in API dump
with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', encoding='utf-8') as f:
    api_data = json.load(f)

found = [i for i in api_data if 'seguro' in str(i).lower() or 'betfair' in str(i).lower()]
print(f"API dump - SeguroBet/Betfair encontradas: {len(found)}")
for i in found:
    print(f"  {i['advertiser_name']} | {i['affiliate_link_name']}")

print("\nTodas as casas no dump:")
advs = sorted(set(i['advertiser_name'] for i in api_data))
for a in advs:
    print(f"  {a}")

# Search in cadastro
with open('c:/Users/Kaiky/Desktop/bots/cadastro.json', encoding='utf-8') as f:
    cad = json.load(f)

print("\nBuscando SeguroBet/Betfair no cadastro.json:")
for uid, udata in cad.items():
    nome = udata.get('nome', '')
    for sub in udata.get('sub_cadastros', []):
        casa = sub.get('nome_casa', '')
        if 'seguro' in casa.lower() or 'betfair' in casa.lower():
            print(f"  Afiliado {uid} ({nome}): {casa} | ID Oferta: {sub.get('id_oferta')} | ID Link: {sub.get('id_link_oferta')}")

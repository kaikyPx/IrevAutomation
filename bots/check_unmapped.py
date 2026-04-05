import json
import re

with open('c:/Users/Kaiky/Desktop/bots/cadastro.json', 'r', encoding='utf-8') as f:
    cadastro = json.load(f)

with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', 'r', encoding='utf-8') as f:
    api_data = json.load(f)

link_to_uid = {}
for uid, udata in cadastro.items():
    for sub in udata.get('sub_cadastros', []):
        lid = str(sub.get('id_link_oferta'))
        if lid: link_to_uid[lid] = uid

unmapped = []
for item in api_data:
    link_id = str(item.get('affiliate_link_id'))
    link_name = item.get('affiliate_link_name', '')
    ts_name = item.get('traffic_source_name', '')
    
    match = re.search(r'#(\d+)', link_name)
    if not match: match = re.search(r'#(\d+)', ts_name)
    
    uid = None
    if match:
        extracted_id = match.group(1)
        if extracted_id in cadastro:
            uid = extracted_id
    
    if not uid and link_id in link_to_uid:
        uid = link_to_uid[link_id]
        
    if not uid:
        metrics = {"regs": 0, "ftds": 0, "dep": 0, "rev": 0}
        for d in item.get('dates', []):
            m = d.get('metrics', {})
            metrics["regs"] += m.get('signups', 0)
            metrics["ftds"] += m.get('ftds', 0)
            metrics["dep"] += m.get('deposits', 0)
            metrics["rev"] += m.get('net_revenue', 0)
        
        if any(v > 0 for v in metrics.values()):
            unmapped.append({
                "link_id": link_id,
                "name": link_name,
                "ts": ts_name,
                "metrics": metrics
            })

print(f"Total desvinculados com dados: {len(unmapped)}")
print(json.dumps(unmapped, indent=2))

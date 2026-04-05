import json
with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
results = []
for item in data:
    metrics = {"regs": 0, "ftds": 0, "dep": 0, "rev": 0}
    for d in item.get('dates', []):
        m = d.get('metrics', {})
        metrics["regs"] += m.get('signups', 0)
        metrics["ftds"] += m.get('ftds', 0)
        metrics["dep"] += m.get('deposits', 0)
        metrics["rev"] += m.get('net_revenue', 0)
    
    if any(v > 0 for v in metrics.values()):
        results.append({
            "id": item.get('affiliate_link_id'),
            "name": item.get('affiliate_link_name'),
            "ts": item.get('traffic_source_name'),
            "stats": metrics
        })

with open('c:/Users/Kaiky/Desktop/bots/active_full.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
print(f"Total ativos: {len(results)}")

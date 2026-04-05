import json
with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    
houses_ana = [173, 216, 220, 228, 233] # BetMGM, Multibet, CampeonBet, Casa de Aposta, Betfair
results = []
for item in data:
    if item.get('advertiser_id') in houses_ana:
        metrics = {"signups": 0, "ftds": 0, "deposits": 0, "net_revenue": 0}
        for d in item.get('dates', []):
            m = d.get('metrics', {})
            metrics["signups"] += m.get('signups', 0)
            metrics["ftds"] += m.get('ftds', 0)
            metrics["deposits"] += m.get('deposits', 0)
            metrics["net_revenue"] += m.get('net_revenue', 0)
        
        if any(v > 0 for v in metrics.values()):
            results.append({
                "link_id": item.get('affiliate_link_id'),
                "link_name": item.get('affiliate_link_name'),
                "ts_name": item.get('traffic_source_name'),
                "metrics": metrics
            })

print(json.dumps(results, indent=2))

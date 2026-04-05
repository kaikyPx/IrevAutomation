import json
with open('c:/Users/Kaiky/Desktop/bots/all_api_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

ids_pedro = ["20094", "1386", "1479", "1365", "1798", "1882", "1985", "3151", "3152", "3153", "3154", "4014", "4021", "4022", "4056", "4191", "4206"]
found = []
for item in data:
    lid = str(item.get('affiliate_link_id'))
    if lid in ids_pedro:
        found.append(item)

# Also check for name match without tag
for item in data:
    name = str(item.get('affiliate_link_name')).lower()
    ts = str(item.get('traffic_source_name')).lower()
    if ("pedro" in name and "ivan" in name) or ("pedro" in ts and "ivan" in ts):
        if item not in found:
            found.append(item)

print(f"Total: {len(found)}")
for f in found:
    metrics = {"regs": 0, "ftds": 0, "dep": 0, "rev": 0}
    for d in f.get('dates', []):
        m = d.get('metrics', {})
        metrics["regs"] += m.get('signups', 0)
        metrics["ftds"] += m.get('ftds', 0)
        metrics["dep"] += m.get('deposits', 0)
        metrics["rev"] += m.get('net_revenue', 0)
    print(f"LinkID: {f.get('affiliate_link_id')} | Name: {f.get('affiliate_link_name')} | House: {f.get('advertiser_name')} | Metrics: {metrics}")

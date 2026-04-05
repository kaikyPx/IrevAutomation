import json
import requests
import socket
import re
import urllib3.util.connection as urllib3_cn
from datetime import datetime
import calendar
from prettytable import PrettyTable

# Forçar o uso de IPv4 (necessário se o seu sistema usa IPv6 mas a API só libera IPv4 no whitelist)
def allowed_gai_family():
    return socket.AF_INET

urllib3_cn.allowed_gai_family = allowed_gai_family

# Configurações
API_TOKEN = "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To"
BASE_URL = "https://api-partners.oddsscanner.com"
CADASTRO_FILE = r"c:\Users\Kaiky\Desktop\bots\cadastro.json"

def get_month_range():
    now = datetime.now()
    first_day = now.replace(day=1).strftime("%Y-%m-%d")
    last_day = now.strftime("%Y-%m-%d")
    return first_day, last_day

def load_cadastro():
    try:
        with open(CADASTRO_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Erro ao carregar cadastro.json: {e}")
        return {}

def fetch_api_data(endpoint, params):
    headers = {
        "X-API-Key": API_TOKEN,
        "accept": "application/json"
    }
    all_data = []
    page = 1
    
    while True:
        params['page'] = page
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, params=params)
            if response.status_code != 200:
                print(f"Erro na API ({response.status_code}): {response.text}")
                break
            
            payload = response.json()
            data = payload.get('data', [])
            all_data.extend(data)
            
            if page >= payload.get('total_pages', 1):
                break
            page += 1
        except Exception as e:
            print(f"Erro na requisição: {e}")
            break
            
    return all_data

def main():
    print("Iniciando busca de resultados do mês...")
    start_date, end_date = get_month_range()
    print(f"Período: {start_date} até {end_date}")
    
    cadastro = load_cadastro()
    if not cadastro:
        return

    # Buscar dados de todos os links de uma vez para performance
    params = {
        "start_date": start_date,
        "end_date": end_date,
        "page_size": 100,
        "granularity": "monthly"
    }
    
    api_results = fetch_api_data("/api/v1/reports/sources", params)
    
    # DEBUG: Verificar o que está vindo da API
    print(f"Debug: Recebidos {len(api_results)} registros da API.")
    if api_results:
        print(f"Debug: Exemplo do primeiro registro: {json.dumps(api_results[0], indent=2)}")
    
    # Mapeamento reverso para fallback (caso não tenha #ID no nome)
    link_to_uid = {}
    for uid, udata in cadastro.items():
        for sub in udata.get('sub_cadastros', []):
            lid = str(sub.get('id_link_oferta'))
            if lid: link_to_uid[lid] = uid

    # Mapear resultados da API filtrando pelos Afiliados cadastrados
    stats_map = {}
    for item in api_results:
        link_id = str(item.get('affiliate_link_id'))
        link_name = item.get('affiliate_link_name', '')
        ts_name = item.get('traffic_source_name', '')
        
        # Try to extract #ID from names (Odds Scanner pattern)
        match = re.search(r'#(\d+)', link_name)
        if not match: match = re.search(r'#(\d+)', ts_name)
        
        uid = None
        if match:
            extracted_id = match.group(1)
            if extracted_id in cadastro:
                uid = extracted_id
        
        # Fallback to local manual registration
        if not uid and link_id in link_to_uid:
            uid = link_to_uid[link_id]
            
        if not uid:
            continue
            
        adv_id = str(item.get('advertiser_id'))
        adv_name = item.get('advertiser_name', 'Desconhecida')
        
        if link_id not in stats_map:
            stats_map[link_id] = {
                "uid": uid,
                "nome": cadastro[uid].get('nome', 'N/A'),
                "adv_id": adv_id,
                "adv_name": adv_name,
                "registros": 0, "ftds": 0, "cpa_count": 0, "depositos": 0, "ngr": 0
            }
            
        total_metrics = stats_map[link_id]
        for date_info in item.get('dates', []):
            m = date_info.get('metrics', {})
            total_metrics["registros"] += m.get('signups', 0)
            total_metrics["ftds"] += m.get('ftds', 0)
            total_metrics["cpa_count"] += m.get('cpa_count', 0)
            total_metrics["depositos"] += m.get('deposits', 0)
            total_metrics["ngr"] += m.get('net_revenue', 0)

    print(f"DEBUG: Encontrados {len(stats_map)} links de afiliados na API que existem no cadastro local.")
    
    # Montar a tabela
    table = PrettyTable()
    table.field_names = ["ID Afiliado", "Nome", "Casa", "ID Oferta", "ID Link", "Registros", "FTDs", "CPAs", "Depósitos", "REV (NGR)"]
    
    found_any = False
    for lid, stats in stats_map.items():
        if any(stats[k] > 0 for k in ["registros", "ftds", "cpa_count", "depositos", "ngr"]):
            
            id_off_local, id_link_local = find_local_ids_for_casa(
                stats['uid'], stats['adv_name'], stats['adv_id'], lid, cadastro
            )
            
            table.add_row([
                stats['uid'],
                stats['nome'],
                stats['adv_name'],
                id_off_local,
                id_link_local,
                stats["registros"],
                stats["ftds"],
                stats["cpa_count"],
                f"{stats['depositos']:.2f}",
                f"{stats['ngr']:.2f}"
            ])
            found_any = True

    print(f"DEBUG: O table tem {len(table._rows)} linhas.")
    print(table)
    input("\nPressione Enter para sair...")

def find_local_ids_for_casa(uid, casa_api, fallback_adv, fallback_lid, cadastro):
    import difflib
    adv_clean = casa_api.lower()
    best_match = None
    highest_ratio = 0.0

    user_data = cadastro.get(str(uid), {})
    for sub in user_data.get('sub_cadastros', []):
        casa_local = sub.get('nome_casa', '').lower()
        if not casa_local:
            continue
            
        if casa_local in adv_clean or adv_clean in casa_local:
            return sub.get('id_oferta', ''), sub.get('id_link_oferta', '')
            
        if "esporte" in casa_local and "sorte" in casa_local and "esporte" in adv_clean and "sorte" in adv_clean:
            return sub.get('id_oferta', ''), sub.get('id_link_oferta', '')
            
        if "f12" in casa_local and "f12" in adv_clean:
            return sub.get('id_oferta', ''), sub.get('id_link_oferta', '')

        ratio = difflib.SequenceMatcher(None, casa_local, adv_clean).ratio()
        if ratio > highest_ratio:
            highest_ratio = ratio
            best_match = sub
            
    if highest_ratio > 0.4 and best_match:
        return best_match.get('id_oferta', ''), best_match.get('id_link_oferta', '')
        
    return fallback_adv, fallback_lid

if __name__ == "__main__":
    main()

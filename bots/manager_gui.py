import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import json
import os
import requests
import socket
import re
import urllib3.util.connection as urllib3_cn
from datetime import datetime
try:
    from tkcalendar import DateEntry
except ImportError:
    # Fallback caso não esteja instalado (mas vou instalar no ambiente)
    DateEntry = None

# Forçar o uso de IPv4 (necessário para o whitelist do Partners API)
def allowed_gai_family():
    return socket.AF_INET
urllib3_cn.allowed_gai_family = allowed_gai_family

import sys

def get_resource_path(relative_path):
    """ Retorna o caminho para recursos embutidos no EXE ou no script local """
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

def get_save_path():
    """ Retorna o caminho seguro na pasta LocalAppData do Windows """
    app_dir = os.path.join(os.environ.get('LOCALAPPDATA', os.path.expanduser('~')), 'GestorOddsScanner')
    if not os.path.exists(app_dir):
        try:
            os.makedirs(app_dir)
        except:
            return "cadastro.json" # Fallback para pasta local se falhar
    return os.path.join(app_dir, 'cadastro_data.json')

API_TOKEN = "IL44J1fVGreHplLHQXuA8trqruzewgjPwnxGewA16To"
BASE_URL = "https://api-partners.oddsscanner.com"
CADASTRO_FILE = get_save_path()
SNAPSHOT_FILE = CADASTRO_FILE.replace('cadastro_data.json', 'last_snapshot.json')
DEFAULT_DATA_FILE = get_resource_path("cadastro.json")

class DashboardApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Gestor Odds Scanner - v2.0")
        self.root.geometry("1100x700")
        
        # Vars
        self.delta_mode = tk.BooleanVar(value=False)
        
        # Load Data
        self.cadastro = self.load_json()
        
        # Style
        self.style = ttk.Style()
        self.style.configure("Treeview", rowheight=25)
        self.style.configure("TButton", padding=5)
        
        # UI Setup
        self.setup_tabs()
        
    def load_json(self):
        # 1. Tentar carregar da pasta segura (AppData)
        if os.path.exists(CADASTRO_FILE):
            try:
                with open(CADASTRO_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        
        # 2. Se não existir, carrega o banco "padrão" que enviamos dentro do EXE
        if os.path.exists(DEFAULT_DATA_FILE):
            try:
                with open(DEFAULT_DATA_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Salva uma cópia na AppData para permitir edições futuras
                    self.cadastro = data
                    self.save_json()
                    return data
            except:
                pass
                
        return {}

    def save_json(self):
        try:
            with open(CADASTRO_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.cadastro, f, indent=2, ensure_ascii=False)
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao salvar: {e}")

    def setup_tabs(self):
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True)

        # Tab 1: Relatório de Resultados
        self.tab_report = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_report, text=" 📊 Resultados do Mês ")
        self.setup_report_ui()

        # Tab 2: Gestão de Afiliados
        self.tab_manage = ttk.Frame(self.notebook)
        self.notebook.add(self.tab_manage, text=" 👥 Gestão de Afiliados ")
        self.setup_manage_ui()

    # --- UI RELATÓRIO ---
    def setup_report_ui(self):
        top_frame = ttk.Frame(self.tab_report)
        top_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(top_frame, text="Relatório Consolidado", font=("Arial", 14, "bold")).pack(side=tk.LEFT)
        
        # Filtros de Data
        filter_frame = ttk.Frame(top_frame)
        filter_frame.pack(side=tk.RIGHT, padx=20)
        
        now = datetime.now()
        default_start = now.replace(day=1).strftime("%Y-%m-%d")
        default_end = now.strftime("%Y-%m-%d")
        
        ttk.Label(filter_frame, text="Início:").pack(side=tk.LEFT, padx=2)
        if DateEntry:
            self.entry_start = DateEntry(filter_frame, width=12, background='darkblue', 
                                         foreground='white', borderwidth=2, date_pattern='yyyy-mm-dd')
            self.entry_start.set_date(now.replace(day=1))
        else:
            self.entry_start = ttk.Entry(filter_frame, width=12)
            self.entry_start.insert(0, default_start)
        self.entry_start.pack(side=tk.LEFT, padx=5)
        
        ttk.Label(filter_frame, text="Fim:").pack(side=tk.LEFT, padx=2)
        if DateEntry:
            self.entry_end = DateEntry(filter_frame, width=12, background='darkblue', 
                                       foreground='white', borderwidth=2, date_pattern='yyyy-mm-dd')
            self.entry_end.set_date(now)
        else:
            self.entry_end = ttk.Entry(filter_frame, width=12)
            self.entry_end.insert(0, default_end)
        self.entry_end.pack(side=tk.LEFT, padx=5)

        # Checkbox Diferença
        self.check_delta = ttk.Checkbutton(top_frame, text="Ver apenas Incremento (Delta)", variable=self.delta_mode)
        self.check_delta.pack(side=tk.RIGHT, padx=10)

        self.btn_refresh = ttk.Button(top_frame, text="🔄 Atualizar Dados", command=self.fetch_and_display_report)
        self.btn_refresh.pack(side=tk.RIGHT)
        self.btn_export = ttk.Button(top_frame, text="📥 Exportar CSV", command=self.export_to_csv)
        self.btn_export.pack(side=tk.RIGHT, padx=5)

        # Botão de Debug - Adicionado novamente para Diagnósticos
        self.btn_debug = ttk.Button(top_frame, text="🔧 Debug", command=self.show_debug_window)
        self.btn_debug.pack(side=tk.RIGHT, padx=5)

        # Tabela de Resultados
        cols = ("id", "nome", "casa", "oferta", "link", "registros", "ftds", "cpas", "dep_bin", "depositos", "rev_bin", "ngr")
        self.report_tree = ttk.Treeview(self.tab_report, columns=cols, show="headings")
        
        headers = ["ID Afiliado", "Nome", "Casa", "ID Oferta", "ID Link", "Registros", "FTDs", "CPAs", "Depósito", "Depósitos Valor", "REV", "REV Valor"]
        for col, head in zip(cols, headers):
            self.report_tree.heading(col, text=head)
            self.report_tree.column(col, width=80, anchor=tk.CENTER)
        
        self.report_tree.column("nome", width=120, anchor=tk.W)
        self.report_tree.column("casa", width=120, anchor=tk.W)
        self.report_tree.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        # Sumário
        self.summary_lbl = ttk.Label(self.tab_report, text="Clique em 'Atualizar' para puxar os dados.", font=("Arial", 10, "italic"))
        self.summary_lbl.pack(pady=5)


    def find_local_ids_for_casa(self, uid, casa_api, fallback_adv, fallback_lid):
        import difflib
        adv_clean = casa_api.lower()
        best_match = None
        highest_ratio = 0.0

        user_data = self.cadastro.get(str(uid), {})
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

    def fetch_and_display_report(self):
        # Pegar datas dos seletores
        if DateEntry and isinstance(self.entry_start, DateEntry):
            start_date = self.entry_start.get_date().strftime("%Y-%m-%d")
            end_date = self.entry_end.get_date().strftime("%Y-%m-%d")
        else:
            start_date = self.entry_start.get().strip()
            end_date = self.entry_end.get().strip()
        
        # Validar formato básico (apenas se for Entry comum)
        if not isinstance(self.entry_start, DateEntry):
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", start_date) or not re.match(r"^\d{4}-\d{2}-\d{2}$", end_date):
                messagebox.showerror("Erro", "Formato de data inválido! Use AAAA-MM-DD")
                return

        self.btn_refresh.config(state=tk.DISABLED, text="Carregando...")
        
        try:
            # Configuração de Headers (Credenciais da API)
            api_headers = {
                "X-API-Key": API_TOKEN, 
                "accept": "application/json"
            }

            # 1. Puxar Totais por Pessoa (/traffic-sources) - A Verdade Absoluta
            all_ts_data = []
            page = 1
            while True:
                params_ts = {
                    "start_date": start_date, 
                    "end_date": end_date, 
                    "page_size": 100, 
                    "page": page, 
                    "granularity": "monthly"
                }
                r = requests.get(f"{BASE_URL}/api/v1/reports/traffic-sources", headers=api_headers, params=params_ts, timeout=30)
                if r.status_code != 200:
                    error_msg = f"Erro API Traffic Sources [{r.status_code}]: {r.text[:300]}"
                    messagebox.showerror("Erro de Permissão", error_msg)
                    break
                payload = r.json()
                all_ts_data.extend(payload.get('data', []))
                if page >= payload.get('total_pages', 1):
                    break
                page += 1

            # 2. Puxar Detalhamento por Casa (/sources) - Casas conhecidas
            all_sources_data = []
            page = 1
            while True:
                params_src = {
                    "start_date": start_date, 
                    "end_date": end_date, 
                    "page_size": 100, 
                    "page": page, 
                    "granularity": "monthly"
                }
                r = requests.get(f"{BASE_URL}/api/v1/reports/sources", headers=api_headers, params=params_src, timeout=30)
                if r.status_code != 200:
                    error_msg = f"Erro API Sources [{r.status_code}]: {r.text[:300]}"
                    messagebox.showerror("Erro de Permissão", error_msg)
                    break
                payload = r.json()
                data_page = payload.get('data', [])
                all_sources_data.extend(data_page)
                if page >= payload.get('total_pages', 1):
                    break
                page += 1

            # Mapeamento reverso para fallback (caso não tenha #ID no nome)
            link_to_uid = {}
            for uid, udata in self.cadastro.items():
                for sub in udata.get('sub_cadastros', []):
                    lid = str(sub.get('id_link_oferta'))
                    if lid: link_to_uid[lid] = uid

            # Processar 1: Mapear Totais por Pessoa
            ts_totals = {}
            for ts in all_ts_data:
                name = ts.get('traffic_source_name', '')
                match = re.search(r'#(\d+)', name)
                if match:
                    uid = match.group(1)
                    m = ts.get('dates', [{}])[0].get('metrics', {})
                    ts_totals[uid] = {
                        "signups": m.get("signups", 0),
                        "ftds": m.get("ftds", 0),
                        "cpa_count": m.get("cpa_count", 0),
                        "deposits": m.get("deposits", 0),
                        "net_revenue": m.get("net_revenue", 0)
                    }

            # Processar 2: Agrupar por Casa/Link
            stats_map = {}
            current_sums = {} # Para reconciliação
            
            for item in all_sources_data:
                link_id = str(item.get('affiliate_link_id'))
                link_name = item.get('affiliate_link_name', '')
                ts_name = item.get('traffic_source_name', '')
                
                match = re.search(r'#(\d+)', link_name)
                if not match: match = re.search(r'#(\d+)', ts_name)
                
                uid = None
                if match:
                    extracted_id = match.group(1)
                    if extracted_id in self.cadastro: uid = extracted_id
                
                if not uid and link_id in link_to_uid: uid = link_to_uid[link_id]
                if not uid: continue
                
                adv_id = str(item.get('advertiser_id'))
                adv_name = item.get('advertiser_name', 'Desconhecida')
                
                if link_id not in stats_map:
                    stats_map[link_id] = {
                        "uid": uid,
                        "nome": self.cadastro[uid].get('nome', 'N/A'),
                        "adv_id": adv_id,
                        "adv_name": adv_name,
                        "signups": 0, "ftds": 0, "cpa_count": 0, "deposits": 0, "net_revenue": 0
                    }
                
                m_sum = stats_map[link_id]
                for date_info in item.get('dates', []):
                    m = date_info.get('metrics', {})
                    m_sum["signups"] += m.get("signups", 0)
                    m_sum["ftds"] += m.get("ftds", 0)
                    m_sum["cpa_count"] += m.get("cpa_count", 0)
                    m_sum["deposits"] += m.get("deposits", 0)
                    m_sum["net_revenue"] += m.get("net_revenue", 0)

            # Processar 2.5: Somar totais por usuário para reconciliação
            for lid, s in stats_map.items():
                uid = s['uid']
                if uid not in current_sums: current_sums[uid] = {"dep": 0, "rev": 0, "sig": 0, "ftd": 0, "cpa": 0}
                current_sums[uid]["dep"] += s["deposits"]
                current_sums[uid]["rev"] += s["net_revenue"]
                current_sums[uid]["sig"] += s["signups"]
                current_sums[uid]["ftd"] += s["ftds"]
                current_sums[uid]["cpa"] += s["cpa_count"]

            # Processar 3: Reconciliação (Adicionar Casas Ocultas)
            for uid, master in ts_totals.items():
                if uid not in self.cadastro: continue
                
                cur = current_sums.get(uid, {"dep": 0, "rev": 0, "sig": 0, "ftd": 0, "cpa": 0})
                diff_dep = master["deposits"] - cur["dep"]
                diff_rev = master["net_revenue"] - cur["rev"]
                
                if abs(diff_dep) > 0.01 or abs(diff_rev) > 0.01 or (master["signups"] > cur["sig"]):
                    fake_id = f"oculto_{uid}"
                    stats_map[fake_id] = {
                        "uid": uid,
                        "nome": self.cadastro[uid].get('nome', 'N/A'),
                        "adv_id": "999",
                        "adv_name": "Outras Casas (Betfair/SeguroBet)",
                        "signups": max(0, master["signups"] - cur["sig"]),
                        "ftds": max(0, master["ftds"] - cur["ftd"]),
                        "cpa_count": max(0, master["cpa_count"] - cur["cpa"]),
                        "deposits": diff_dep,
                        "net_revenue": diff_rev
                    }

            # --- LÓGICA DE SNAPSHOT (INCREMENTO) ---
            old_snapshot = {}
            if os.path.exists(SNAPSHOT_FILE):
                try:
                    with open(SNAPSHOT_FILE, 'r', encoding='utf-8') as f:
                        old_snapshot = json.load(f)
                except: pass
            
            # Salvar Snapshot ATUAL (antes de subtrair para a exibição)
            try:
                with open(SNAPSHOT_FILE, 'w', encoding='utf-8') as f:
                    json.dump(stats_map, f, indent=2, ensure_ascii=False)
            except: pass

            # --- PROCESSAR EXIBIÇÃO ---
            self.report_tree.delete(*self.report_tree.get_children())
            totals = {"regs": 0, "ftds": 0, "cpas": 0, "dep": 0, "ngr": 0}
            
            # Ordenar por nome antes de inserir
            sorted_stats = sorted(stats_map.items(), key=lambda x: x[1]['nome'].lower())
            
            for lid, stats in sorted_stats:
                # Se modo delta estiver on e tivermos dado antigo, subtraímos
                display_stats = stats.copy()
                if self.delta_mode.get() and lid in old_snapshot:
                    old = old_snapshot[lid]
                    display_stats["signups"] = max(0, stats["signups"] - old.get("signups", 0))
                    display_stats["ftds"] = max(0, stats["ftds"] - old.get("ftds", 0))
                    display_stats["cpa_count"] = max(0, stats["cpa_count"] - old.get("cpa_count", 0))
                    display_stats["deposits"] = max(0.0, stats["deposits"] - old.get("deposits", 0.0))
                    display_stats["net_revenue"] = stats["net_revenue"] - old.get("net_revenue", 0.0)

                if any(display_stats[k] > 0 or display_stats[k] < 0 for k in ["signups", "ftds", "cpa_count", "deposits", "net_revenue"]):
                    
                    id_off_local, id_link_local = self.find_local_ids_for_casa(
                        display_stats['uid'], display_stats['adv_name'], display_stats['adv_id'], lid
                    )
                    
                    dep_val = display_stats['deposits']
                    rev_val = display_stats['net_revenue']
                    dep_bin = 1 if dep_val > 0 else 0
                    rev_bin = 1 if rev_val > 1.0 or rev_val < -1.0 else 0 # Pequena margem para flutuação

                    self.report_tree.insert("", tk.END, values=(
                        display_stats['uid'], display_stats['nome'], display_stats['adv_name'], id_off_local, id_link_local,
                        display_stats['signups'], display_stats['ftds'], display_stats['cpa_count'],
                        dep_bin, f"{dep_val:.2f}", rev_bin, f"{rev_val:.2f}"
                    ))
                    totals["regs"] += display_stats['signups']
                    totals["ftds"] += display_stats['ftds']
                    totals["cpas"] += display_stats['cpa_count']
                    totals["dep"] += display_stats['deposits']
                    totals["ngr"] += display_stats['net_revenue']

            
            self.summary_lbl.config(text=f"Total do Mês: {totals['regs']} Registros | {totals['ftds']} FTDs | {totals['cpas']} CPAs | Depósitos: {totals['dep']:.2f} | REV: {totals['ngr']:.2f}", font=("Arial", 10, "bold"))

        except Exception as e:
            messagebox.showerror("Erro", f"Erro na conexão: {e}")
        
        self.btn_refresh.config(state=tk.NORMAL, text="🔄 Atualizar Dados da API")

    def export_to_csv(self):
        from tkinter import filedialog
        import csv
        
        items = self.report_tree.get_children()
        if not items:
            messagebox.showinfo("Aviso", "Não há dados para exportar. Atualize o relatório primeiro.")
            return
            
        file_path = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV (Excel)", "*.csv"), ("Todos os Arquivos", "*.*")],
            title="Salvar Relatório",
            initialfile=f"relatorio_afiliados_{datetime.now().strftime('%Y%m%d')}.csv"
        )
        
        if not file_path:
            return
            
        # utf-8-sig ensures Excel opens the CSV correctly with special characters
        try:
            with open(file_path, 'w', newline='', encoding='utf-8-sig') as f:
                writer = csv.writer(f, delimiter=';') # Use semicolon for Excel PT-BR compatibility
                # Header
                headers = [self.report_tree.heading(col)["text"] for col in self.report_tree["columns"]]
                writer.writerow(headers)
                
                # Rows
                for row_id in items:
                    row_data = self.report_tree.item(row_id)["values"]
                    writer.writerow(row_data)
                    
            messagebox.showinfo("Sucesso", f"Relatório exportado com sucesso para:\n{file_path}")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao exportar arquivo:\n{e}")

    # --- UI GESTÃO ---
    def setup_manage_ui(self):
        pane = ttk.PanedWindow(self.tab_manage, orient=tk.HORIZONTAL)
        pane.pack(fill=tk.BOTH, expand=True)

        # Esquerda: Lista de Afiliados
        left = ttk.Frame(pane)
        pane.add(left, weight=1)
        
        ttk.Label(left, text="Lista de Afiliados", font=("Arial", 11, "bold")).pack(pady=5)
        
        search_f = ttk.Frame(left)
        search_f.pack(fill=tk.X, padx=5)
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *a: self.refresh_aff_list())
        ttk.Entry(search_f, textvariable=self.search_var).pack(fill=tk.X, expand=True, padx=5)

        self.aff_tree = ttk.Treeview(left, columns=("id", "nome"), show="headings")
        self.aff_tree.heading("id", text="ID")
        self.aff_tree.heading("nome", text="Nome")
        self.aff_tree.column("id", width=60)
        self.aff_tree.pack(fill=tk.BOTH, expand=True, padx=5)
        self.aff_tree.bind("<<TreeviewSelect>>", self.on_aff_select)

        aff_btns = ttk.Frame(left)
        aff_btns.pack(pady=5)
        ttk.Button(aff_btns, text="+ Novo", command=self.add_aff).pack(side=tk.LEFT, padx=2)
        ttk.Button(aff_btns, text="✏️ Editar", command=self.edit_aff).pack(side=tk.LEFT, padx=2)
        ttk.Button(aff_btns, text="🗑️ Excluir", command=self.del_aff).pack(side=tk.LEFT, padx=2)

        io_btns = ttk.Frame(left)
        io_btns.pack(pady=5)
        ttk.Button(io_btns, text="📤 Exportar JSON", command=self.export_aff_json).pack(side=tk.LEFT, padx=2)
        ttk.Button(io_btns, text="📥 Importar JSON", command=self.import_aff_json).pack(side=tk.LEFT, padx=2)

        # Direita: Ofertas (Links)
        right = ttk.Frame(pane)
        pane.add(right, weight=2)

        self.lbl_edit = ttk.Label(right, text="Selecione um afiliado", font=("Arial", 11, "bold"), foreground="blue")
        self.lbl_edit.pack(pady=5)

        self.off_tree = ttk.Treeview(right, columns=("casa", "id_off", "id_link"), show="headings")
        self.off_tree.heading("casa", text="Casa")
        self.off_tree.heading("id_off", text="ID Oferta")
        self.off_tree.heading("id_link", text="ID Link API")
        self.off_tree.pack(fill=tk.BOTH, expand=True, padx=5)

        off_btns = ttk.Frame(right)
        off_btns.pack(pady=5)
        self.btn_add_off = ttk.Button(off_btns, text="➕ Adicionar Oferta", state=tk.DISABLED, command=self.add_off)
        self.btn_add_off.pack(side=tk.LEFT, padx=5)
        self.btn_del_off = ttk.Button(off_btns, text="❌ Remover Oferta", state=tk.DISABLED, command=self.del_off)
        self.btn_del_off.pack(side=tk.LEFT, padx=5)

        self.refresh_aff_list()

    def refresh_aff_list(self):
        self.aff_tree.delete(*self.aff_tree.get_children())
        search = self.search_var.get().lower()
        for uid in sorted(self.cadastro.keys(), key=lambda x: int(x) if x.isdigit() else 999):
            nome = self.cadastro[uid].get('nome', '')
            if search in uid or search in nome.lower():
                self.aff_tree.insert("", tk.END, values=(uid, nome))

    def on_aff_select(self, e):
        sel = self.aff_tree.selection()
        if not sel:
            self.lbl_edit.config(text="Selecione um afiliado")
            self.btn_add_off.config(state=tk.DISABLED)
            self.btn_del_off.config(state=tk.DISABLED)
            self.off_tree.delete(*self.off_tree.get_children())
            return
        
        uid, nome = self.aff_tree.item(sel[0])['values']
        self.lbl_edit.config(text=f"Ofertas de: {nome}")
        self.btn_add_off.config(state=tk.NORMAL)
        self.btn_del_off.config(state=tk.NORMAL)
        self.refresh_off_list(str(uid))

    def refresh_off_list(self, uid):
        self.off_tree.delete(*self.off_tree.get_children())
        for o in self.cadastro.get(uid, {}).get('sub_cadastros', []):
            self.off_tree.insert("", tk.END, values=(o.get('nome_casa'), o.get('id_oferta'), o.get('id_link_oferta')))

    # CRUD Logics
    def add_aff(self):
        uid = simpledialog.askstring("Novo", "ID do Afiliado:")
        if not uid or uid in self.cadastro: return
        nome = simpledialog.askstring("Novo", "Nome:")
        if not nome: return
        self.cadastro[uid] = {"nome": nome, "sub_cadastros": []}
        self.save_json(); self.refresh_aff_list()

    def edit_aff(self):
        sel = self.aff_tree.selection()
        if not sel: return
        uid = str(self.aff_tree.item(sel[0])['values'][0])
        novo = simpledialog.askstring("Editar", "Novo nome:", initialvalue=self.cadastro[uid]['nome'])
        if novo: self.cadastro[uid]['nome'] = novo; self.save_json(); self.refresh_aff_list()

    def del_aff(self):
        sel = self.aff_tree.selection()
        if not sel: return
        uid = str(self.aff_tree.item(sel[0])['values'][0])
        if messagebox.askyesno("Confirmar", f"Excluir {self.cadastro[uid]['nome']}?"):
            del self.cadastro[uid]; self.save_json(); self.refresh_aff_list(); self.on_aff_select(None)

    def add_off(self):
        sel = self.aff_tree.selection()
        if not sel: return
        uid = str(self.aff_tree.item(sel[0])['values'][0])
        casa = simpledialog.askstring("Oferta", "Casa (ex: LotoGreen):")
        if not casa: return
        id_off = simpledialog.askstring("Oferta", "ID Oferta:")
        id_link = simpledialog.askstring("Oferta", "ID Link API (consulte o arquivo lista_ids_api.txt):")
        self.cadastro[uid]['sub_cadastros'].append({"nome_casa": casa, "id_oferta": id_off or "", "id_link_oferta": id_link or ""})
        self.save_json(); self.refresh_off_list(uid)

    def del_off(self):
        sel_aff = self.aff_tree.selection()
        sel_off = self.off_tree.selection()
        if not sel_aff or not sel_off: return
        uid = str(self.aff_tree.item(sel_aff[0])['values'][0])
        idx = self.off_tree.index(sel_off[0])
        if messagebox.askyesno("Confirmar", "Remover esta oferta?"):
            self.cadastro[uid]['sub_cadastros'].pop(idx)
            self.save_json(); self.refresh_off_list(uid)

    def export_aff_json(self):
        from tkinter import filedialog
        file_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON", "*.json")],
            title="Exportar Afiliados",
            initialfile=f"export_afiliados_{datetime.now().strftime('%Y%m%d')}.json"
        )
        if not file_path: return
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self.cadastro, f, indent=2, ensure_ascii=False)
            messagebox.showinfo("Sucesso", "Exportado com sucesso!")
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao exportar: {e}")

    def import_aff_json(self):
        from tkinter import filedialog
        file_path = filedialog.askopenfilename(
            filetypes=[("JSON", "*.json")],
            title="Importar Afiliados"
        )
        if not file_path: return
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                imported_data = json.load(f)
            
            aff_count = 0
            house_count = 0
            
            for uid, data in imported_data.items():
                uid = str(uid)
                if uid not in self.cadastro:
                    self.cadastro[uid] = data
                    aff_count += 1
                    house_count += len(data.get('sub_cadastros', []))
                else:
                    # Merge sub_cadastros
                    existing_subs = self.cadastro[uid].get('sub_cadastros', [])
                    imported_subs = data.get('sub_cadastros', [])
                    
                    for imp_sub in imported_subs:
                        # Checar se a casa já existe
                        is_new = True
                        for ex_sub in existing_subs:
                            if (ex_sub.get('nome_casa') == imp_sub.get('nome_casa') and 
                                ex_sub.get('id_oferta') == imp_sub.get('id_oferta') and 
                                ex_sub.get('id_link_oferta') == imp_sub.get('id_link_oferta')):
                                is_new = False
                                break
                        
                        if is_new:
                            existing_subs.append(imp_sub)
                            house_count += 1
            
            self.save_json()
            self.refresh_aff_list()
            messagebox.showinfo("Importação Concluída", 
                                f"{aff_count} novos afiliados inseridos.\n"
                                f"{house_count} novas casas inseridas.")
                                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao importar: {e}")

    def show_debug_window(self):
        """ Janela de diagnóstico para verificar o estado da API e do cadastro local """
        debug_win = tk.Toplevel(self.root)
        debug_win.title("🔧 Diagnóstico / Debug")
        debug_win.geometry("700x500")

        from tkinter import scrolledtext
        txt = scrolledtext.ScrolledText(debug_win, font=("Consolas", 10))
        txt.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Informações Básicas
        txt.insert(tk.END, "=== CONFIGURAÇÕES ===\n")
        txt.insert(tk.END, f"API Token: {API_TOKEN[:4]}...{API_TOKEN[-4:]}\n")
        txt.insert(tk.END, f"Base URL: {BASE_URL}\n")
        txt.insert(tk.END, f"Arquivo Cadastro: {CADASTRO_FILE}\n")
        txt.insert(tk.END, f"Snapshot File: {SNAPSHOT_FILE}\n\n")

        # Verificar IP Público
        try:
            ip_r = requests.get("https://api.ipify.org", timeout=5)
            if ip_r.status_code == 200:
                txt.insert(tk.END, f"=== SEU IP PÚBLICO (Whitelist) ===\n")
                txt.insert(tk.END, f"IP: {ip_r.text}\n")
                txt.insert(tk.END, "Se receber Erro 403, este é o IP que deve ser liberado na API.\n\n")
        except:
            txt.insert(tk.END, "Não foi possível identificar o IP público.\n\n")

        # Estado do Cadastro
        txt.insert(tk.END, "=== CADASTRO LOCAL ===\n")
        txt.insert(tk.END, f"Total de Afiliados: {len(self.cadastro)}\n")
        
        # Mapeamento de Links
        link_count = 0
        for uid, data in self.cadastro.items():
            link_count += len(data.get('sub_cadastros', []))
        txt.insert(tk.END, f"Total de Links (Casas) Mapeados: {link_count}\n\n")

        # Verificar Snapshot
        if os.path.exists(SNAPSHOT_FILE):
            try:
                with open(SNAPSHOT_FILE, 'r', encoding='utf-8') as f:
                    snap_data = json.load(f)
                txt.insert(tk.END, f"=== SNAPSHOT ATUAL ===\n")
                txt.insert(tk.END, f"Registros no Snapshot: {len(snap_data)}\n")
                txt.insert(tk.END, "Última atualização de dados foi salva para o modo Delta.\n\n")
            except:
                txt.insert(tk.END, "ERRO ao ler Snapshot!\n\n")
        else:
            txt.insert(tk.END, "Nenhum snapshot encontrado.\n\n")

        txt.insert(tk.END, "=== LOGS DE CONSOLE ===\n")
        txt.insert(tk.END, "Verifique a janela de console (se aberta) para ver erros detalhados da API.\n")
        txt.insert(tk.END, "Certifique-se de que o seu IP está na Whitelist da API.\n")

    def run_app_debug(self):
        # Apenas um placeholder caso queira rodar logs externos
        pass

if __name__ == "__main__":
    root = tk.Tk()
    app = DashboardApp(root)
    root.mainloop()

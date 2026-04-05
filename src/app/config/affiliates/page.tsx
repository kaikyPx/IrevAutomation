'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, ShieldCheck, ShieldAlert, Search, Download, Upload, FileJson } from 'lucide-react';
import { AffiliateMapping } from '@/lib/mapping';

export default function AffiliatesConfigPage() {
  const [config, setConfig] = useState<Record<string, AffiliateMapping>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config/affiliates');
      const data = await res.json();
      setConfig(data.config || {});
    } catch (err) {
      console.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (affiliateId: string, data: AffiliateMapping) => {
    setSaving(true);
    try {
      await fetch('/api/config/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId, data })
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `affiliates_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (confirm('Sincronização Inteligente: A importação irá ADICIONAR novos casos e ATUALIZAR os existentes, mantendo intactos seus afiliados e IDs manuais atuais. Prosseguir?')) {
          setSaving(true);
          
          const res = await fetch('/api/config/affiliates', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: importedData })
          });

          if (res.ok) {
            fetchConfig(); // Recarregar
            alert('Sincronização (Merge) concluída! Novos dados integrados e os IDs manuais existentes foram preservados.');
          } else {
             const errorResult = await res.json();
             alert(`Erro na sincronização: ${errorResult.error}`);
          }
        }
      } catch (err) {
        alert('Erro ao processar o arquivo JSON. Verifique o formato.');
      } finally {
        setSaving(false);
      }
    };
    reader.readAsText(file);
  };

  const addSubCadastro = (id: string) => {
    const newConfig = { ...config };
    newConfig[id].sub_cadastros.push({
      nome_casa: '',
      id_oferta: '',
      id_link_oferta: '',
      external_id: '',
      irev_enabled: true
    });
    setConfig(newConfig);
  };

  const removeSubCadastro = (affId: string, index: number) => {
    const newConfig = { ...config };
    newConfig[affId].sub_cadastros.splice(index, 1);
    setConfig(newConfig);
  };

  const updateSubField = (affId: string, index: number, field: string, value: any) => {
    const newConfig = { ...config };
    (newConfig[affId].sub_cadastros[index] as any)[field] = value;
    setConfig(newConfig);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredAffiliates = Object.entries(config)
    .filter(([id, data]) => 
      data.nome.toLowerCase().includes(searchTerm.toLowerCase()) || id.includes(searchTerm)
    )
    .sort(([, a], [, b]) => a.nome.localeCompare(b.nome));

  if (loading) return <div className="p-8 text-white/40">Carregando configurações...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white/40 text-sm mb-2 hover:text-white transition-colors cursor-pointer" onClick={() => window.location.href = '/'}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-widest">Cadastro & Mapeamento IREV</h1>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest text-indigo-400">Backup & Gestão de Dados</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 px-1 rounded-2xl border border-white/5 shadow-2xl">
            <button 
              onClick={handleExport}
              title="Exportar backup JSON"
              className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-white/60 hover:text-indigo-400 rounded-xl text-[10px] font-bold uppercase transition-all"
            >
              <Download className="w-4 h-4" /> Exportar .JSON
            </button>
            <div className="w-px h-6 bg-white/10" />
            <label className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 text-white/60 hover:text-emerald-400 rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-all">
              <Upload className="w-4 h-4" /> Importar .JSON
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar Afiliado..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-6 py-3 glass rounded-2xl text-xs text-white outline-none w-72 border border-white/5 focus:border-indigo-500/50 transition-all shadow-xl"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredAffiliates.map(([id, data]) => (
          <div key={id} className="glass rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
            {/* Header (Clickable) */}
            <div 
              onClick={() => toggleExpand(id)}
              className={`p-5 px-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${expandedId === id ? 'bg-white/5 border-b border-white/5' : ''}`}
            >
              <div className="flex items-center gap-6">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">#{id}</div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">{data.nome}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] text-white/30 uppercase font-black bg-white/5 px-2 py-0.5 rounded tracking-widest">{data.sub_cadastros.length} MARCAS VINCULADAS</span>
                    {data.sub_cadastros.some(s => s.irev_enabled) && (
                      <span className="text-[8px] text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20"><ShieldCheck className="w-2.5 h-2.5" /> IREV Ativo</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSave(id, data); }}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all shadow-lg ${saving ? 'bg-white/10 text-white/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/10'}`}
                >
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <div className={`text-white/20 transform transition-transform duration-300 ${expandedId === id ? 'rotate-180' : ''}`}>
                  <Plus className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Content (Expandable) */}
            {expandedId === id && (
              <div className="p-6 bg-black/20 animate-in slide-in-from-top-4 duration-300 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.sub_cadastros.map((sub, idx) => (
                    <div key={idx} className="p-4 rounded-xl glass border border-white/10 space-y-4 relative group hover:border-indigo-500/30 transition-all">
                      <button 
                        onClick={() => removeSubCadastro(id, idx)}
                        className="absolute top-2 right-2 p-1.5 text-white/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-white/30 font-black tracking-widest">Marca (API)</label>
                          <input 
                            type="text" 
                            value={sub.nome_casa} 
                            onChange={(e) => updateSubField(id, idx, 'nome_casa', e.target.value)}
                            className="w-full bg-white/5 rounded-lg p-2.5 text-xs text-white outline-none border border-white/5 focus:border-indigo-500/50"
                            placeholder="Ex: Novibet"
                          />
                        </div>
                         <div className="space-y-1 text-center">
                          <label className="text-[9px] uppercase text-white/30 font-black tracking-widest">Sinc. IREV</label>
                          <button 
                            onClick={() => updateSubField(id, idx, 'irev_enabled', !sub.irev_enabled)}
                           className={`w-full flex items-center justify-center gap-2 rounded-lg p-2.5 text-[9px] uppercase font-black transition-all border ${sub.irev_enabled !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                          >
                            {sub.irev_enabled !== false ? 'ATIVO' : 'DESLIGADO'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-white/30 font-black tracking-widest">Offer ID</label>
                          <input 
                            type="text" 
                            value={sub.id_oferta} 
                            onChange={(e) => updateSubField(id, idx, 'id_oferta', e.target.value)}
                            className="w-full bg-white/5 rounded-lg p-2.5 text-xs text-white outline-none border border-white/5"
                            placeholder="ID"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase text-white/30 font-black tracking-widest">Link ID</label>
                          <input 
                            type="text" 
                            value={sub.id_link_oferta} 
                            onChange={(e) => updateSubField(id, idx, 'id_link_oferta', e.target.value)}
                            className="w-full bg-white/5 rounded-lg p-2.5 text-xs text-white outline-none border border-white/5"
                            placeholder="ID"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <label className="text-[9px] uppercase text-white/30 font-black tracking-widest flex items-center justify-between">
                          ID Manual / Identificador API
                          <span className="text-[8px] text-indigo-400 italic">Opcional</span>
                        </label>
                        <input 
                          type="text" 
                          value={sub.external_id || ''} 
                          onChange={(e) => updateSubField(id, idx, 'external_id', e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-lg p-2.5 text-xs text-indigo-200 outline-none focus:border-indigo-500/50"
                          placeholder="Ex: nobrebet62"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => addSubCadastro(id)}
                    className="p-4 rounded-xl border border-dashed border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5 flex flex-col items-center justify-center gap-2 group transition-all"
                  >
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 text-white/20 group-hover:text-indigo-400 transition-all border border-white/10"><Plus className="w-4 h-4" /></div>
                    <span className="text-[10px] uppercase font-black font-sans tracking-widest text-white/20 group-hover:text-indigo-400 transition-all">Nova Marca</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

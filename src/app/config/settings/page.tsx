'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, ShieldCheck, Key, Globe, Database, Cpu, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface SettingsData {
  settings: Record<string, string>;
  overrides: string[];
}

export default function ApiSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config/settings');
      const json = await res.json();
      setData(json);
      setEditedSettings(json.settings || {});
    } catch (err) {
      console.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filtrar apenas o que foi alterado em relação ao .env original (se quisermos ser minimalistas)
      // Ou salvar tudo o que está no estado como overrides.
      const res = await fetch('/api/config/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: editedSettings })
      });
      
      if (res.ok) {
        alert('Configurações atualizadas com sucesso! O sistema agora prioriza estes valores.');
        fetchSettings();
      } else {
        alert('Erro ao salvar configurações.');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleValue = (key: string) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateField = (key: string, value: string) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }));
  };

  const categories = [
    { 
      name: 'Smartico (Estrela, Multi, Casa)', 
      icon: <Database className="w-4 h-4" />, 
      keys: ['ESTRELABET_SMARTICO_API_KEY', 'ESTRELABET_SMARTICO_HOST', 'MULTIBET_SMARTICO_API_KEY', 'MULTIBET_SMARTICO_HOST', 'CASA_DE_APOSTA_SMARTICO_API_KEY', 'CASA_DE_APOSTA_SMARTICO_HOST'] 
    },
    { 
      name: 'NetRefer (MGM & Stake)', 
      icon: <ShieldCheck className="w-4 h-4" />, 
      keys: ['BETMGM_NETREFER_API_KEY', 'STAKE_NETREFER_API_KEY'] 
    },
    { 
      name: 'OddsScanner & Novibet', 
      icon: <Cpu className="w-4 h-4" />, 
      keys: ['ODDSSCANNER_API_KEY', 'NOVIBET_TOKEN', 'NOVIBET_DOMAIN'] 
    },
    { 
      name: 'Blaze & Sportingbet', 
      icon: <RefreshCw className="w-4 h-4" />, 
      keys: ['BLAZER_AFFILIATE_ID', 'BLAZER_API_KEY', 'SPORTINGBET_BEN_ID', 'SPORTINGBET_XML_KEY'] 
    },
    { 
      name: 'IREV (iRevenue)', 
      icon: <Database className="w-4 h-4" />, 
      keys: ['IREV_API_URL', 'IREV_API_KEY'] 
    },
    { 
      name: 'Infraestrutura', 
      icon: <Globe className="w-4 h-4" />, 
      keys: ['NEXT_PUBLIC_APP_URL', 'NODE_ENV'] 
    }
  ];

  if (loading) return <div className="p-8 text-white/40 flex items-center gap-3"><RefreshCw className="w-5 h-5 animate-spin" /> Carregando chaves de API...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-white/40 text-[10px] mb-2 hover:text-white transition-colors cursor-pointer uppercase font-black tracking-widest" onClick={() => window.history.back()}>
            <ArrowLeft className="w-3 h-3" /> Voltar
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            Gestão de <span className="text-indigo-500">APIs</span> & Segurança
          </h1>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em] flex items-center gap-2">
            Controle de chaves temporárias e overrides de produção
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className={`group flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black uppercase transition-all shadow-2xl ${saving ? 'bg-white/5 text-white/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'}`}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
          {saving ? 'Salvando...' : 'Aplicar Alterações'}
        </button>
      </div>

      {/* Info Alert */}
      <div className="p-4 px-6 glass rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-white uppercase tracking-tight">Persistência Garantida</p>
          <p className="text-xs text-indigo-200/60 leading-relaxed">
            As chaves salvas aqui são armazenadas de forma persistente e têm prioridade sobre o arquivo <code>.env</code>. 
            Diferente do <code>.env</code>, alterações aqui <strong className="text-indigo-400">não reiniciam</strong> o servidor em produção.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {categories.map((cat, idx) => (
          <div key={idx} className="glass rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 px-8 border-b border-white/5 bg-white/5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                {cat.icon}
              </div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">{cat.name}</h2>
            </div>
            
            <div className="p-8 space-y-6 flex-1">
              {cat.keys.map(key => (
                <div key={key} className="space-y-2 group">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase text-white/40 font-black tracking-widest flex items-center gap-2 group-focus-within:text-indigo-400 transition-colors">
                      {key}
                      {data?.overrides.includes(key) && (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded italic">Substituído</span>
                      )}
                    </label>
                    <button 
                      onClick={() => toggleValue(key)}
                      className="p-1 px-2 hover:bg-white/5 rounded text-[10px] text-white/20 hover:text-white transition-all uppercase font-bold flex items-center gap-1"
                    >
                      {showValues[key] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showValues[key] ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input 
                      type={showValues[key] ? "text" : "password"}
                      value={editedSettings[key] || ''}
                      onChange={(e) => updateField(key, e.target.value)}
                      className="w-full bg-white/5 rounded-2xl p-4 text-xs text-indigo-100 outline-none border border-white/10 focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all font-mono"
                      placeholder={`Valor de ${key.toLowerCase()}...`}
                    />
                    <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/5 group-focus-within:text-indigo-500/20" />
                  </div>
                </div>
              ))}
              
              {cat.keys.length === 0 && <div className="text-white/20 text-[10px] uppercase font-bold py-4">Nenhuma chave detectada nesta categoria.</div>}
            </div>
          </div>
        ))}
        
        {/* Outras chaves não categorizadas */}
        <div className="glass rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-2xl lg:col-span-2">
            <div className="p-6 px-8 border-b border-white/5 bg-white/5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Globe className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Outras Configurações Detectadas</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(editedSettings)
                    .filter(key => !categories.some(c => c.keys.includes(key)))
                    .map(key => (
                        <div key={key} className="space-y-2 group">
                            <label className="text-[10px] uppercase text-white/40 font-black tracking-widest flex items-center gap-2 group-focus-within:text-indigo-400 transition-colors">
                            {key}
                            </label>
                            <input 
                            type="text"
                            value={editedSettings[key] || ''}
                            onChange={(e) => updateField(key, e.target.value)}
                            className="w-full bg-white/5 rounded-2xl p-4 text-xs text-indigo-100 outline-none border border-white/10 focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all font-mono"
                            />
                        </div>
                    ))
                }
            </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="pt-12 pb-8 flex flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-0.5">
          <div className="h-full w-full rounded-[14px] bg-black flex items-center justify-center text-indigo-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">IREV Security Manager</p>
          <p className="text-[8px] text-white/20 uppercase tracking-widest mt-1">v1.2.0 • 2026 Production Ready</p>
        </div>
      </div>
    </div>
  );
}

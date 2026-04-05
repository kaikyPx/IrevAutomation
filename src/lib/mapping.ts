import fs from 'fs';
import path from 'path';

export interface AffiliateMapping {
  nome: string;
  sub_cadastros: {
    nome_casa: string;
    id_oferta: string;
    id_link_oferta: string;
    external_id?: string; // ID manual (ex: nobrebet62)
    irev_enabled?: boolean; // Se deve ser enviado ao IREV
  }[];
}

const CONFIG_PATH = path.join(process.cwd(), 'src/data/affiliates.json');

export function getAffiliatesConfig(): Record<string, AffiliateMapping> {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler affiliates.json:', error);
    return {};
  }
}

export function saveAffiliatesConfig(config: Record<string, AffiliateMapping>) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Identifica o afiliado e as IDs do IREV baseado no nome da fonte e na marca.
 * Suporta match automático por #ID e match manual por external_id.
 */
export function identifyAffiliate(sourceName: string, brand: string) {
  const config = getAffiliatesConfig();
  
  /**
   * Helper to normalize brand names for fuzzy matching.
   * "Esporte da Sorte" -> "esportedasorte"
   */
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const isBrandMatch = (configBrand: string, apiBrand: string) => {
    const cb = normalize(configBrand);
    const ab = normalize(apiBrand);
    
    // 1. Match direto ou inclusão (ex: "BetMGM" e "BetMGM Brazil")
    if (cb === ab || ab.includes(cb) || cb.includes(ab)) return true;

    // 2. Match agressivo removendo sufixos comuns (ex: "Cassino.bet" e "Cassino - BR")
    const strip = (s: string) => normalize(s)
      .replace(/(bet|br|brasil|brazil|gaming|sports|casas|app)$/, '');
    
    const cbs = strip(configBrand);
    const abs = strip(apiBrand);

    if (cbs === '' || abs === '') return false;
    return cbs === abs || abs.includes(cbs) || cbs.includes(abs);
  };

  // 1. Tentar Match Manual primeiro (ex: Novibet mapping)
  const normalizedSource = sourceName.trim().toLowerCase();
  
  for (const [affiliateId, data] of Object.entries(config)) {
    const sub = data.sub_cadastros.find(s => {
      if (!isBrandMatch(s.nome_casa, brand)) return false;
      if (!s.external_id) return false;
      
      // Comparação case-insensitive e sem espaços extras
      return s.external_id.trim().toLowerCase() === normalizedSource;
    });
    
    if (sub) {
      return { 
        affiliateId, 
        affiliateName: data.nome,
        mapping: { ...sub, irev_enabled: sub.irev_enabled !== false },
        method: 'manual' 
      };
    }
  }

  // 2. Tentar Match Automático por #ID (ex: "Pedro Ivan #90")
  const idMatch = sourceName.match(/#(\d+)/);
  if (idMatch) {
    const extractedId = idMatch[1];
    const data = config[extractedId];
    if (data) {
      const sub = data.sub_cadastros.find(s => isBrandMatch(s.nome_casa, brand));
      return { 
        affiliateId: extractedId, 
        affiliateName: data.nome,
        mapping: sub ? { ...sub, irev_enabled: sub.irev_enabled !== false } : null,
        method: 'auto-id' 
      };
    }
  }

  // 3. Tentar Match Automático por número no final (ex: "pedroivan90")
  const trailingIdMatch = sourceName.match(/(\d+)$/);
  if (trailingIdMatch) {
    const extractedId = trailingIdMatch[1];
    const data = config[extractedId];
    if (data) {
      const sub = data.sub_cadastros.find(s => isBrandMatch(s.nome_casa, brand));
      return { 
        affiliateId: extractedId, 
        affiliateName: data.nome,
        mapping: sub ? { ...sub, irev_enabled: sub.irev_enabled !== false } : null,
        method: 'auto-trailing-id' 
      };
    }
  }

  // 4. Ignorar se não houver match numérico ou manual
  return null;
}

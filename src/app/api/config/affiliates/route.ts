import { NextResponse } from 'next/server';
import { getAffiliatesConfig, saveAffiliatesConfig } from '@/lib/mapping';

// GET: Retornar todos os afiliados e mapeamentos
export async function GET() {
  const config = getAffiliatesConfig();
  return NextResponse.json({ config });
}

// POST: Criar ou editar um afiliado ou seu mapeamento (Individual)
export async function POST(request: Request) {
  try {
    const { affiliateId, data } = await request.json();
    
    if (!affiliateId || !data) {
      return NextResponse.json({ error: 'Faltando ID do afiliado ou dados' }, { status: 400 });
    }

    const config = getAffiliatesConfig();
    config[affiliateId] = data; 
    
    saveAffiliatesConfig(config);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Importação com Deep Merge (Sincronização Aditiva)
export async function PUT(request: Request) {
  try {
    const { data: newData } = await request.json();
    
    if (!newData || typeof newData !== 'object') {
      return NextResponse.json({ error: 'Faltando dados de configuração' }, { status: 400 });
    }

    const config = getAffiliatesConfig();

    // Loop pelos novos dados para mesclar no que já existe
    for (const [id, newAff] of Object.entries(newData as any)) {
      if (!config[id]) {
        // Se não existe, cria do zero
        config[id] = newAff as any;
      } else {
        // Se já existe, mescla os dados
        const currentAff = config[id];
        currentAff.nome = (newAff as any).nome || currentAff.nome;

        const newSubs = (newAff as any).sub_cadastros || [];
        newSubs.forEach((newSub: any) => {
          const currentIndex = currentAff.sub_cadastros.findIndex(s => s.nome_casa === newSub.nome_casa);
          
          if (currentIndex === -1) {
            // Nova casa para esse afiliado
            currentAff.sub_cadastros.push(newSub);
          } else {
            // Casa já existe, vamos atualizar apenas o que veio
            const currentSub = currentAff.sub_cadastros[currentIndex];
            currentSub.id_oferta = newSub.id_oferta || currentSub.id_oferta;
            currentSub.id_link_oferta = newSub.id_link_oferta || currentSub.id_link_oferta;
            
            // Regra de OURO: não apagar external_id se o novo vier vazio
            if (newSub.external_id) {
              currentSub.external_id = newSub.external_id;
            }
            
            // Manter flag de irev_enabled se vier no json, senão manter o atual
            if (newSub.irev_enabled !== undefined) {
              currentSub.irev_enabled = newSub.irev_enabled;
            }
          }
        });
      }
    }

    saveAffiliatesConfig(config);
    return NextResponse.json({ success: true, message: 'Configuração mesclada com sucesso (Merge Aditivo).' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { loadSettings, saveSettings } from '@/lib/settings';
import fs from 'fs';
import path from 'path';

/**
 * GET: Retorna as configurações atuais.
 * Mescla o que está no .env com o que está no settings.json (prioritário).
 */
export async function GET() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const dotEnvContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    // Extrai chaves do .env simplificadamente
    const envKeys: Record<string, string> = {};
    dotEnvContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...parts] = trimmed.split('=');
        if (key) envKeys[key.trim()] = parts.join('=').trim();
      }
    });

    const overrides = loadSettings();
    
    // Mesclar: overrides tem prioridade visual no dashboard
    const allSettings = { ...envKeys, ...overrides };

    return NextResponse.json({ 
      settings: allSettings,
      overrides: Object.keys(overrides)
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar configurações' }, { status: 500 });
  }
}

/**
 * POST: Salva novas configurações.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const success = saveSettings(settings);

    if (success) {
      return NextResponse.json({ message: 'Configurações salvas com sucesso' });
    } else {
      return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}

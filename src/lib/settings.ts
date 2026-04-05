import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'src/data/settings.json');

/**
 * Carrega as configurações do arquivo JSON.
 * Se o arquivo não existir, retorna um objeto vazio.
 */
export function loadSettings(): Record<string, string> {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      return {};
    }
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    return {};
  }
}

/**
 * Retorna uma configuração específica.
 * Prioriza o arquivo JSON (overrides) e depois o process.env.
 */
export function getSetting(key: string, defaultValue?: string): string {
  const settings = loadSettings();
  const value = settings[key] || process.env[key] || defaultValue || '';
  return value;
}

/**
 * Atualiza e salva as configurações no arquivo JSON.
 */
export function saveSettings(newSettings: Record<string, string>): boolean {
  try {
    const currentSettings = loadSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    // Garantir que o diretório existe
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return false;
  }
}

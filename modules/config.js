const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'config.json');
const VALID_BAUD_RATES = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];

const DEFAULT_CONFIG = {
  alturaMaxima: 25,
  capacidade: 10,
  porta: 'COM3',
  baudRate: 9600,
  alertaBaixo: 20,
  alertaAlto: 90,
  somAtivado: true,
};

function loadConfig() {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

// Valida os campos enviados contra o estado mesclado com a config atual.
// Retorna { ok: boolean, errors: string[] }.
function validateConfig(data) {
  const merged = { ...config, ...data };
  const errors = [];

  const capacidade = Number(merged.capacidade);
  if (isNaN(capacidade) || capacidade <= 0)
    errors.push('capacidade deve ser maior que 0');

  const alturaMaxima = Number(merged.alturaMaxima);
  if (isNaN(alturaMaxima) || alturaMaxima <= 0)
    errors.push('alturaMaxima deve ser maior que 0');

  const baixo = Number(merged.alertaBaixo);
  const alto = Number(merged.alertaAlto);

  if (isNaN(baixo) || baixo < 0 || baixo > 100)
    errors.push('alertaBaixo deve estar entre 0 e 100');
  else if (isNaN(alto) || alto < 0 || alto > 100)
    errors.push('alertaAlto deve estar entre 0 e 100');
  else if (baixo >= alto)
    errors.push('alertaBaixo deve ser menor que alertaAlto');

  if (!VALID_BAUD_RATES.includes(Number(merged.baudRate)))
    errors.push(`baudRate inválido — valores aceitos: ${VALID_BAUD_RATES.join(', ')}`);

  if (typeof merged.porta !== 'string' || merged.porta.trim() === '')
    errors.push('porta deve ser uma string não vazia');

  return { ok: errors.length === 0, errors };
}

const config = loadConfig();

module.exports = { config, saveConfig, validateConfig };

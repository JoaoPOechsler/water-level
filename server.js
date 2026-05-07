const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Config persistente ────────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, 'config.json');

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

let config = loadConfig();

// ─── API de configuração ───────────────────────────────────────────────
app.get('/api/config', (req, res) => res.json(config));

app.post('/api/config', (req, res) => {
  const portaMudou = req.body.porta !== config.porta || req.body.baudRate !== config.baudRate;
  config = { ...config, ...req.body };
  saveConfig(config);
  broadcast({ type: 'config', config });
  res.json({ ok: true, config });
  if (portaMudou) initSerial();
});

// ─── Histórico em memória (últimas 2000 leituras) ─────────────────────
const historico = [];
const MAX_HIST = 2000;

function addHistorico(ponto) {
  historico.push(ponto);
  if (historico.length > MAX_HIST) historico.shift();
}

app.get('/api/historico', (req, res) => res.json(historico));

// ─── Log de eventos ────────────────────────────────────────────────────
const eventos = [];
const MAX_EVENTOS = 100;
let ultimoEstado = null;

function addEvento(tipo, mensagem, nivelPercentual) {
  const ev = { tipo, mensagem, nivelPercentual, timestamp: new Date().toISOString() };
  eventos.push(ev);
  if (eventos.length > MAX_EVENTOS) eventos.shift();
  broadcast({ type: 'evento', evento: ev });
}

function checarAlertas(nivelPercentual) {
  let estado = 'normal';
  if (nivelPercentual <= config.alertaBaixo) estado = 'baixo';
  else if (nivelPercentual >= config.alertaAlto) estado = 'alto';

  if (estado !== ultimoEstado) {
    if (estado === 'baixo') {
      addEvento('critico', `Nível crítico: ${nivelPercentual.toFixed(1)}% (abaixo de ${config.alertaBaixo}%)`, nivelPercentual);
    } else if (estado === 'alto') {
      addEvento('cheio', `Caixa cheia: ${nivelPercentual.toFixed(1)}% (acima de ${config.alertaAlto}%)`, nivelPercentual);
    } else if (ultimoEstado === 'baixo') {
      addEvento('info', `Nível normalizado: ${nivelPercentual.toFixed(1)}%`, nivelPercentual);
    } else if (ultimoEstado === 'alto') {
      addEvento('info', `Nível abaixo do máximo: ${nivelPercentual.toFixed(1)}%`, nivelPercentual);
    }
    ultimoEstado = estado;
  }
}

app.get('/api/eventos', (req, res) => res.json(eventos));

// ─── Exportar CSV ──────────────────────────────────────────────────────
app.get('/api/exportar', (req, res) => {
  const filtro = req.query.periodo;
  const agora = Date.now();
  const limites = { '1h': 3600000, '24h': 86400000, '7d': 604800000 };
  const limite = limites[filtro] || Infinity;

  const dados = historico.filter(p => agora - new Date(p.timestamp).getTime() <= limite);

  let csv = 'timestamp,distancia_cm,nivel_percentual,nivel_litros,caixa\n';
  dados.forEach(p => {
    csv += `${p.timestamp},${p.distancia},${p.nivelPercentual},${p.nivelLitros},${p.caixa}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=waterlevel_${filtro || 'tudo'}_${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
});

// ─── Lógica de conversão ───────────────────────────────────────────────
function converterLeitura(distancia) {
  const { alturaMaxima, capacidade } = config;
  const nivelPercentual = Math.max(0, Math.min(100, 100 - (distancia / alturaMaxima * 100)));
  const nivelLitros = parseFloat(((nivelPercentual / 100) * capacidade).toFixed(2));
  return { nivelPercentual: parseFloat(nivelPercentual.toFixed(1)), nivelLitros };
}

// ─── Serial + Simulação ───────────────────────────────────────────────
let serialPort = null;
let simulacaoTimer = null;
let simDistancia = 12;
let simDirecao = 1;

function emitirLeitura(distancia) {
  const { nivelPercentual, nivelLitros } = converterLeitura(distancia);
  const timestamp = new Date().toISOString();
  const payload = { type: 'leitura', timestamp, distancia, nivelPercentual, nivelLitros, caixa: 1 };
  addHistorico(payload);
  checarAlertas(nivelPercentual);
  broadcast(payload);
}

function startSimulacao() {
  if (simulacaoTimer) return;
  console.log('🎭 Modo simulação ativado (Arduino não encontrado)');
  broadcast({ type: 'status', conectado: true, porta: 'SIMULAÇÃO', simulando: true });

  simulacaoTimer = setInterval(() => {
    simDistancia += simDirecao * (Math.random() * 0.4 + 0.1);
    if (simDistancia >= 23) simDirecao = -1;
    if (simDistancia <= 2) simDirecao = 1;
    emitirLeitura(parseFloat(simDistancia.toFixed(2)));
  }, 1500);
}

function stopSimulacao() {
  if (simulacaoTimer) {
    clearInterval(simulacaoTimer);
    simulacaoTimer = null;
  }
}

function initSerial() {
  stopSimulacao();
  if (serialPort && serialPort.isOpen) serialPort.close();

  try {
    serialPort = new SerialPort({
      path: config.porta,
      baudRate: config.baudRate,
      autoOpen: true,
    });

    const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    serialPort.on('open', () => {
      console.log(`✅ Serial conectada: ${config.porta} @ ${config.baudRate} baud`);
      stopSimulacao();
      broadcast({ type: 'status', conectado: true, porta: config.porta, simulando: false });
      addEvento('info', `Arduino conectado em ${config.porta}`, 0);
    });

    serialPort.on('error', (err) => {
      console.error('❌ Erro serial:', err.message);
      broadcast({ type: 'status', conectado: false, erro: err.message });
      startSimulacao();
    });

    parser.on('data', (raw) => {
      const distancia = parseFloat(raw.trim());
      if (isNaN(distancia)) return;
      emitirLeitura(distancia);
    });
  } catch (err) {
    console.error('❌ Não foi possível abrir a serial:', err.message);
    startSimulacao();
  }
}

// ─── HTTP + WebSocket ─────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

wss.on('connection', (ws) => {
  console.log('🌐 Cliente conectado ao WebSocket');
  ws.send(JSON.stringify({ type: 'config', config }));
  ws.send(JSON.stringify({ type: 'historico', dados: historico }));
  ws.send(JSON.stringify({ type: 'eventos', dados: eventos }));
  ws.send(JSON.stringify({
    type: 'status',
    conectado: serialPort ? serialPort.isOpen : false,
    porta: config.porta,
  }));
});

// ─── Inicia ───────────────────────────────────────────────────────────
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 WaterLevel rodando em http://localhost:${PORT}`);
  initSerial();
});

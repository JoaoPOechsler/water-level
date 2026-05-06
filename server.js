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

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return { alturaMaxima: 25, capacidade: 10, porta: 'COM3', baudRate: 9600 };
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

let config = loadConfig();

// ─── API de configuração ───────────────────────────────────────────────
app.get('/api/config', (req, res) => res.json(config));

app.post('/api/config', (req, res) => {
  config = { ...config, ...req.body };
  saveConfig(config);
  res.json({ ok: true, config });
  // reinicia a serial se a porta/baud mudou
  initSerial();
});

// ─── Histórico em memória (últimas 200 leituras) ───────────────────────
const historico = [];
const MAX_HIST = 200;

function addHistorico(ponto) {
  historico.push(ponto);
  if (historico.length > MAX_HIST) historico.shift();
}

app.get('/api/historico', (req, res) => res.json(historico));

// ─── Lógica de conversão (equivalente ao function node do Node-RED) ────
function converterLeitura(distancia) {
  const { alturaMaxima, capacidade } = config;
  const nivelPercentual = Math.max(0, Math.min(100, 100 - (distancia / alturaMaxima * 100)));
  const nivelLitros = parseFloat(((nivelPercentual / 100) * capacidade).toFixed(2));
  return { nivelPercentual: parseFloat(nivelPercentual.toFixed(1)), nivelLitros };
}

// ─── Serial ───────────────────────────────────────────────────────────
let serialPort = null;
let simulacaoTimer = null;
let simDistancia = 12; // começa na metade
let simDirecao = 1;

function emitirLeitura(distancia) {
  const { nivelPercentual, nivelLitros } = converterLeitura(distancia);
  const timestamp = new Date().toISOString();
  const payload = { type: 'leitura', timestamp, distancia, nivelPercentual, nivelLitros, caixa: 1 };
  addHistorico(payload);
  broadcast(payload);
  console.log(`📊 dist=${distancia.toFixed(1)}cm | ${nivelPercentual}% | ${nivelLitros}L`);
}

function startSimulacao() {
  if (simulacaoTimer) return;
  console.log('🎭 Modo simulação ativado (Arduino não encontrado)');
  broadcast({ type: 'status', conectado: true, porta: 'SIMULAÇÃO', simulando: true });

  simulacaoTimer = setInterval(() => {
    // oscila suavemente entre ~2cm e ~23cm
    simDistancia += simDirecao * (Math.random() * 0.4 + 0.1);
    if (simDistancia >= 23) simDirecao = -1;
    if (simDistancia <= 2)  simDirecao =  1;
    emitirLeitura(parseFloat(simDistancia.toFixed(2)));
  }, 1500);
}

function stopSimulacao() {
  if (simulacaoTimer) {
    clearInterval(simulacaoTimer);
    simulacaoTimer = null;
    console.log('🎭 Simulação encerrada');
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
  // envia config e histórico imediatamente
  ws.send(JSON.stringify({ type: 'config', config }));
  ws.send(JSON.stringify({ type: 'historico', dados: historico }));
  ws.send(JSON.stringify({
    type: 'status',
    conectado: serialPort ? serialPort.isOpen : false,
    porta: config.porta,
  }));
});

// ─── Inicia ───────────────────────────────────────────────────────────
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  initSerial();
});

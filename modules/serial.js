const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const { broadcast } = require('./broadcast');
const { converterLeitura } = require('./converter');
const { addHistorico, addEvento, checarAlertas } = require('./historico');

let serialPort = null;
let simulacaoTimer = null;
let simDistancia = 12;
let simDirecao = 1;

function emitirLeitura(distancia, config) {
  const { nivelPercentual, nivelLitros } = converterLeitura(distancia, config);
  const timestamp = new Date().toISOString();
  const payload = { type: 'leitura', timestamp, distancia, nivelPercentual, nivelLitros, caixa: 1 };
  addHistorico(payload);
  checarAlertas(nivelPercentual, config);
  broadcast(payload);
}

function startSimulacao(config) {
  if (simulacaoTimer) return;
  console.log('🎭 Modo simulação ativado (Arduino não encontrado)');
  broadcast({ type: 'status', conectado: true, porta: 'SIMULAÇÃO', simulando: true });

  simulacaoTimer = setInterval(() => {
    simDistancia += simDirecao * (Math.random() * 0.4 + 0.1);
    if (simDistancia >= 23) simDirecao = -1;
    if (simDistancia <= 2) simDirecao = 1;
    // config é o objeto compartilhado — mutações em Object.assign são visíveis aqui
    emitirLeitura(parseFloat(simDistancia.toFixed(2)), config);
  }, 1500);
}

function stopSimulacao() {
  if (simulacaoTimer) {
    clearInterval(simulacaoTimer);
    simulacaoTimer = null;
  }
}

function initSerial(config) {
  stopSimulacao();
  if (serialPort && serialPort.isOpen) serialPort.close();

  try {
    serialPort = new SerialPort({ path: config.porta, baudRate: config.baudRate, autoOpen: true });

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
      startSimulacao(config);
    });

    parser.on('data', (raw) => {
      const distancia = parseFloat(raw.trim());
      if (isNaN(distancia)) return;
      emitirLeitura(distancia, config);
    });
  } catch (err) {
    console.error('❌ Não foi possível abrir a serial:', err.message);
    startSimulacao(config);
  }
}

function isConnected() {
  return serialPort ? serialPort.isOpen : false;
}

module.exports = { initSerial, stopSimulacao, isConnected };

const { broadcast } = require('./broadcast');

const historico = [];
const MAX_HIST = 2000;

const eventos = [];
const MAX_EVENTOS = 100;

let ultimoEstado = null;

function addHistorico(ponto) {
  historico.push(ponto);
  if (historico.length > MAX_HIST) historico.shift();
}

function addEvento(tipo, mensagem, nivelPercentual) {
  const ev = { tipo, mensagem, nivelPercentual, timestamp: new Date().toISOString() };
  eventos.push(ev);
  if (eventos.length > MAX_EVENTOS) eventos.shift();
  broadcast({ type: 'evento', evento: ev });
}

function checarAlertas(nivelPercentual, config) {
  let estado = 'normal';
  if (nivelPercentual <= config.alertaBaixo) estado = 'baixo';
  else if (nivelPercentual >= config.alertaAlto) estado = 'alto';

  if (estado === ultimoEstado) return;

  if (estado === 'baixo')
    addEvento('critico', `Nível crítico: ${nivelPercentual.toFixed(1)}% (abaixo de ${config.alertaBaixo}%)`, nivelPercentual);
  else if (estado === 'alto')
    addEvento('cheio', `Caixa cheia: ${nivelPercentual.toFixed(1)}% (acima de ${config.alertaAlto}%)`, nivelPercentual);
  else if (ultimoEstado === 'baixo')
    addEvento('info', `Nível normalizado: ${nivelPercentual.toFixed(1)}%`, nivelPercentual);
  else if (ultimoEstado === 'alto')
    addEvento('info', `Nível abaixo do máximo: ${nivelPercentual.toFixed(1)}%`, nivelPercentual);

  ultimoEstado = estado;
}

module.exports = { historico, eventos, addHistorico, addEvento, checarAlertas };

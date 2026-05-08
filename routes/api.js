const express = require('express');
const router = express.Router();

const { config, saveConfig, validateConfig } = require('../modules/config');
const { historico, eventos } = require('../modules/historico');
const { broadcast } = require('../modules/broadcast');
const { initSerial } = require('../modules/serial');

router.get('/config', (req, res) => res.json(config));

router.post('/config', (req, res) => {
  const validation = validateConfig(req.body);
  if (!validation.ok) {
    return res.status(400).json({ ok: false, errors: validation.errors });
  }

  const portaMudou =
    (req.body.porta !== undefined && req.body.porta !== config.porta) ||
    (req.body.baudRate !== undefined && Number(req.body.baudRate) !== config.baudRate);

  Object.assign(config, req.body);
  saveConfig(config);
  broadcast({ type: 'config', config });
  res.json({ ok: true, config });

  if (portaMudou) initSerial(config);
});

router.get('/historico', (req, res) => res.json(historico));

router.get('/eventos', (req, res) => res.json(eventos));

router.get('/exportar', (req, res) => {
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

module.exports = router;

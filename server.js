const http = require('http');
const path = require('path');
const express = require('express');
const WebSocket = require('ws');

const broadcaster = require('./modules/broadcast');
const { config } = require('./modules/config');
const { historico, eventos } = require('./modules/historico');
const { initSerial, isConnected } = require('./modules/serial');
const apiRoutes = require('./routes/api');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRoutes);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

broadcaster.init(wss);

wss.on('connection', (ws) => {
  console.log('🌐 Cliente conectado ao WebSocket');
  ws.send(JSON.stringify({ type: 'config', config }));
  ws.send(JSON.stringify({ type: 'historico', dados: historico }));
  ws.send(JSON.stringify({ type: 'eventos', dados: eventos }));
  ws.send(JSON.stringify({ type: 'status', conectado: isConnected(), porta: config.porta }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 WaterLevel rodando em http://localhost:${PORT}`);
  initSerial(config);
});

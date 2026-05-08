const WebSocket = require('ws');

let _wss = null;

function init(wss) {
  _wss = wss;
}

function broadcast(data) {
  if (!_wss) return;
  const msg = JSON.stringify(data);
  _wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

module.exports = { init, broadcast };

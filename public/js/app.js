/* ── Navegação ──────────────────────────────────────────────── */
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.dataset.page;
    navLinks.forEach(l => l.classList.remove('active'));
    pages.forEach(p => p.classList.remove('active'));
    link.classList.add('active');
    document.getElementById(`page-${target}`).classList.add('active');
  });
});

/* ── Config ─────────────────────────────────────────────────── */
let config = { alturaMaxima: 25, capacidade: 10, porta: 'COM3', baudRate: 9600, alertaBaixo: 20, alertaAlto: 90, somAtivado: true };

function applyConfig(cfg) {
  config = { ...config, ...cfg };
  document.getElementById('cfg-capacidade').value = config.capacidade;
  document.getElementById('cfg-altura').value = config.alturaMaxima;
  document.getElementById('cfg-porta').value = config.porta;
  document.getElementById('cfg-baud').value = config.baudRate;
  document.getElementById('cfg-alerta-baixo').value = config.alertaBaixo;
  document.getElementById('cfg-alerta-alto').value = config.alertaAlto;
  document.getElementById('cfg-som').checked = config.somAtivado;
  document.getElementById('val-cap').textContent = config.capacidade;
}

document.getElementById('btn-salvar').addEventListener('click', async () => {
  const payload = {
    capacidade: parseFloat(document.getElementById('cfg-capacidade').value),
    alturaMaxima: parseFloat(document.getElementById('cfg-altura').value),
    porta: document.getElementById('cfg-porta').value.trim(),
    baudRate: parseInt(document.getElementById('cfg-baud').value),
    alertaBaixo: parseFloat(document.getElementById('cfg-alerta-baixo').value),
    alertaAlto: parseFloat(document.getElementById('cfg-alerta-alto').value),
    somAtivado: document.getElementById('cfg-som').checked,
  };

  try {
    const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    applyConfig(data.config);
    const msg = document.getElementById('save-msg');
    msg.textContent = '✓ Salvo com sucesso!';
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 2500);
  } catch (err) {
    console.error('Erro ao salvar:', err);
  }
});

/* ── Advanced toggle ────────────────────────────────────────── */
document.getElementById('advanced-toggle').addEventListener('click', () => {
  const content = document.getElementById('advanced-content');
  const arrow = document.getElementById('advanced-arrow');
  content.classList.toggle('open');
  arrow.classList.toggle('open');
});

/* ── Som de alerta ──────────────────────────────────────────── */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playAlertSound(tipo) {
  if (!config.somAtivado) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (tipo === 'critico') {
    osc.frequency.value = 800;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
    // segundo beep
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 600;
      osc2.type = 'square';
      gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 200);
  } else if (tipo === 'cheio') {
    osc.frequency.value = 523;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 659;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.5);
    }, 150);
  }
}

/* ── Chart.js ───────────────────────────────────────────────── */
const allData = []; // store all data points for filtering
let activeRange = '5m';

const chartCtx = document.getElementById('chart-nivel').getContext('2d');
const chart = new Chart(chartCtx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Litros',
        data: [],
        borderColor: '#4a9eff',
        backgroundColor: 'rgba(74,158,255,0.08)',
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: '#4a9eff',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: '%',
        data: [],
        borderColor: '#2ed8b6',
        backgroundColor: 'rgba(46,216,182,0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.4,
        yAxisID: 'y2',
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: '#8890a6', font: { size: 11 }, boxWidth: 12 }
      },
      tooltip: {
        backgroundColor: '#1a1d27',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#e8eaf0',
        bodyColor: '#8890a6',
      }
    },
    scales: {
      x: {
        ticks: { color: '#8890a6', font: { size: 10 }, maxTicksLimit: 8 },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        position: 'left',
        title: { display: true, text: 'Litros', color: '#4a9eff', font: { size: 11 } },
        ticks: { color: '#4a9eff', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
        min: 0,
      },
      y2: {
        position: 'right',
        title: { display: true, text: '%', color: '#2ed8b6', font: { size: 11 } },
        ticks: { color: '#2ed8b6', font: { size: 10 } },
        grid: { drawOnChartArea: false },
        min: 0, max: 100,
      }
    }
  }
});

function getFilterMs(range) {
  const map = { '5m': 5 * 60000, '1h': 3600000, '24h': 86400000, 'tudo': Infinity };
  return map[range] || 5 * 60000;
}

function refreshChart() {
  const agora = Date.now();
  const limite = getFilterMs(activeRange);
  const filtrado = allData.filter(p => agora - new Date(p.timestamp).getTime() <= limite);

  chart.data.labels = filtrado.map(p => new Date(p.timestamp).toLocaleTimeString('pt-BR'));
  chart.data.datasets[0].data = filtrado.map(p => p.nivelLitros);
  chart.data.datasets[1].data = filtrado.map(p => p.nivelPercentual);
  chart.update('none');
}

function addPonto(ponto) {
  allData.push(ponto);
  // limit memory to 5000 points
  if (allData.length > 5000) allData.shift();
  refreshChart();
  document.getElementById('export-count').textContent = allData.length;
}

// Filter buttons
document.querySelectorAll('.btn-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeRange = btn.dataset.range;
    refreshChart();
  });
});

document.getElementById('btn-clear').addEventListener('click', () => {
  allData.length = 0;
  refreshChart();
  document.getElementById('export-count').textContent = '0';
});

/* ── Events log ─────────────────────────────────────────────── */
let eventCount = 0;

function addEventoUI(ev) {
  const list = document.getElementById('events-list');
  const empty = list.querySelector('.events-empty');
  if (empty) empty.remove();

  const icons = { critico: '🔴', cheio: '🟢', info: 'ℹ️' };
  const time = new Date(ev.timestamp).toLocaleTimeString('pt-BR');
  const date = new Date(ev.timestamp).toLocaleDateString('pt-BR');

  const item = document.createElement('div');
  item.className = 'event-item';
  item.innerHTML = `
    <div class="event-icon ${ev.tipo}">${icons[ev.tipo] || 'ℹ️'}</div>
    <div class="event-body">
      <div class="event-msg">${ev.mensagem}</div>
      <div class="event-time">${date} às ${time}</div>
    </div>
  `;

  list.insertBefore(item, list.firstChild);

  // keep max 50 items in DOM
  while (list.children.length > 50) list.removeChild(list.lastChild);

  eventCount++;
  document.getElementById('events-count').textContent = eventCount;

  // play sound
  if (ev.tipo === 'critico' || ev.tipo === 'cheio') {
    playAlertSound(ev.tipo);
  }
}

/* ── UI: métricas e tanque ──────────────────────────────────── */
function updateUI(ponto) {
  document.getElementById('val-litros').textContent = ponto.nivelLitros.toFixed(2);
  document.getElementById('val-percent').textContent = ponto.nivelPercentual.toFixed(1);
  document.getElementById('val-dist').textContent = ponto.distancia.toFixed(1);

  const pct = ponto.nivelPercentual;
  const fill = document.getElementById('tank-fill');
  const label = document.getElementById('tank-label');
  const alertEl = document.getElementById('alert-badge');

  fill.style.height = Math.max(0, Math.min(100, pct)) + '%';
  label.textContent = pct.toFixed(0) + '%';

  fill.className = 'tank-fill';
  if (pct <= config.alertaBaixo) fill.classList.add('low');
  else if (pct < 50) fill.classList.add('mid');
  else if (pct < config.alertaAlto) fill.classList.add('high');
  else fill.classList.add('full');

  alertEl.style.display = pct <= config.alertaBaixo ? 'block' : 'none';

  addPonto(ponto);
}

/* ── Status ─────────────────────────────────────────────────── */
function setStatus(conectado, porta, simulando) {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (conectado && simulando) {
    dot.className = 'status-dot simulating';
    text.innerHTML = '🎭 Simulação ativa';
  } else if (conectado) {
    dot.className = 'status-dot connected';
    text.textContent = `Conectado (${porta || ''})`;
  } else {
    dot.className = 'status-dot disconnected';
    text.textContent = 'Desconectado';
  }
}

/* ── WebSocket ──────────────────────────────────────────────── */
function connectWS() {
  const ws = new WebSocket(`ws://${location.host}`);

  ws.onopen = () => console.log('WS conectado');

  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    switch (msg.type) {
      case 'leitura':
        updateUI(msg);
        break;
      case 'status':
        setStatus(msg.conectado, msg.porta, msg.simulando);
        break;
      case 'config':
        applyConfig(msg.config);
        break;
      case 'historico':
        msg.dados.forEach(p => addPonto(p));
        if (msg.dados.length > 0) {
          const last = msg.dados[msg.dados.length - 1];
          updateUI(last);
        }
        break;
      case 'eventos':
        msg.dados.forEach(ev => addEventoUI(ev));
        break;
      case 'evento':
        addEventoUI(msg.evento);
        break;
    }
  };

  ws.onclose = () => {
    setStatus(false);
    setTimeout(connectWS, 3000);
  };

  ws.onerror = () => ws.close();
}

// Inicializa
fetch('/api/config')
  .then(r => r.json())
  .then(cfg => applyConfig(cfg))
  .catch(() => {});

connectWS();

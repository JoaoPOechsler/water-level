const navLinks = document.querySelectorAll('.nav-link');
const pages    = document.querySelectorAll('.page');

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

//Config local
let config = { alturaMaxima: 25, capacidade: 10, porta: 'COM3', baudRate: 9600 };

function applyConfig(cfg) {
  config = { ...config, ...cfg };
  document.getElementById('cfg-capacidade').value = config.capacidade;
  document.getElementById('cfg-altura').value      = config.alturaMaxima;
  document.getElementById('cfg-porta').value       = config.porta;
  document.getElementById('cfg-baud').value        = config.baudRate;
  document.getElementById('val-cap').textContent   = config.capacidade;
}

document.getElementById('btn-salvar').addEventListener('click', async () => {
  const payload = {
    capacidade:   parseFloat(document.getElementById('cfg-capacidade').value),
    alturaMaxima: parseFloat(document.getElementById('cfg-altura').value),
    porta:        document.getElementById('cfg-porta').value.trim(),
    baudRate:     parseInt(document.getElementById('cfg-baud').value),
  };

  try {
    const res  = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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

//Chart.js
const MAX_PONTOS = 60;

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
        pointRadius: 3,
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
        grid:  { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        position: 'left',
        title: { display: true, text: 'Litros', color: '#4a9eff', font: { size: 11 } },
        ticks: { color: '#4a9eff', font: { size: 10 } },
        grid:  { color: 'rgba(255,255,255,0.04)' },
        min: 0,
      },
      y2: {
        position: 'right',
        title: { display: true, text: '%', color: '#2ed8b6', font: { size: 11 } },
        ticks: { color: '#2ed8b6', font: { size: 10 } },
        grid:  { drawOnChartArea: false },
        min: 0, max: 100,
      }
    }
  }
});

function addPonto(ponto) {
  const label = new Date(ponto.timestamp).toLocaleTimeString('pt-BR');
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(ponto.nivelLitros);
  chart.data.datasets[1].data.push(ponto.nivelPercentual);

  if (chart.data.labels.length > MAX_PONTOS) {
    chart.data.labels.shift();
    chart.data.datasets.forEach(d => d.data.shift());
  }
  chart.update('none');
}

document.getElementById('btn-clear').addEventListener('click', () => {
  chart.data.labels = [];
  chart.data.datasets.forEach(d => d.data = []);
  chart.update();
});

// UI: métricas e tanque
function updateUI(ponto) {
  document.getElementById('val-litros').textContent  = ponto.nivelLitros.toFixed(2);
  document.getElementById('val-percent').textContent = ponto.nivelPercentual.toFixed(1);
  document.getElementById('val-dist').textContent    = ponto.distancia.toFixed(1);

  const pct   = ponto.nivelPercentual;
  const fill  = document.getElementById('tank-fill');
  const label = document.getElementById('tank-label');
  const alert = document.getElementById('alert-badge');

  fill.style.height = Math.max(0, Math.min(100, pct)) + '%';
  label.textContent = pct.toFixed(0) + '%';

  fill.className = 'tank-fill';
  if (pct < 20)      fill.classList.add('low');
  else if (pct < 50) fill.classList.add('mid');
  else if (pct < 90) fill.classList.add('high');
  else               fill.classList.add('full');

  alert.style.display = pct < 20 ? 'block' : 'none';

  addPonto(ponto);
}

// Status
function setStatus(conectado, porta, simulando) {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (conectado && simulando) {
    dot.className    = 'status-dot simulating';
    text.innerHTML   = '🎭 Simulação ativa';
  } else if (conectado) {
    dot.className    = 'status-dot connected';
    text.textContent = `Conectado (${porta || ''})`;
  } else {
    dot.className    = 'status-dot disconnected';
    text.textContent = 'Desconectado';
  }
}

// WebSocket
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
    }
  };

  ws.onclose = () => {
    setStatus(false);
    setTimeout(connectWS, 3000); // reconecta automaticamente
  };

  ws.onerror = () => ws.close();
}

// Inicializa
fetch('/api/config')
  .then(r => r.json())
  .then(cfg => applyConfig(cfg))
  .catch(() => {});

connectWS();

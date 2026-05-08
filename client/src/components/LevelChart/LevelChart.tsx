import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import type { Reading } from '../../types';
import styles from './LevelChart.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Range = '5m' | '1h' | '24h' | 'tudo';

const RANGE_MS: Record<Range, number> = {
  '5m': 5 * 60_000,
  '1h': 3_600_000,
  '24h': 86_400_000,
  tudo: Infinity,
};

const RANGES: Range[] = ['5m', '1h', '24h', 'tudo'];

const OPTIONS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { labels: { color: '#8890a6', font: { size: 11 }, boxWidth: 12 } },
    tooltip: {
      backgroundColor: '#1a1d27',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#e8eaf0',
      bodyColor: '#8890a6',
    },
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
      min: 0,
      max: 100,
    },
  },
};

interface Props {
  history: Reading[];
  onClear: () => void;
}

export function LevelChart({ history, onClear }: Props) {
  const [range, setRange] = useState<Range>('5m');

  const filtered = useMemo(() => {
    const now = Date.now();
    const limit = RANGE_MS[range];
    return history.filter(p => now - new Date(p.timestamp).getTime() <= limit);
  }, [history, range]);

  const data = {
    labels: filtered.map(p => new Date(p.timestamp).toLocaleTimeString('pt-BR')),
    datasets: [
      {
        label: 'Litros',
        data: filtered.map(p => p.nivelLitros),
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
        data: filtered.map(p => p.nivelPercentual),
        borderColor: '#2ed8b6',
        backgroundColor: 'rgba(46,216,182,0.05)',
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.4,
        yAxisID: 'y2',
      },
    ],
  };

  return (
    <div className={styles.panel}>
      <div className={styles.title}>
        Histórico de Nível
        <div className={styles.actions}>
          <div className={styles.filterGroup}>
            {RANGES.map(r => (
              <button
                key={r}
                className={`${styles.btnFilter} ${range === r ? styles.active : ''}`}
                onClick={() => setRange(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <button className={styles.btnClear} onClick={onClear}>
            Limpar
          </button>
        </div>
      </div>
      <div className={styles.chartWrap}>
        <Line data={data} options={OPTIONS} />
      </div>
    </div>
  );
}

import type { Config, Evento, Reading } from '../types';
import { MetricCard } from '../components/MetricCard/MetricCard';
import { TankGauge } from '../components/TankGauge/TankGauge';
import { LevelChart } from '../components/LevelChart/LevelChart';
import { EventLog } from '../components/EventLog/EventLog';
import styles from './Dashboard.module.css';

interface Props {
  reading: Reading | null;
  config: Config;
  history: Reading[];
  events: Evento[];
  onClearHistory: () => void;
}

export function Dashboard({ reading, config, history, events, onClearHistory }: Props) {
  return (
    <main className={styles.container}>
      <div className={styles.cardsGrid}>
        <MetricCard
          label="Nível atual"
          value={reading ? reading.nivelLitros.toFixed(2) : '–'}
          unit="litros"
          variant="blue"
        />
        <MetricCard
          label="Percentual"
          value={reading ? reading.nivelPercentual.toFixed(1) : '–'}
          unit="%"
          variant="teal"
        />
        <MetricCard
          label="Distância"
          value={reading ? reading.distancia.toFixed(1) : '–'}
          unit="cm"
          variant="gray"
        />
        <MetricCard
          label="Capacidade"
          value={String(config.capacidade)}
          unit="litros"
          variant="green"
        />
      </div>

      <div className={styles.sectionRow}>
        <TankGauge reading={reading} config={config} />
        <LevelChart history={history} onClear={onClearHistory} />
      </div>

      <div className={styles.sectionRowFull}>
        <EventLog events={events} />

        <div className={styles.exportPanel}>
          <div className={styles.panelTitle}>Exportar Dados</div>
          <p className={styles.exportDesc}>
            Baixe o histórico de leituras em CSV para análise no Excel ou similar.
          </p>
          <div className={styles.exportButtons}>
            <a href="/api/exportar?periodo=1h" className={styles.btnExport}>
              Última hora
            </a>
            <a href="/api/exportar?periodo=24h" className={styles.btnExport}>
              Últimas 24h
            </a>
            <a href="/api/exportar?periodo=7d" className={styles.btnExport}>
              Últimos 7 dias
            </a>
            <a href="/api/exportar?periodo=tudo" className={`${styles.btnExport} ${styles.btnExportMain}`}>
              Tudo
            </a>
          </div>
          <div className={styles.exportStats}>
            <span>{history.length}</span> leituras em memória
          </div>
        </div>
      </div>
    </main>
  );
}

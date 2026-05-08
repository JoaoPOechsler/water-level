import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import styles from './App.module.css';

type Page = 'dashboard' | 'config';

export function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const { reading, status, config, history, events, clearHistory } = useWebSocket();

  return (
    <div>
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <span>💧</span>
          <span>WaterLevel</span>
        </div>
        <div className={styles.links}>
          <button
            className={`${styles.link} ${page === 'dashboard' ? styles.active : ''}`}
            onClick={() => setPage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`${styles.link} ${page === 'config' ? styles.active : ''}`}
            onClick={() => setPage('config')}
          >
            Configurações
          </button>
        </div>
        <div className={styles.statusArea}>
          <span
            className={`${styles.dot} ${
              status.simulando
                ? styles.simulating
                : status.conectado
                  ? styles.connected
                  : styles.disconnected
            }`}
          />
          <span className={styles.statusText}>
            {status.simulando
              ? '🎭 Simulação ativa'
              : status.conectado
                ? `Conectado (${status.porta})`
                : 'Desconectado'}
          </span>
        </div>
      </nav>

      {!config ? (
        <div className={styles.loading}>Conectando…</div>
      ) : page === 'dashboard' ? (
        <Dashboard
          reading={reading}
          config={config}
          history={history}
          events={events}
          onClearHistory={clearHistory}
        />
      ) : (
        <Settings config={config} />
      )}
    </div>
  );
}

import type { Evento } from '../../types';
import styles from './EventLog.module.css';

const ICONS: Record<Evento['tipo'], string> = {
  critico: '🔴',
  cheio: '🟢',
  info: 'ℹ️',
};

const MAX_DISPLAY = 50;

interface Props {
  events: Evento[];
}

export function EventLog({ events }: Props) {
  const displayed = events.slice(-MAX_DISPLAY).reverse();

  return (
    <div className={styles.panel}>
      <div className={styles.title}>
        Log de Eventos
        <span className={styles.count}>{events.length}</span>
      </div>
      <div className={styles.list}>
        {displayed.length === 0 ? (
          <div className={styles.empty}>Nenhum evento registrado ainda</div>
        ) : (
          displayed.map(ev => {
            const time = new Date(ev.timestamp).toLocaleTimeString('pt-BR');
            const date = new Date(ev.timestamp).toLocaleDateString('pt-BR');
            return (
              <div key={ev.timestamp + ev.mensagem} className={styles.item}>
                <div className={`${styles.icon} ${styles[ev.tipo]}`}>{ICONS[ev.tipo]}</div>
                <div className={styles.body}>
                  <div className={styles.msg}>{ev.mensagem}</div>
                  <div className={styles.time}>{date} às {time}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

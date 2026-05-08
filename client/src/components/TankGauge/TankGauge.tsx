import type { Config, Reading } from '../../types';
import styles from './TankGauge.module.css';

interface Props {
  reading: Reading | null;
  config: Config;
}

function fillVariant(pct: number, alertaBaixo: number, alertaAlto: number): string {
  if (pct <= alertaBaixo) return styles.low;
  if (pct < 50) return styles.mid;
  if (pct < alertaAlto) return styles.high;
  return styles.full;
}

export function TankGauge({ reading, config }: Props) {
  const pct = reading?.nivelPercentual ?? 0;
  const showAlert = reading !== null && pct <= config.alertaBaixo;

  return (
    <div className={styles.panel}>
      <div className={styles.title}>Nível da Caixa</div>
      <div className={styles.wrap}>
        <div className={styles.outer}>
          <div className={styles.inner}>
            <div
              className={`${styles.fill} ${fillVariant(pct, config.alertaBaixo, config.alertaAlto)}`}
              style={{ height: `${Math.max(0, Math.min(100, pct))}%` }}
            >
              <span className={styles.label}>{pct.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        {showAlert && <div className={styles.alertBadge}>⚠ Nível baixo!</div>}
      </div>
    </div>
  );
}

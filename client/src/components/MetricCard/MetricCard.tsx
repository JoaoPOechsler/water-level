import styles from './MetricCard.module.css';

interface Props {
  label: string;
  value: string;
  unit: string;
  variant: 'blue' | 'teal' | 'green' | 'gray';
}

export function MetricCard({ label, value, unit, variant }: Props) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      <div className={styles.unit}>{unit}</div>
    </div>
  );
}

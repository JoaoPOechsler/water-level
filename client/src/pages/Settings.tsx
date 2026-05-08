import { useState } from 'react';
import type { Config } from '../types';
import styles from './Settings.module.css';

interface Props {
  config: Config;
}

export function Settings({ config: initial }: Props) {
  const [form, setForm] = useState({
    capacidade: String(initial.capacidade),
    alturaMaxima: String(initial.alturaMaxima),
    porta: initial.porta,
    baudRate: String(initial.baudRate),
    alertaBaixo: String(initial.alertaBaixo),
    alertaAlto: String(initial.alertaAlto),
    somAtivado: initial.somAtivado,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  function set(field: keyof typeof form, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    const payload = {
      capacidade: parseFloat(form.capacidade),
      alturaMaxima: parseFloat(form.alturaMaxima),
      porta: form.porta.trim(),
      baudRate: parseInt(form.baudRate),
      alertaBaixo: parseFloat(form.alertaBaixo),
      alertaAlto: parseFloat(form.alertaAlto),
      somAtivado: form.somAtivado,
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveError((data.errors as string[])?.join('; ') ?? 'Erro ao salvar');
        setSaveMsg('');
        return;
      }

      setSaveMsg('✓ Salvo com sucesso!');
      setSaveError('');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch {
      setSaveError('Erro de comunicação com o servidor');
    }
  }

  return (
    <main className={styles.container}>
      {/* Configurações da Caixa */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Configurações da Caixa</div>
        <div className={styles.grid}>
          <div className={styles.group}>
            <label>Capacidade total (litros)</label>
            <input
              type="number"
              min={1}
              step={0.5}
              value={form.capacidade}
              onChange={e => set('capacidade', e.target.value)}
            />
            <span className={styles.hint}>Volume máximo da caixa</span>
          </div>
          <div className={styles.group}>
            <label>Altura máxima (cm)</label>
            <input
              type="number"
              min={1}
              step={0.5}
              value={form.alturaMaxima}
              onChange={e => set('alturaMaxima', e.target.value)}
            />
            <span className={styles.hint}>Distância quando vazia</span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Alertas</div>
        <div className={styles.grid}>
          <div className={styles.group}>
            <label>Alerta de nível baixo (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.alertaBaixo}
              onChange={e => set('alertaBaixo', e.target.value)}
            />
            <span className={styles.hint}>Notifica quando cair abaixo deste valor</span>
          </div>
          <div className={styles.group}>
            <label>Alerta de caixa cheia (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.alertaAlto}
              onChange={e => set('alertaAlto', e.target.value)}
            />
            <span className={styles.hint}>Notifica quando subir acima deste valor</span>
          </div>
          <div className={styles.group}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={form.somAtivado}
                onChange={e => set('somAtivado', e.target.checked)}
              />
              <span className={styles.toggleSwitch} />
              Notificação sonora
            </label>
            <span className={styles.hint}>Toca um alerta sonoro ao cruzar os limites</span>
          </div>
        </div>
      </div>

      {/* Configurações Avançadas */}
      <div className={styles.panel}>
        <button
          className={styles.advancedToggle}
          onClick={() => setShowAdvanced(v => !v)}
        >
          <span className={`${styles.arrow} ${showAdvanced ? styles.open : ''}`}>▶</span>
          Configurações Avançadas
        </button>
        <div className={`${styles.advancedContent} ${showAdvanced ? styles.advancedOpen : ''}`}>
          <div className={styles.grid}>
            <div className={styles.group}>
              <label>Porta serial</label>
              <input
                type="text"
                placeholder="ex: COM3 ou /dev/ttyUSB0"
                value={form.porta}
                onChange={e => set('porta', e.target.value)}
              />
              <span className={styles.hint}>Porta do Arduino</span>
            </div>
            <div className={styles.group}>
              <label>Baud rate</label>
              <select
                value={form.baudRate}
                onChange={e => set('baudRate', e.target.value)}
              >
                <option value="9600">9600</option>
                <option value="115200">115200</option>
                <option value="57600">57600</option>
                <option value="38400">38400</option>
              </select>
              <span className={styles.hint}>
                Velocidade da serial (deve ser igual ao Serial.begin() do Arduino)
              </span>
            </div>
          </div>
          <div className={styles.info}>
            <div className={styles.infoTitle}>ℹ Sobre a conexão serial</div>
            <ul>
              <li>O sensor ultrassônico mede a distância até a superfície da água</li>
              <li>A porta serial é o canal USB entre o Arduino e o computador</li>
              <li>Alterar a porta ou baud rate reinicia a conexão automaticamente</li>
              <li>No Windows a porta é geralmente <strong>COM3</strong> ou <strong>COM4</strong></li>
              <li>No Linux é geralmente <strong>/dev/ttyUSB0</strong> ou <strong>/dev/ttyACM0</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botão salvar */}
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={handleSave}>
          Salvar todas as configurações
        </button>
        {saveMsg && <span className={styles.saveMsg}>{saveMsg}</span>}
        {saveError && <span className={styles.saveError}>{saveError}</span>}
      </div>
    </main>
  );
}

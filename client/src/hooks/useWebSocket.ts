import { useCallback, useEffect, useRef, useState } from 'react';
import type { Config, ConnectionStatus, Evento, Reading, WsMessage } from '../types';
import { playAlertFull, playAlertLow } from '../utils/sound';

interface WsState {
  reading: Reading | null;
  status: ConnectionStatus;
  config: Config | null;
  history: Reading[];
  events: Evento[];
}

const MAX_CHART_POINTS = 5000;

export function useWebSocket() {
  const [state, setState] = useState<WsState>({
    reading: null,
    status: { conectado: false, porta: '', simulando: false },
    config: null,
    history: [],
    events: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(1000);
  const soundEnabledRef = useRef(true);

  const connect = useCallback(() => {
    const url = import.meta.env.DEV ? 'ws://localhost:3000' : `ws://${location.host}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryDelayRef.current = 1000;
    };

    ws.onmessage = ({ data }: MessageEvent<string>) => {
      const msg: WsMessage = JSON.parse(data);
      setState(prev => {
        switch (msg.type) {
          case 'leitura': {
            const history = [...prev.history, msg];
            if (history.length > MAX_CHART_POINTS) history.splice(0, history.length - MAX_CHART_POINTS);
            return { ...prev, reading: msg, history };
          }
          case 'status':
            return {
              ...prev,
              status: {
                conectado: msg.conectado,
                porta: msg.porta ?? prev.status.porta,
                simulando: msg.simulando ?? false,
              },
            };
          case 'config':
            soundEnabledRef.current = msg.config.somAtivado;
            return { ...prev, config: msg.config };
          case 'historico':
            return { ...prev, history: msg.dados };
          case 'eventos':
            return { ...prev, events: msg.dados };
          case 'evento': {
            if (soundEnabledRef.current) {
              if (msg.evento.tipo === 'critico') playAlertLow();
              else if (msg.evento.tipo === 'cheio') playAlertFull();
            }
            return { ...prev, events: [...prev.events, msg.evento] };
          }
        }
      });
    };

    ws.onclose = () => {
      // ignore if a newer connection already replaced this one
      if (wsRef.current !== ws) return;
      setState(prev => ({ ...prev, status: { ...prev.status, conectado: false } }));
      retryRef.current = setTimeout(connect, retryDelayRef.current);
      retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30000);
    };

    ws.onerror = () => ws.close();
  }, []);

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [] }));
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { ...state, clearHistory };
}

export interface Config {
  alturaMaxima: number;
  capacidade: number;
  porta: string;
  baudRate: number;
  alertaBaixo: number;
  alertaAlto: number;
  somAtivado: boolean;
}

export interface Reading {
  type: 'leitura';
  timestamp: string;
  distancia: number;
  nivelPercentual: number;
  nivelLitros: number;
  caixa: number;
}

export interface Evento {
  tipo: 'critico' | 'cheio' | 'info';
  mensagem: string;
  nivelPercentual: number;
  timestamp: string;
}

export interface ConnectionStatus {
  conectado: boolean;
  porta: string;
  simulando: boolean;
}

export type WsMessage =
  | Reading
  | { type: 'status'; conectado: boolean; porta?: string; simulando?: boolean; erro?: string }
  | { type: 'config'; config: Config }
  | { type: 'historico'; dados: Reading[] }
  | { type: 'eventos'; dados: Evento[] }
  | { type: 'evento'; evento: Evento };

# Monitor de Nível de Água 💧

Dashboard web para monitoramento de nível de água via Arduino + sensor ultrassônico.

## Requisitos

- Node.js 18+ instalado
- Arduino conectado na porta **COM3** (configurável)
- Arduino enviando a distância em centímetros via Serial (uma leitura por linha)

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor
npm start

# 3. Abrir no navegador
http://localhost:3000
```

## Código Arduino esperado

O Arduino deve enviar a distância em cm pela Serial, uma linha por vez:

```cpp
#include <Ultrasonic.h> // ou usando pulseIn direto

const int trigPin = 9;
const int echoPin = 10;

void setup() {
  Serial.begin(9600);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duracao = pulseIn(echoPin, HIGH);
  float distancia = duracao * 0.034 / 2;

  Serial.println(distancia); // envia só o número + \n
  delay(1000);
}
```

## Configuração

Acesse a aba **Configurações** no dashboard para ajustar:

| Campo            | Descrição                                    |
|------------------|----------------------------------------------|
| Capacidade (L)   | Volume máximo da caixa em litros             |
| Altura máxima (cm) | Distância medida quando a caixa está vazia |
| Porta serial     | Ex: `COM3` (Windows) ou `/dev/ttyUSB0` (Linux) |
| Baud rate        | Deve ser igual ao do `Serial.begin()` no Arduino |

As configurações são salvas em `config.json` e persistem entre reinicializações.
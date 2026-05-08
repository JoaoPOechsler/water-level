function converterLeitura(distancia, config) {
  const { alturaMaxima, capacidade } = config;
  const nivelPercentual = Math.max(0, Math.min(100, 100 - (distancia / alturaMaxima * 100)));
  const nivelLitros = parseFloat(((nivelPercentual / 100) * capacidade).toFixed(2));
  return { nivelPercentual: parseFloat(nivelPercentual.toFixed(1)), nivelLitros };
}

module.exports = { converterLeitura };

const MAX_RODADAS = 3;

// Devolve a dupla vencedora, null se a mão acabou sem vencedor (três empates)
// ou undefined se ainda falta rodada.
function decidir(resultados) {
  const vitorias = [0, 0];
  for (const r of resultados) {
    if (r !== null) vitorias[r]++;
  }
  if (vitorias[0] === 2) return 0;
  if (vitorias[1] === 2) return 1;
  if (resultados.length < 2) return undefined;

  const [primeira, segunda, terceira] = resultados;
  if (primeira === null) {
    if (segunda !== null) return segunda;
    return resultados.length === MAX_RODADAS ? terceira : undefined;
  }
  // Empate na 2ª ou na 3ª: vale quem ganhou a 1ª.
  return resultados.at(-1) === null ? primeira : undefined;
}

function validar(resultados) {
  if (!Array.isArray(resultados)) {
    throw new Error('os resultados devem ser uma lista');
  }
  if (resultados.length > MAX_RODADAS) {
    throw new Error('uma mão tem no máximo 3 rodadas');
  }
  resultados.forEach((r) => {
    if (r !== 0 && r !== 1 && r !== null) {
      throw new Error(`resultado de rodada inválido: ${r}`);
    }
  });
  for (let i = 1; i < resultados.length; i++) {
    if (decidir(resultados.slice(0, i)) !== undefined) {
      throw new Error('mão já decidida antes desta rodada');
    }
  }
}

// resultados: vencedor de cada rodada jogada (0, 1 ou null para empate).
function resultadoMao(resultados) {
  validar(resultados);
  const vencedor = decidir(resultados);
  if (vencedor === undefined) {
    return { encerrada: false, vencedor: null };
  }
  return { encerrada: true, vencedor };
}

module.exports = { resultadoMao };

const { JOGADORES, validarJogador } = require('./baralho');
const { forcaCarta } = require('./forca');

const duplaDe = (jogador) => jogador % 2;

function validarJogadas(jogadas) {
  if (!Array.isArray(jogadas) || jogadas.length !== JOGADORES) {
    throw new Error('a rodada precisa de 4 jogadas');
  }
  const vistos = new Set();
  for (const { jogador } of jogadas) {
    validarJogador(jogador, 'jogador');
    if (vistos.has(jogador)) {
      throw new Error(`jogador repetido na rodada: ${jogador}`);
    }
    vistos.add(jogador);
  }
}

// jogadas: [{ jogador, carta, coberta }] na ordem em que foram feitas.
function resolverRodada(jogadas, vira) {
  validarJogadas(jogadas);
  const forcas = jogadas.map((j) => forcaCarta(j.carta, vira, j.coberta));
  const melhor = [-1, -1];
  const primeiroComMelhor = [null, null];
  jogadas.forEach(({ jogador }, i) => {
    const dupla = duplaDe(jogador);
    if (forcas[i] > melhor[dupla]) {
      melhor[dupla] = forcas[i];
      primeiroComMelhor[dupla] = jogador;
    }
  });

  if (melhor[0] === melhor[1]) {
    const ultimo = forcas.lastIndexOf(melhor[0]);
    return { vencedor: null, empate: true, proximo: jogadas[ultimo].jogador };
  }
  const vencedor = melhor[0] > melhor[1] ? 0 : 1;
  return { vencedor, empate: false, proximo: primeiroComMelhor[vencedor] };
}

module.exports = { duplaDe, resolverRodada };

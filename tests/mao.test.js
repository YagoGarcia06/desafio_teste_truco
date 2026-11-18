const { resultadoMao } = require('../src/mao');

const E = null; // rodada empatada

describe('Mão decidida', () => {
  test.each([
    ['CT-MAO-01', 'dupla 0 vence as duas primeiras', [0, 0], 0],
    ['CT-MAO-02', 'dupla 1 vence as duas primeiras', [1, 1], 1],
    ['CT-MAO-03', 'dupla 0 vence 1ª e 3ª', [0, 1, 0], 0],
    ['CT-MAO-04', 'dupla 1 vence 2ª e 3ª', [0, 1, 1], 1],
    ['CT-MAO-05', 'dupla 0 vence 2ª e 3ª', [1, 0, 0], 0],
    ['CT-MAO-06', 'dupla 1 vence 1ª e 3ª', [1, 0, 1], 1],
    ['CT-MAO-07', 'empate na 2ª: vence quem ganhou a 1ª (dupla 0)', [0, E], 0],
    ['CT-MAO-08', 'empate na 2ª: vence quem ganhou a 1ª (dupla 1)', [1, E], 1],
    ['CT-MAO-09', 'empate na 3ª: vence quem ganhou a 1ª (dupla 0)', [0, 1, E], 0],
    ['CT-MAO-10', 'empate na 3ª: vence quem ganhou a 1ª (dupla 1)', [1, 0, E], 1],
    ['CT-MAO-11', 'empate na 1ª: vence quem ganhar a 2ª (dupla 0)', [E, 0], 0],
    ['CT-MAO-12', 'empate na 1ª: vence quem ganhar a 2ª (dupla 1)', [E, 1], 1],
    ['CT-MAO-13', 'empate na 1ª e na 2ª: vence quem ganhar a 3ª (dupla 0)', [E, E, 0], 0],
    ['CT-MAO-14', 'empate na 1ª e na 2ª: vence quem ganhar a 3ª (dupla 1)', [E, E, 1], 1],
  ])('%s: %s', (_id, _descricao, resultados, vencedor) => {
    expect(resultadoMao(resultados)).toEqual({ encerrada: true, vencedor });
  });

  test('CT-MAO-15: três empates encerram a mão sem vencedor (ninguém pontua)', () => {
    expect(resultadoMao([E, E, E])).toEqual({ encerrada: true, vencedor: null });
  });
});

describe('Mão ainda em andamento', () => {
  test.each([
    ['CT-MAO-16', 'nenhuma rodada jogada', []],
    ['CT-MAO-17', 'só a 1ª rodada, com vencedor', [0]],
    ['CT-MAO-18', 'só a 1ª rodada, empatada', [E]],
    ['CT-MAO-19', 'uma rodada para cada dupla', [0, 1]],
    ['CT-MAO-20', 'duas rodadas empatadas', [E, E]],
  ])('%s: %s ainda não decide a mão', (_id, _descricao, resultados) => {
    expect(resultadoMao(resultados)).toEqual({ encerrada: false, vencedor: null });
  });
});

describe('Resultados inválidos', () => {
  test('CT-MAO-21: rejeita mais de 3 rodadas', () => {
    expect(() => resultadoMao([E, E, E, 0])).toThrow(/no máximo 3 rodadas/);
  });

  test('CT-MAO-22: rejeita rodada depois de a mão já estar decidida', () => {
    expect(() => resultadoMao([0, 0, 1])).toThrow(/mão já decidida/);
    expect(() => resultadoMao([E, 1, 0])).toThrow(/mão já decidida/);
  });

  test('CT-MAO-23: rejeita resultado de rodada que não é 0, 1 ou empate', () => {
    expect(() => resultadoMao([2])).toThrow(/resultado de rodada inválido/);
    expect(() => resultadoMao(['x', 0])).toThrow(/resultado de rodada inválido/);
    expect(() => resultadoMao('00')).toThrow(/lista/);
  });
});

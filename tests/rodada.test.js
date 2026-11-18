const { cartaDeTexto: c } = require('../src/baralho');
const { resolverRodada } = require('../src/rodada');

// Monta as jogadas a partir de textos; '*' no fim indica carta coberta.
function jogadas(inicio, textos) {
  return textos.map((t, i) => ({
    jogador: (inicio + i) % 4,
    carta: c(t.replace('*', '')),
    coberta: t.endsWith('*'),
  }));
}

const VIRA = c('4o'); // manilha 5

describe('Vencedor da rodada', () => {
  test('CT-RODADA-01: dupla 0 vence com a carta mais forte e o jogador dela começa a próxima', () => {
    const r = resolverRodada(jogadas(0, ['Ko', 'Ao', '3p', '2c']), VIRA);
    expect(r).toEqual({ vencedor: 0, empate: false, proximo: 2 });
  });

  test('CT-RODADA-02: dupla 1 vence com a carta mais forte', () => {
    const r = resolverRodada(jogadas(0, ['Ko', 'Ao', '2p', '3c']), VIRA);
    expect(r).toEqual({ vencedor: 1, empate: false, proximo: 3 });
  });

  test('CT-RODADA-03: manilha vence a carta comum mais forte', () => {
    const r = resolverRodada(jogadas(0, ['3o', '5o', '3p', '3c']), VIRA);
    expect(r.vencedor).toBe(1);
    expect(r.proximo).toBe(1);
  });

  test('CT-RODADA-04: manilhas decidem pelo naipe (zap vence copeta)', () => {
    const r = resolverRodada(jogadas(0, ['6o', '5c', '5p', '7o']), VIRA);
    expect(r.vencedor).toBe(0);
    expect(r.proximo).toBe(2);
  });
});

describe('Empate (cangou)', () => {
  test('CT-RODADA-05: melhores cartas das duplas com a mesma força empatam', () => {
    const r = resolverRodada(jogadas(0, ['Kp', 'Ko', '6o', '7o']), VIRA);
    expect(r.vencedor).toBeNull();
    expect(r.empate).toBe(true);
  });

  test('CT-RODADA-06: no empate começa quem cangou (último a jogar a carta de maior força)', () => {
    expect(resolverRodada(jogadas(0, ['Kp', 'Ko', '6o', '7o']), VIRA).proximo).toBe(1);
    expect(resolverRodada(jogadas(0, ['Ap', 'Ao', 'Ac', '6o']), VIRA).proximo).toBe(2);
  });

  test('CT-RODADA-07: parceiros com cartas iguais não empatam entre si', () => {
    const r = resolverRodada(jogadas(0, ['3p', '2o', '3o', 'Ko']), VIRA);
    expect(r).toEqual({ vencedor: 0, empate: false, proximo: 0 });
  });

  test('CT-RODADA-08: empate com rodada começando no jogador 2 devolve a vez a quem cangou', () => {
    const r = resolverRodada(jogadas(2, ['Jo', 'Qo', '6o', 'Jp']), VIRA);
    expect(r.empate).toBe(true);
    expect(r.proximo).toBe(1);
  });

  test('CT-RODADA-09: manilhas de naipes diferentes nunca empatam (espadilha vence pica-fumo)', () => {
    const r = resolverRodada(jogadas(3, ['5o', '5e', '6o', '7o']), VIRA);
    expect(r.vencedor).toBe(0);
    expect(r.proximo).toBe(0);
  });
});

describe('Cartas cobertas na rodada', () => {
  test('CT-RODADA-10: carta coberta perde para qualquer carta aberta', () => {
    const r = resolverRodada(jogadas(0, ['3p*', '4o', '5p*', '6o']), VIRA);
    expect(r.vencedor).toBe(1);
    expect(r.proximo).toBe(3);
  });

  test('CT-RODADA-11: rodada só com cartas cobertas empata e começa o último a jogar', () => {
    const r = resolverRodada(jogadas(1, ['3p*', '4o*', '5p*', '6o*']), VIRA);
    expect(r.empate).toBe(true);
    expect(r.proximo).toBe(0);
  });
});

describe('Validação das jogadas', () => {
  test('CT-RODADA-12: rejeita rodada com menos de 4 jogadas', () => {
    expect(() => resolverRodada(jogadas(0, ['Ko', 'Ao', '3p']), VIRA)).toThrow(/4 jogadas/);
    expect(() => resolverRodada(undefined, VIRA)).toThrow(/4 jogadas/);
  });

  test('CT-RODADA-13: rejeita jogador repetido ou inválido', () => {
    const repetido = jogadas(0, ['Ko', 'Ao', '3p', '2c']);
    repetido[3].jogador = 0;
    expect(() => resolverRodada(repetido, VIRA)).toThrow(/jogador repetido/);
    const invalido = jogadas(0, ['Ko', 'Ao', '3p', '2c']);
    invalido[1].jogador = 7;
    expect(() => resolverRodada(invalido, VIRA)).toThrow(/jogador inválido/);
  });
});

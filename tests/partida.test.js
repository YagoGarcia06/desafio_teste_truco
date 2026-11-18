const { cartaDeTexto: c } = require('../src/baralho');
const { Partida } = require('../src/partida');

// Distribuição a partir de textos curtos ('Ap' = A de paus).
function dist(maos, vira) {
  return { maos: maos.map((mao) => mao.map(c)), vira: c(vira) };
}

// Vira 4 de ouros: manilha 5 (nenhum 5 nas mãos).
const BASE = () =>
  dist(
    [
      ['3p', '2p', 'Ko'],
      ['Ao', '7o', '6o'],
      ['Kp', 'Qc', '4p'],
      ['2c', '6c', 'Jc'],
    ],
    '4o'
  );

// Vira A de paus: manilha 2. As duplas têm cartas de mesma força em todas as rodadas.
const EMPATES = () =>
  dist(
    [
      ['Ko', '7p', '6p'],
      ['Kc', '7o', '6o'],
      ['4o', '4c', '5o'],
      ['4e', '4p', '5c'],
    ],
    'Ap'
  );

// Joga as cartas indicadas, cada uma pelo jogador da vez; '*' no fim cobre a carta.
function jogarCartas(partida, textos) {
  for (const t of textos) {
    const coberta = t.endsWith('*');
    partida.jogar(partida.estado().vez, c(t.replace('*', '')), { coberta });
  }
}

describe('Início da partida', () => {
  test('CT-PARTIDA-01: partida nova começa 0 a 0, mão valendo 1 e jogador 0 na vez', () => {
    const e = new Partida({ distribuicoes: [BASE()] }).estado();
    expect(e.placar).toEqual([0, 0]);
    expect(e.valorMao).toBe(1);
    expect(e.carteador).toBe(3);
    expect(e.vez).toBe(0);
    expect(e.rodada).toBe(1);
    expect(e.encerrada).toBe(false);
    expect(e.vencedor).toBeNull();
    expect(e.pedidoPendente).toBeNull();
  });

  test('CT-PARTIDA-02: o primeiro a jogar é o seguinte ao carteador', () => {
    expect(new Partida({ carteadorInicial: 1, distribuicoes: [BASE()] }).estado().vez).toBe(2);
    expect(new Partida({ carteadorInicial: 3, distribuicoes: [BASE()] }).estado().vez).toBe(0);
  });

  test('CT-PARTIDA-03: com rng, cada jogador recebe 3 cartas diferentes e há uma vira', () => {
    const p = new Partida({ semente: 10 });
    const cartas = [0, 1, 2, 3].flatMap((j) => {
      const mao = p.verCartas(j, j);
      expect(mao).toHaveLength(3);
      return mao;
    });
    cartas.push(p.estado().vira);
    expect(new Set(cartas.map((x) => `${x.valor}${x.naipe}`)).size).toBe(13);
  });

  test('CT-PARTIDA-04: a mesma semente gera a mesma distribuição', () => {
    const a = new Partida({ semente: 99 });
    const b = new Partida({ semente: 99 });
    expect(a.verCartas(2, 2)).toEqual(b.verCartas(2, 2));
    expect(a.estado().vira).toEqual(b.estado().vira);
  });

  test('CT-PARTIDA-05: a distribuição injetada é a usada na mão', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    expect(p.verCartas(0, 0)).toEqual(BASE().maos[0]);
    expect(p.verCartas(3, 3)).toEqual(BASE().maos[3]);
    expect(p.estado().vira).toEqual(c('4o'));
  });

  test('CT-PARTIDA-06: rng injetado é usado no lugar da semente', () => {
    const a = new Partida({ rng: () => 0.999999 });
    expect(a.verCartas(0, 0)).toEqual([c('4o'), c('Qo'), c('2o')]);
    expect(a.estado().vira).toEqual(c('6e'));
  });
});

describe('Fluxo de rodadas e mãos', () => {
  test('CT-PARTIDA-07: a ordem de jogo é crescente', () => {
    const p = new Partida({ carteadorInicial: 1, distribuicoes: [BASE()] });
    const vezes = [];
    for (const t of ['Qc', '6c', '3p']) {
      vezes.push(p.estado().vez);
      jogarCartas(p, [t]);
    }
    expect(vezes).toEqual([2, 3, 0]);
    expect(p.estado().vez).toBe(1);
  });

  test('CT-PARTIDA-08: quem ganha a rodada começa a próxima', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    jogarCartas(p, ['Ko', 'Ao', '4p', 'Jc']);
    const e = p.estado();
    expect(e.resultadosRodadas).toEqual([1]);
    expect(e.vez).toBe(1);
    expect(e.rodada).toBe(2);
  });

  test('CT-PARTIDA-09: vencer duas rodadas dá 1 ponto e começa nova mão com o próximo carteador', () => {
    const p = new Partida({ distribuicoes: [BASE(), EMPATES()] });
    jogarCartas(p, ['3p', '7o', '4p', '6c', '2p', '6o', 'Qc', 'Jc']);
    const e = p.estado();
    expect(e.placar).toEqual([1, 0]);
    expect(e.ultimaMao).toEqual({ vencedor: 0, pontos: 1 });
    expect(e.maosJogadas).toBe(1);
    expect(e.carteador).toBe(0);
    expect(e.vez).toBe(1);
    expect(e.rodada).toBe(1);
    expect(p.verCartas(1, 1)).toEqual(EMPATES().maos[1]);
  });

  test('CT-PARTIDA-10: em rodada empatada começa quem cangou', () => {
    const p = new Partida({ distribuicoes: [EMPATES()] });
    jogarCartas(p, ['Ko', 'Kc', '4o', '4e']);
    expect(p.estado().resultadosRodadas).toEqual([null]);
    expect(p.estado().vez).toBe(1);
  });

  test('CT-PARTIDA-11: três rodadas empatadas não dão ponto a ninguém e começa a próxima mão', () => {
    const p = new Partida({ distribuicoes: [EMPATES()] });
    jogarCartas(p, ['Ko', 'Kc', '4o', '4e', '7o', '4c', '4p', '7p', '6p', '6o', '5o', '5c']);
    const e = p.estado();
    expect(e.placar).toEqual([0, 0]);
    expect(e.ultimaMao).toEqual({ vencedor: null, pontos: 0 });
    expect(e.carteador).toBe(0);
  });

  test('CT-PARTIDA-12: mão decidida na 3ª rodada (2 a 1)', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    jogarCartas(p, ['3p', '7o', '4p', '6c', 'Ko', 'Ao', 'Qc', '2c']);
    expect(p.estado().resultadosRodadas).toEqual([0, 1]);
    expect(p.estado().vez).toBe(3);
    jogarCartas(p, ['Jc', '2p', '6o', 'Kp']);
    expect(p.estado().placar).toEqual([1, 0]);
  });

  test('CT-PARTIDA-13: empate na 3ª rodada dá a mão a quem venceu a 1ª', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    jogarCartas(p, ['3p', '7o', '4p', '6c', 'Ko', 'Ao', 'Qc', 'Jc', '6o', 'Kp', '2c', '2p']);
    expect(p.estado().placar).toEqual([1, 0]);
    expect(p.estado().ultimaMao).toEqual({ vencedor: 0, pontos: 1 });
  });

  test('CT-PARTIDA-14: carta pode ser jogada pela posição na mão', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.jogar(0, 2);
    const mesa = p.estado().cartasNaMesa;
    expect(mesa).toEqual([{ jogador: 0, carta: c('Ko'), coberta: false }]);
    expect(p.verCartas(0, 0)).toEqual([c('3p'), c('2p')]);
  });

  test('CT-PARTIDA-15: acabadas as distribuições injetadas, as mãos seguintes vêm do rng', () => {
    const jogarPrimeiraMao = (p) => jogarCartas(p, ['3p', '7o', '4p', '6c', '2p', '6o', 'Qc', 'Jc']);
    const a = new Partida({ semente: 3, distribuicoes: [BASE()] });
    const b = new Partida({ semente: 3, distribuicoes: [BASE()] });
    jogarPrimeiraMao(a);
    jogarPrimeiraMao(b);
    expect(a.verCartas(1, 1)).toHaveLength(3);
    expect(a.verCartas(1, 1)).toEqual(b.verCartas(1, 1));
    expect(a.verCartas(1, 1)).not.toEqual(BASE().maos[1]);
  });

  test('CT-PARTIDA-16: cada jogador só vê as próprias cartas', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    expect(p.verCartas(2, 2)).toEqual(BASE().maos[2]);
    expect(() => p.verCartas(0, 2)).toThrow(/não pode ver as cartas/);
    expect(() => p.verCartas(0, 1)).toThrow(/não pode ver as cartas/);
  });

  test('CT-PARTIDA-17: a vez e a ordem continuam certas na segunda mão', () => {
    const p = new Partida({ distribuicoes: [BASE(), BASE()] });
    jogarCartas(p, ['3p', '7o', '4p', '6c', '2p', '6o', 'Qc', 'Jc']);
    expect(p.estado().vez).toBe(1);
    jogarCartas(p, ['Ao', 'Kp', '2c', '3p']);
    expect(p.estado().resultadosRodadas).toEqual([0]);
    expect(p.estado().vez).toBe(0);
  });
});

describe('Carta coberta', () => {
  test('CT-COBERTA-01: cobrir carta na 1ª rodada gera erro e nada muda', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    expect(() => p.jogar(0, c('3p'), { coberta: true })).toThrow(/1ª rodada/);
    expect(p.verCartas(0, 0)).toHaveLength(3);
    expect(p.estado().vez).toBe(0);
  });

  test('CT-COBERTA-02: na 2ª rodada a carta coberta é aceita e perde para qualquer carta aberta', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    jogarCartas(p, ['3p', '7o', '4p', '6c']);
    jogarCartas(p, ['2p*', '6o', 'Qc*', 'Jc']);
    expect(p.estado().resultadosRodadas).toEqual([0, 1]);
    expect(p.estado().vez).toBe(3);
  });

  test('CT-COBERTA-03: na 3ª rodada também é possível cobrir', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    jogarCartas(p, ['3p', '7o', '4p', '6c', 'Ko', 'Ao', 'Qc', '2c']);
    jogarCartas(p, ['Jc', '2p*', '6o', 'Kp*']);
    expect(p.estado().placar).toEqual([0, 1]);
  });

  test('CT-COBERTA-04: a carta coberta aparece na mesa sem revelar qual é', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    jogarCartas(p, ['3p', '7o', '4p', '6c', '2p*']);
    expect(p.estado().cartasNaMesa).toEqual([{ jogador: 0, coberta: true }]);
  });
});

describe('Erros de jogada', () => {
  test('CT-ERRO-01: jogar fora da vez gera erro', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    expect(() => p.jogar(1, c('Ao'))).toThrow(/não é a vez/);
    expect(p.verCartas(1, 1)).toHaveLength(3);
  });

  test('CT-ERRO-02: jogar carta que não está na mão gera erro', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    expect(() => p.jogar(0, c('Ao'))).toThrow(/não está na mão/);
    expect(() => p.jogar(0, c('5p'))).toThrow(/não está na mão/);
  });

  test('CT-ERRO-03: jogar carta já jogada gera erro', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    jogarCartas(p, ['3p', '7o', '4p', '6c']);
    expect(() => p.jogar(0, c('3p'))).toThrow(/não está na mão/);
  });

  test('CT-ERRO-04: posição fora da mão gera erro', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    expect(() => p.jogar(0, 3)).toThrow(/não está na mão/);
    expect(() => p.jogar(0, -1)).toThrow(/não está na mão/);
    jogarCartas(p, ['3p', '7o', '4p', '6c']);
    expect(() => p.jogar(0, 2)).toThrow(/não está na mão/);
  });

  test('CT-ERRO-05: jogador inexistente gera erro', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    expect(() => p.jogar(4, 0)).toThrow(/jogador inválido/);
    expect(() => p.verCartas(0, 7)).toThrow(/jogador inválido/);
  });

  test('CT-ERRO-06: carteador inicial inválido gera erro', () => {
    expect(() => new Partida({ carteadorInicial: 4 })).toThrow(/carteador inválido/);
  });

  test('CT-ERRO-07: distribuição injetada inválida gera erro', () => {
    const d = BASE();
    d.maos[0][0] = c('Ao');
    expect(() => new Partida({ distribuicoes: [d] })).toThrow(/carta repetida/);
  });

  test('CT-ERRO-08: semente inválida gera erro', () => {
    expect(() => new Partida({ semente: 'x' })).toThrow(/semente/);
  });
});

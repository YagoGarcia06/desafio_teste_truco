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

// Vira 4 de ouros: a dupla 0 tem as quatro manilhas e vence qualquer mão jogando a 1ª carta da mão.
const DOMINIO = () =>
  dist(
    [
      ['5p', '5c', '3p'],
      ['6o', '6e', '7o'],
      ['5e', '5o', '3c'],
      ['6c', '6p', '7e'],
    ],
    '4o'
  );

// Rodadas que decidem a mão com a distribuição BASE e o jogador 0 começando.
const VITORIA_DUPLA_0 = ['3p', '7o', '4p', '6c', '2p', '6o', 'Qc', 'Jc'];
const VITORIA_DUPLA_1 = ['Ko', 'Ao', '4p', 'Jc', '7o', 'Qc', '2c', '2p'];

// Joga a primeira carta da mão de cada jogador da vez, n vezes.
function jogarPrimeiras(partida, n) {
  for (let i = 0; i < n; i++) {
    partida.jogar(partida.estado().vez, 0);
  }
}

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

describe('Aumentos durante a mão', () => {
  test('CT-PARTIDA-18: o jogador da vez pede truco e o pedido fica pendente', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.pedirAumento(0);
    expect(p.estado().pedidoPendente).toEqual({ valor: 3, dupla: 0 });
    expect(p.estado().valorMao).toBe(1);
    expect(p.estado().vez).toBe(0);
  });

  test('CT-PARTIDA-19: truco aceito faz a mão valer 3 pontos', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.pedirAumento(0);
    p.responder(1, 'aceitar');
    expect(p.estado().valorMao).toBe(3);
    jogarCartas(p, VITORIA_DUPLA_0);
    expect(p.estado().placar).toEqual([3, 0]);
    expect(p.estado().ultimaMao).toEqual({ vencedor: 0, pontos: 3 });
  });

  test('CT-PARTIDA-20: correr do truco dá 1 ponto a quem pediu e começa a próxima mão', () => {
    const p = new Partida({ distribuicoes: [BASE(), BASE()] });
    p.pedirAumento(0);
    p.responder(1, 'correr');
    const e = p.estado();
    expect(e.placar).toEqual([1, 0]);
    expect(e.ultimaMao).toEqual({ vencedor: 0, pontos: 1 });
    expect(e.carteador).toBe(0);
    expect(e.valorMao).toBe(1);
    expect(e.pedidoPendente).toBeNull();
  });

  test('CT-PARTIDA-21: truco aumentado para seis e corrido dá 3 pontos a quem aumentou', () => {
    const p = new Partida({ distribuicoes: [BASE(), BASE()] });
    p.pedirAumento(0);
    p.responder(3, 'aumentar');
    expect(p.estado().pedidoPendente).toEqual({ valor: 6, dupla: 1 });
    p.responder(2, 'correr');
    expect(p.estado().placar).toEqual([0, 3]);
  });

  test('CT-PARTIDA-22: aumentos até doze aceitos fazem a mão valer 12 e encerram a partida', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.pedirAumento(0);
    p.responder(1, 'aumentar');
    p.responder(2, 'aumentar');
    p.responder(3, 'aumentar');
    expect(p.estado().pedidoPendente).toEqual({ valor: 12, dupla: 1 });
    p.responder(0, 'aceitar');
    expect(p.estado().valorMao).toBe(12);
    jogarCartas(p, VITORIA_DUPLA_0);
    const e = p.estado();
    expect(e.placar).toEqual([12, 0]);
    expect(e.encerrada).toBe(true);
    expect(e.vencedor).toBe(0);
  });

  test('CT-PARTIDA-23: truco pedido na 2ª rodada vale para a mão inteira', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    jogarCartas(p, ['3p', '7o', '4p', '6c']);
    p.pedirAumento(0);
    p.responder(3, 'aceitar');
    jogarCartas(p, ['2p', '6o', 'Qc', 'Jc']);
    expect(p.estado().placar).toEqual([3, 0]);
  });

  test('CT-PARTIDA-24: depois do aceite só a dupla que aceitou pode pedir o próximo aumento', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.pedirAumento(0);
    p.responder(1, 'aceitar');
    expect(() => p.pedirAumento(0)).toThrow(/só a dupla que aceitou/);
    jogarCartas(p, ['3p']);
    p.pedirAumento(1);
    expect(p.estado().pedidoPendente).toEqual({ valor: 6, dupla: 1 });
    p.responder(2, 'aceitar');
    expect(p.estado().valorMao).toBe(6);
  });

  test('CT-PARTIDA-25: qualquer jogador da dupla adversária responde pela dupla', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.pedirAumento(0);
    p.responder(3, 'aceitar');
    expect(p.estado().valorMao).toBe(3);
  });
});

describe('Partida completa', () => {
  test('CT-PARTIDA-26: partida completa até 12 com distribuição injetada', () => {
    const p = new Partida({ distribuicoes: Array.from({ length: 12 }, DOMINIO) });
    for (let mao = 1; mao <= 11; mao++) {
      jogarPrimeiras(p, 8);
      expect(p.estado().placar).toEqual([mao, 0]);
    }
    expect(p.estado().tipoMao).toBe('onze');
    p.decidirMaoDeOnze(2, 'jogar');
    jogarPrimeiras(p, 8);
    const e = p.estado();
    expect(e.placar).toEqual([12, 0]);
    expect(e.ultimaMao).toEqual({ vencedor: 0, pontos: 3 });
    expect(e.maosJogadas).toBe(12);
    expect(e.encerrada).toBe(true);
    expect(e.vencedor).toBe(0);
  });

  test('CT-PARTIDA-27: partida completa só com rng termina com uma dupla em 12', () => {
    const p = new Partida({ semente: 2026 });
    let passos = 0;
    while (!p.estado().encerrada && passos < 5000) {
      const e = p.estado();
      if (e.aguardandoDecisaoOnze) {
        p.decidirMaoDeOnze(e.duplaOnze, 'jogar');
      } else {
        p.jogar(e.vez, 0);
      }
      passos++;
    }
    const { placar, vencedor, encerrada } = p.estado();
    expect(encerrada).toBe(true);
    expect(placar[vencedor]).toBe(12);
    expect(placar[1 - vencedor]).toBeLessThan(12);
  });

  test('CT-PARTIDA-28: partida criada sem opções usa os valores padrão', () => {
    const e = new Partida().estado();
    expect(e.placar).toEqual([0, 0]);
    expect(e.vez).toBe(0);
    expect(e.tipoMao).toBe('normal');
  });

  test('CT-PARTIDA-29: placar inicial pode ser injetado', () => {
    const e = new Partida({ placarInicial: [10, 4], distribuicoes: [BASE()] }).estado();
    expect(e.placar).toEqual([10, 4]);
    expect(e.tipoMao).toBe('normal');
  });

  test('CT-PARTIDA-30: depois de um truco aceito, a mão seguinte volta a valer 1 e libera os pedidos', () => {
    const p = new Partida({ distribuicoes: [BASE(), BASE()] });
    p.pedirAumento(0);
    p.responder(1, 'aceitar');
    jogarCartas(p, VITORIA_DUPLA_0);
    const e = p.estado();
    expect(e.placar).toEqual([3, 0]);
    expect(e.maosJogadas).toBe(1);
    expect(e.valorMao).toBe(1);
    expect(e.pedidoPendente).toBeNull();
    jogarCartas(p, ['Ao']);
    p.pedirAumento(2);
    expect(p.estado().pedidoPendente).toEqual({ valor: 3, dupla: 0 });
  });

  test('CT-PARTIDA-31: truco aceito vencido com 10 pontos leva o placar a 12, sem passar', () => {
    const p = new Partida({ placarInicial: [10, 0], distribuicoes: [BASE()] });
    p.pedirAumento(0);
    p.responder(1, 'aceitar');
    jogarCartas(p, VITORIA_DUPLA_0);
    const e = p.estado();
    expect(e.placar).toEqual([12, 0]);
    expect(e.ultimaMao).toEqual({ vencedor: 0, pontos: 3 });
    expect(e.encerrada).toBe(true);
    expect(e.vencedor).toBe(0);
  });
});

describe('Mão de onze', () => {
  const onze = (placarInicial = [11, 7], distribuicoes = [BASE(), BASE()]) =>
    new Partida({ placarInicial, distribuicoes });

  test('CT-ONZE-01: só a dupla 0 com 11 pontos: a mão é de onze e aguarda a decisão dela', () => {
    const e = onze().estado();
    expect(e.tipoMao).toBe('onze');
    expect(e.aguardandoDecisaoOnze).toBe(true);
    expect(e.duplaOnze).toBe(0);
  });

  test('CT-ONZE-02: os parceiros com 11 veem as cartas um do outro; os adversários não', () => {
    const p = onze();
    expect(p.verCartas(0, 2)).toEqual(BASE().maos[2]);
    expect(p.verCartas(2, 0)).toEqual(BASE().maos[0]);
    expect(() => p.verCartas(1, 3)).toThrow(/não pode ver as cartas/);
    expect(() => p.verCartas(0, 1)).toThrow(/não pode ver as cartas/);
    expect(p.verCartas(3, 3)).toEqual(BASE().maos[3]);
  });

  test('CT-ONZE-03: se a dupla jogar, a mão vale 3 (adversário vence e marca 3)', () => {
    const p = onze();
    p.decidirMaoDeOnze(0, 'jogar');
    expect(p.estado().valorMao).toBe(3);
    expect(p.estado().aguardandoDecisaoOnze).toBe(false);
    jogarCartas(p, VITORIA_DUPLA_1);
    expect(p.estado().placar).toEqual([11, 10]);
  });

  test('CT-ONZE-04: a dupla com 11 que joga e vence chega a 12 (placar não passa de 12)', () => {
    const p = onze();
    p.decidirMaoDeOnze(2, 'jogar');
    jogarCartas(p, VITORIA_DUPLA_0);
    expect(p.estado().placar).toEqual([12, 7]);
    expect(p.estado().vencedor).toBe(0);
  });

  test('CT-ONZE-05: se a dupla correr, o adversário marca 1 e começa a próxima mão', () => {
    const p = onze();
    p.decidirMaoDeOnze(0, 'correr');
    const e = p.estado();
    expect(e.placar).toEqual([11, 8]);
    expect(e.ultimaMao).toEqual({ vencedor: 1, pontos: 1 });
    expect(e.carteador).toBe(0);
    expect(e.tipoMao).toBe('onze');
  });

  test('CT-ONZE-06: na mão de onze ninguém pode pedir aumento', () => {
    const p = onze();
    p.decidirMaoDeOnze(0, 'jogar');
    expect(() => p.pedirAumento(0)).toThrow(/não há aumento na mão de onze/);
    jogarCartas(p, ['3p']);
    expect(() => p.pedirAumento(1)).toThrow(/não há aumento na mão de onze/);
  });

  test('CT-ONZE-07: ninguém joga antes da decisão', () => {
    const p = onze();
    expect(() => p.jogar(0, 0)).toThrow(/decisão da mão de onze/);
  });

  test('CT-ONZE-08: só a dupla com 11 decide', () => {
    const p = onze();
    expect(() => p.decidirMaoDeOnze(1, 'jogar')).toThrow(/só a dupla com 11/);
  });

  test('CT-ONZE-09: decisão diferente de jogar ou correr gera erro', () => {
    expect(() => onze().decidirMaoDeOnze(0, 'aumentar')).toThrow(/decisão inválida/);
  });

  test('CT-ONZE-10: não há decisão fora da mão de onze nem depois de decidida', () => {
    const normal = new Partida({ distribuicoes: [BASE()] });
    expect(() => normal.decidirMaoDeOnze(0, 'jogar')).toThrow(/não há decisão de mão de onze/);
    const p = onze();
    p.decidirMaoDeOnze(0, 'jogar');
    expect(() => p.decidirMaoDeOnze(2, 'correr')).toThrow(/não há decisão de mão de onze/);
  });

  test('CT-ONZE-11: com a dupla 1 em 11, os jogadores 1 e 3 decidem e veem as cartas um do outro', () => {
    const p = onze([5, 11]);
    expect(p.estado().duplaOnze).toBe(1);
    expect(p.verCartas(1, 3)).toEqual(BASE().maos[3]);
    expect(() => p.verCartas(0, 2)).toThrow(/não pode ver as cartas/);
    p.decidirMaoDeOnze(3, 'correr');
    expect(p.estado().placar).toEqual([6, 11]);
  });

  test('CT-ONZE-12: correr da mão de onze com o adversário em 10 leva à mão de ferro', () => {
    const p = onze([11, 10]);
    p.decidirMaoDeOnze(0, 'correr');
    expect(p.estado().placar).toEqual([11, 11]);
    expect(p.estado().tipoMao).toBe('ferro');
  });

  test('CT-ONZE-13: na mão de onze a carta coberta continua permitida a partir da 2ª rodada', () => {
    const p = onze();
    p.decidirMaoDeOnze(0, 'jogar');
    jogarCartas(p, ['3p', '7o', '4p', '6c', '2p*', '6o', 'Qc*', 'Jc']);
    expect(p.estado().resultadosRodadas).toEqual([0, 1]);
  });

  test('CT-ONZE-14: o adversário com 10 que vence a mão de onze chega a 12, sem passar', () => {
    const p = onze([11, 10]);
    p.decidirMaoDeOnze(0, 'jogar');
    jogarCartas(p, VITORIA_DUPLA_1);
    const e = p.estado();
    expect(e.placar).toEqual([11, 12]);
    expect(e.ultimaMao).toEqual({ vencedor: 1, pontos: 3 });
    expect(e.encerrada).toBe(true);
    expect(e.vencedor).toBe(1);
  });
});

describe('Mão de ferro', () => {
  const ferro = (distribuicoes = [BASE()]) => new Partida({ placarInicial: [11, 11], distribuicoes });

  test('CT-FERRO-01: com 11 a 11 a mão é de ferro, vale 1 e não espera decisão', () => {
    const e = ferro().estado();
    expect(e.tipoMao).toBe('ferro');
    expect(e.valorMao).toBe(1);
    expect(e.aguardandoDecisaoOnze).toBe(false);
    expect(e.duplaOnze).toBeNull();
  });

  test('CT-FERRO-02: ninguém vê as próprias cartas nem as do parceiro', () => {
    const p = ferro();
    expect(() => p.verCartas(0, 0)).toThrow(/não pode ver as cartas/);
    expect(() => p.verCartas(1, 3)).toThrow(/não pode ver as cartas/);
  });

  test('CT-FERRO-03: jogando pela posição, quem vence a mão vence a partida', () => {
    const p = ferro();
    jogarPrimeiras(p, 8);
    const e = p.estado();
    expect(e.placar).toEqual([12, 11]);
    expect(e.ultimaMao).toEqual({ vencedor: 0, pontos: 1 });
    expect(e.encerrada).toBe(true);
    expect(e.vencedor).toBe(0);
  });

  test('CT-FERRO-04: não há pedido de aumento', () => {
    expect(() => ferro().pedirAumento(0)).toThrow(/não há aumento na mão de ferro/);
  });

  test('CT-FERRO-05: não há carta coberta, nem a partir da 2ª rodada', () => {
    const p = ferro();
    jogarPrimeiras(p, 4);
    expect(() => p.jogar(p.estado().vez, 0, { coberta: true })).toThrow(/mão de ferro/);
  });

  test('CT-FERRO-06: se as três rodadas empatarem, joga-se outra mão de ferro', () => {
    const p = ferro([EMPATES(), BASE()]);
    jogarPrimeiras(p, 12);
    const e = p.estado();
    expect(e.placar).toEqual([11, 11]);
    expect(e.ultimaMao).toEqual({ vencedor: null, pontos: 0 });
    expect(e.tipoMao).toBe('ferro');
    expect(e.carteador).toBe(0);
    expect(e.encerrada).toBe(false);
  });

  test('CT-FERRO-07: se a dupla 1 vence a mão de ferro, ela vence a partida', () => {
    // Mãos do DOMINIO trocadas entre as duplas: a dupla 1 fica com as quatro manilhas.
    const d = DOMINIO();
    const p = ferro([{ maos: [d.maos[1], d.maos[0], d.maos[3], d.maos[2]], vira: d.vira }]);
    jogarPrimeiras(p, 8);
    const e = p.estado();
    expect(e.placar).toEqual([11, 12]);
    expect(e.ultimaMao).toEqual({ vencedor: 1, pontos: 1 });
    expect(e.encerrada).toBe(true);
    expect(e.vencedor).toBe(1);
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

  test('CT-ERRO-09: pedir aumento fora da vez gera erro', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    expect(() => p.pedirAumento(1)).toThrow(/não é a vez/);
    expect(() => p.pedirAumento(2)).toThrow(/não é a vez/);
  });

  test('CT-ERRO-10: ninguém joga carta com pedido pendente', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.pedirAumento(0);
    expect(() => p.jogar(0, c('3p'))).toThrow(/pedido de aumento pendente/);
  });

  test('CT-ERRO-11: a dupla que pediu não responde o próprio pedido', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.pedirAumento(0);
    expect(() => p.responder(2, 'aceitar')).toThrow(/dupla adversária/);
  });

  test('CT-ERRO-12: responder sem pedido pendente gera erro', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    expect(() => p.responder(1, 'aceitar')).toThrow(/não há pedido pendente/);
  });

  test('CT-ERRO-13: não há aumento acima de 12', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.pedirAumento(0);
    p.responder(1, 'aumentar');
    p.responder(0, 'aumentar');
    p.responder(1, 'aumentar');
    expect(() => p.responder(0, 'aumentar')).toThrow(/acima de 12/);
    p.responder(0, 'aceitar');
    jogarCartas(p, ['3p', '7o']);
    expect(() => p.pedirAumento(2)).toThrow(/acima de 12/);
  });

  test('CT-ERRO-14: pedir aumento com pedido pendente gera erro', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.pedirAumento(0);
    expect(() => p.pedirAumento(0)).toThrow(/pedido pendente/);
  });

  test('CT-ERRO-15: agir com a partida encerrada gera erro', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    p.pedirAumento(0);
    p.responder(1, 'aumentar');
    p.responder(0, 'aumentar');
    p.responder(1, 'aumentar');
    p.responder(0, 'aceitar');
    jogarCartas(p, ['3p', '7o', '4p', '6c', '2p', '6o', 'Qc', 'Jc']);
    expect(p.estado().encerrada).toBe(true);
    expect(() => p.jogar(0, 0)).toThrow(/partida está encerrada/);
    expect(() => p.pedirAumento(0)).toThrow(/partida está encerrada/);
    expect(() => p.responder(1, 'aceitar')).toThrow(/partida está encerrada/);
  });

  test('CT-ERRO-16: placar inicial inválido gera erro', () => {
    expect(() => new Partida({ placarInicial: [12, 0] })).toThrow(/placar inicial inválido/);
    expect(() => new Partida({ placarInicial: [-1, 0] })).toThrow(/placar inicial inválido/);
    expect(() => new Partida({ placarInicial: [3] })).toThrow(/placar inicial inválido/);
  });

  test('CT-ERRO-17: decidir a mão de onze com a partida encerrada gera erro', () => {
    const p = new Partida({ placarInicial: [11, 3], distribuicoes: [BASE()] });
    p.decidirMaoDeOnze(0, 'jogar');
    jogarCartas(p, VITORIA_DUPLA_0);
    expect(p.estado().encerrada).toBe(true);
    expect(() => p.decidirMaoDeOnze(0, 'jogar')).toThrow(/partida está encerrada/);
  });

  test('CT-ERRO-18: jogar sem informar a carta gera erro e nada muda', () => {
    const p = new Partida({ distribuicoes: [BASE()] });
    expect(() => p.jogar(0, undefined)).toThrow(/carta não informada/);
    expect(() => p.jogar(0, null)).toThrow(/carta não informada/);
    expect(p.verCartas(0, 0)).toHaveLength(3);
    expect(p.estado().vez).toBe(0);
  });

  test('CT-ERRO-19: distribuicoes que não é lista gera erro', () => {
    expect(() => new Partida({ distribuicoes: 5 })).toThrow(/distribuicoes deve ser uma lista/);
    expect(() => new Partida({ distribuicoes: BASE() })).toThrow(/distribuicoes deve ser uma lista/);
  });
});

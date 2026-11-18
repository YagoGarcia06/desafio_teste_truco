const { cartaDeTexto: c } = require('../src/baralho');
const {
  manilhaDaVira,
  ehManilha,
  nomeManilha,
  forcaCarta,
  compararCartas,
} = require('../src/forca');

describe('Manilha a partir da vira', () => {
  test.each([
    ['CT-MANILHA-01', '4o', '5'],
    ['CT-MANILHA-02', '5o', '6'],
    ['CT-MANILHA-03', '6o', '7'],
    ['CT-MANILHA-04', '7o', 'Q'],
    ['CT-MANILHA-05', 'Qo', 'J'],
    ['CT-MANILHA-06', 'Jo', 'K'],
    ['CT-MANILHA-07', 'Ko', 'A'],
    ['CT-MANILHA-08', 'Ao', '2'],
    ['CT-MANILHA-09', '2o', '3'],
    ['CT-MANILHA-10', '3o', '4'],
  ])('%s: vira %s faz a manilha ser %s', (_id, vira, manilha) => {
    expect(manilhaDaVira(c(vira))).toBe(manilha);
    expect(ehManilha({ valor: manilha, naipe: 'copas' }, c(vira))).toBe(true);
  });

  test('CT-MANILHA-11: a própria vira não é manilha', () => {
    const vira = c('7o');
    expect(ehManilha(c('7p'), vira)).toBe(false);
    expect(ehManilha(c('Qp'), vira)).toBe(true);
    expect(forcaCarta(c('7p'), vira)).toBeLessThan(forcaCarta(c('Qo'), vira));
  });

  test('CT-MANILHA-12: ordem das manilhas é paus > copas > espadas > ouros', () => {
    const vira = c('4o');
    const ordem = ['5p', '5c', '5e', '5o'].map((t) => forcaCarta(c(t), vira));
    expect(ordem[0]).toBeGreaterThan(ordem[1]);
    expect(ordem[1]).toBeGreaterThan(ordem[2]);
    expect(ordem[2]).toBeGreaterThan(ordem[3]);
  });

  test('CT-MANILHA-13: nomes das manilhas: zap, copeta, espadilha e pica-fumo', () => {
    const vira = c('Ko');
    expect(nomeManilha(c('Ap'), vira)).toBe('zap');
    expect(nomeManilha(c('Ac'), vira)).toBe('copeta');
    expect(nomeManilha(c('Ae'), vira)).toBe('espadilha');
    expect(nomeManilha(c('Ao'), vira)).toBe('pica-fumo');
  });

  test('CT-MANILHA-14: carta comum não tem nome de manilha', () => {
    expect(nomeManilha(c('3p'), c('Ko'))).toBeNull();
  });

  test('CT-MANILHA-15: a manilha mais fraca (pica-fumo) vence a comum mais forte (3)', () => {
    const vira = c('Qe');
    expect(compararCartas(c('Jo'), c('3p'), vira)).toBe(1);
  });

  test('CT-MANILHA-16: com vira 3, o 4 vira manilha e vence o 3', () => {
    const vira = c('3o');
    expect(compararCartas(c('4o'), c('3p'), vira)).toBe(1);
    expect(compararCartas(c('3p'), c('4o'), vira)).toBe(-1);
  });

  test('CT-MANILHA-17: rejeita vira inválida', () => {
    expect(() => manilhaDaVira({ valor: '8', naipe: 'ouros' })).toThrow(/valor inválido/);
    expect(() => manilhaDaVira(undefined)).toThrow(/vira/);
  });
});

describe('Força das cartas comuns', () => {
  test('CT-FORCA-01: ordem comum 5 < 6 < 7 < Q < J < K < A < 2 < 3 (vira 3, manilha 4)', () => {
    const vira = c('3o');
    const forcas = ['5p', '6p', '7p', 'Qp', 'Jp', 'Kp', 'Ap', '2p', '3p'].map((t) => forcaCarta(c(t), vira));
    for (let i = 1; i < forcas.length; i++) {
      expect(forcas[i]).toBeGreaterThan(forcas[i - 1]);
    }
  });

  test('CT-FORCA-02: ordem comum 4 < 5 < 6 < 7 < Q < J < K < A < 2 (vira 2, manilha 3)', () => {
    const vira = c('2o');
    const forcas = ['4p', '5p', '6p', '7p', 'Qp', 'Jp', 'Kp', 'Ap', '2p'].map((t) => forcaCarta(c(t), vira));
    for (let i = 1; i < forcas.length; i++) {
      expect(forcas[i]).toBeGreaterThan(forcas[i - 1]);
    }
  });

  test('CT-FORCA-03: entre comuns, o naipe não importa (A de ouros empata com A de paus)', () => {
    const vira = c('4o');
    expect(compararCartas(c('Ao'), c('Ap'), vira)).toBe(0);
    expect(forcaCarta(c('Ao'), vira)).toBe(forcaCarta(c('Ap'), vira));
  });

  test('CT-FORCA-04: compararCartas indica a carta mais forte', () => {
    const vira = c('4o');
    expect(compararCartas(c('3o'), c('2p'), vira)).toBe(1);
    expect(compararCartas(c('2p'), c('3o'), vira)).toBe(-1);
  });

  test('CT-FORCA-05: manilha contra manilha decide pelo naipe', () => {
    const vira = c('6c');
    expect(compararCartas(c('7p'), c('7c'), vira)).toBe(1);
    expect(compararCartas(c('7o'), c('7e'), vira)).toBe(-1);
  });

  test('CT-FORCA-06: carta coberta vale zero e perde para a carta aberta mais fraca', () => {
    const vira = c('3o');
    expect(forcaCarta(c('Ap'), vira, true)).toBe(0);
    expect(forcaCarta(c('5o'), vira)).toBeGreaterThan(forcaCarta(c('4p'), vira, true));
    expect(forcaCarta(c('5o'), vira, false)).toBe(forcaCarta(c('5o'), vira));
  });

  test('CT-FORCA-07: rejeita carta inválida', () => {
    expect(() => forcaCarta({ valor: '10', naipe: 'paus' }, c('4o'))).toThrow(/valor inválido/);
  });
});

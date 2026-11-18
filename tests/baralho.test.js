const { criarRng } = require('../src/rng');
const {
  VALORES,
  NAIPES,
  criarCarta,
  cartaDeTexto,
  cartasIguais,
  criarBaralho,
  embaralhar,
  distribuir,
  validarDistribuicao,
} = require('../src/baralho');

const textos = (cartas) => cartas.map((c) => `${c.valor}-${c.naipe}`);

function distribuicaoValida() {
  return {
    maos: [
      [cartaDeTexto('4o'), cartaDeTexto('5o'), cartaDeTexto('6o')],
      [cartaDeTexto('4e'), cartaDeTexto('5e'), cartaDeTexto('6e')],
      [cartaDeTexto('4c'), cartaDeTexto('5c'), cartaDeTexto('6c')],
      [cartaDeTexto('4p'), cartaDeTexto('5p'), cartaDeTexto('6p')],
    ],
    vira: cartaDeTexto('7o'),
  };
}

describe('Baralho', () => {
  test('CT-BARALHO-01: baralho tem 40 cartas', () => {
    expect(criarBaralho()).toHaveLength(40);
  });

  test('CT-BARALHO-02: baralho não tem 8, 9, 10 nem curingas', () => {
    const valores = new Set(criarBaralho().map((c) => c.valor));
    expect([...valores].sort()).toEqual(['2', '3', '4', '5', '6', '7', 'A', 'J', 'K', 'Q']);
    expect(valores.has('8')).toBe(false);
    expect(valores.has('9')).toBe(false);
    expect(valores.has('10')).toBe(false);
  });

  test('CT-BARALHO-03: cada valor aparece uma vez em cada um dos 4 naipes', () => {
    const baralho = criarBaralho();
    expect(new Set(textos(baralho)).size).toBe(40);
    for (const valor of VALORES) {
      const naipes = baralho.filter((c) => c.valor === valor).map((c) => c.naipe);
      expect(naipes.sort()).toEqual([...NAIPES].sort());
    }
  });
});

describe('Cartas', () => {
  test('CT-BARALHO-04: cria carta válida', () => {
    expect(criarCarta('A', 'paus')).toEqual({ valor: 'A', naipe: 'paus' });
  });

  test('CT-BARALHO-05: rejeita valor fora do baralho (8)', () => {
    expect(() => criarCarta('8', 'paus')).toThrow(/valor inválido/);
  });

  test('CT-BARALHO-06: rejeita naipe inexistente', () => {
    expect(() => criarCarta('A', 'estrelas')).toThrow(/naipe inválido/);
  });

  test('CT-BARALHO-07: converte texto curto em carta', () => {
    expect(cartaDeTexto('Ap')).toEqual({ valor: 'A', naipe: 'paus' });
    expect(cartaDeTexto('Qc')).toEqual({ valor: 'Q', naipe: 'copas' });
    expect(cartaDeTexto('2e')).toEqual({ valor: '2', naipe: 'espadas' });
    expect(cartaDeTexto('7o')).toEqual({ valor: '7', naipe: 'ouros' });
  });

  test('CT-BARALHO-08: rejeita texto de carta inválido', () => {
    expect(() => cartaDeTexto('A')).toThrow(/texto de carta inválido/);
    expect(() => cartaDeTexto('Ax')).toThrow(/texto de carta inválido/);
    expect(() => cartaDeTexto('8p')).toThrow(/valor inválido/);
    expect(() => cartaDeTexto(12)).toThrow(/texto de carta inválido/);
  });

  test('CT-BARALHO-09: compara cartas por valor e naipe', () => {
    expect(cartasIguais(cartaDeTexto('Ap'), { valor: 'A', naipe: 'paus' })).toBe(true);
    expect(cartasIguais(cartaDeTexto('Ap'), cartaDeTexto('Ao'))).toBe(false);
    expect(cartasIguais(cartaDeTexto('Ap'), cartaDeTexto('2p'))).toBe(false);
  });
});

describe('Gerador com semente (rng)', () => {
  test('CT-BARALHO-10: mesma semente gera a mesma sequência', () => {
    const a = criarRng(42);
    const b = criarRng(42);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  test('CT-BARALHO-11: valores ficam no intervalo [0, 1)', () => {
    const rng = criarRng(0);
    for (let i = 0; i < 1000; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  test('CT-BARALHO-12: sementes diferentes geram sequências diferentes', () => {
    const a = criarRng(1);
    const b = criarRng(2);
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()]);
  });

  test('CT-BARALHO-13: rejeita semente que não é inteiro', () => {
    expect(() => criarRng('abc')).toThrow(/semente/);
    expect(() => criarRng(1.5)).toThrow(/semente/);
  });
});

describe('Embaralhar', () => {
  test('CT-BARALHO-14: embaralhar com a mesma semente dá a mesma ordem e não altera o original', () => {
    const baralho = criarBaralho();
    const copia = textos(baralho);
    const a = embaralhar(baralho, criarRng(7));
    const b = embaralhar(baralho, criarRng(7));
    expect(textos(a)).toEqual(textos(b));
    expect(textos(a)).not.toEqual(copia);
    expect(textos(baralho)).toEqual(copia);
    expect([...textos(a)].sort()).toEqual([...copia].sort());
  });

  test('CT-BARALHO-15: rng injetado que sempre sorteia o último índice mantém a ordem', () => {
    const baralho = criarBaralho();
    const resultado = embaralhar(baralho, () => 0.999999);
    expect(textos(resultado)).toEqual(textos(baralho));
  });

  test('CT-BARALHO-16: rejeita rng que não é função', () => {
    expect(() => embaralhar(criarBaralho(), 42)).toThrow(/rng/);
  });
});

describe('Distribuir', () => {
  test('CT-BARALHO-17: com carteador 3, distribui uma a uma a partir do jogador 0 e a 13ª carta é a vira', () => {
    const baralho = criarBaralho();
    const { maos, vira } = distribuir(baralho, 3);
    expect(maos).toHaveLength(4);
    maos.forEach((mao) => expect(mao).toHaveLength(3));
    expect(textos(maos[0])).toEqual(textos([baralho[0], baralho[4], baralho[8]]));
    expect(textos(maos[3])).toEqual(textos([baralho[3], baralho[7], baralho[11]]));
    expect(vira).toEqual(baralho[12]);
  });

  test('CT-BARALHO-18: com carteador 1, a primeira carta vai para o jogador 2', () => {
    const baralho = criarBaralho();
    const { maos } = distribuir(baralho, 1);
    expect(maos[2][0]).toEqual(baralho[0]);
    expect(maos[1][0]).toEqual(baralho[3]);
  });

  test('CT-BARALHO-19: rejeita carteador fora de 0 a 3', () => {
    expect(() => distribuir(criarBaralho(), 4)).toThrow(/carteador inválido/);
    expect(() => distribuir(criarBaralho(), -1)).toThrow(/carteador inválido/);
  });

  test('CT-BARALHO-20: aceita baralho com exatamente 13 cartas e rejeita com 12', () => {
    const baralho = criarBaralho();
    expect(distribuir(baralho.slice(0, 13), 0).vira).toEqual(baralho[12]);
    expect(() => distribuir(baralho.slice(0, 12), 0)).toThrow(/cartas insuficientes/);
  });
});

describe('Validar distribuição injetada', () => {
  test('CT-BARALHO-21: aceita distribuição com 4 mãos de 3 cartas e vira', () => {
    expect(() => validarDistribuicao(distribuicaoValida())).not.toThrow();
    expect(validarDistribuicao(distribuicaoValida())).toBe(true);
  });

  test('CT-BARALHO-22: rejeita distribuição sem 4 mãos', () => {
    const d = distribuicaoValida();
    d.maos.pop();
    expect(() => validarDistribuicao(d)).toThrow(/4 mãos/);
    expect(() => validarDistribuicao({ vira: d.vira })).toThrow(/4 mãos/);
  });

  test('CT-BARALHO-23: rejeita mão com quantidade diferente de 3 cartas', () => {
    const d = distribuicaoValida();
    d.maos[1].pop();
    expect(() => validarDistribuicao(d)).toThrow(/3 cartas/);
  });

  test('CT-BARALHO-24: rejeita carta repetida, inclusive repetição da vira', () => {
    const d = distribuicaoValida();
    d.maos[0][0] = cartaDeTexto('4p');
    expect(() => validarDistribuicao(d)).toThrow(/carta repetida/);
    const d2 = distribuicaoValida();
    d2.vira = cartaDeTexto('6c');
    expect(() => validarDistribuicao(d2)).toThrow(/carta repetida/);
  });

  test('CT-BARALHO-25: rejeita carta inválida na distribuição', () => {
    const d = distribuicaoValida();
    d.maos[2][1] = { valor: '9', naipe: 'copas' };
    expect(() => validarDistribuicao(d)).toThrow(/valor inválido/);
  });

  test('CT-BARALHO-26: rejeita distribuição sem vira', () => {
    const d = distribuicaoValida();
    delete d.vira;
    expect(() => validarDistribuicao(d)).toThrow(/vira/);
  });
});

// Valores em ordem de força (do mais fraco para o mais forte).
const VALORES = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
// Naipes em ordem de força das manilhas (pica-fumo, espadilha, copeta, zap).
const NAIPES = ['ouros', 'espadas', 'copas', 'paus'];
const NAIPE_POR_LETRA = { o: 'ouros', e: 'espadas', c: 'copas', p: 'paus' };

const JOGADORES = 4;
const CARTAS_POR_MAO = 3;

function criarCarta(valor, naipe) {
  if (!VALORES.includes(valor)) {
    throw new Error(`valor inválido: ${valor}`);
  }
  if (!NAIPES.includes(naipe)) {
    throw new Error(`naipe inválido: ${naipe}`);
  }
  return { valor, naipe };
}

// Texto curto: valor + inicial do naipe (ex.: 'Ap' = A de paus, '7o' = 7 de ouros).
function cartaDeTexto(texto) {
  if (typeof texto !== 'string' || texto.length !== 2 || !NAIPE_POR_LETRA[texto[1]]) {
    throw new Error(`texto de carta inválido: ${texto}`);
  }
  return criarCarta(texto[0], NAIPE_POR_LETRA[texto[1]]);
}

function cartasIguais(a, b) {
  return a.valor === b.valor && a.naipe === b.naipe;
}

function criarBaralho() {
  const baralho = [];
  for (const naipe of NAIPES) {
    for (const valor of VALORES) {
      baralho.push(criarCarta(valor, naipe));
    }
  }
  return baralho;
}

// Fisher-Yates sobre uma cópia, para não alterar o baralho recebido.
function embaralhar(baralho, rng) {
  if (typeof rng !== 'function') {
    throw new Error('rng deve ser uma função');
  }
  const cartas = [...baralho];
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
  }
  return cartas;
}

function validarJogador(jogador, nome) {
  if (!Number.isInteger(jogador) || jogador < 0 || jogador >= JOGADORES) {
    throw new Error(`${nome} inválido: ${jogador}`);
  }
}

function distribuir(baralho, carteador) {
  validarJogador(carteador, 'carteador');
  const necessarias = JOGADORES * CARTAS_POR_MAO + 1;
  if (baralho.length < necessarias) {
    throw new Error(`cartas insuficientes: são necessárias ${necessarias}`);
  }
  const maos = [[], [], [], []];
  for (let i = 0; i < JOGADORES * CARTAS_POR_MAO; i++) {
    maos[(carteador + 1 + i) % JOGADORES].push(baralho[i]);
  }
  return { maos, vira: baralho[JOGADORES * CARTAS_POR_MAO] };
}

function validarDistribuicao({ maos, vira }) {
  if (!Array.isArray(maos) || maos.length !== JOGADORES) {
    throw new Error('a distribuição deve ter 4 mãos');
  }
  if (!vira) {
    throw new Error('a distribuição deve ter uma vira');
  }
  const vistas = new Set();
  const registrar = (carta) => {
    criarCarta(carta.valor, carta.naipe);
    const chave = `${carta.valor}-${carta.naipe}`;
    if (vistas.has(chave)) {
      throw new Error(`carta repetida na distribuição: ${chave}`);
    }
    vistas.add(chave);
  };
  for (const mao of maos) {
    if (mao.length !== CARTAS_POR_MAO) {
      throw new Error('cada mão deve ter 3 cartas');
    }
    mao.forEach(registrar);
  }
  registrar(vira);
  return true;
}

module.exports = {
  VALORES,
  NAIPES,
  JOGADORES,
  CARTAS_POR_MAO,
  criarCarta,
  cartaDeTexto,
  cartasIguais,
  criarBaralho,
  embaralhar,
  validarJogador,
  distribuir,
  validarDistribuicao,
};

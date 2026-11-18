const { VALORES, NAIPES, criarCarta } = require('./baralho');

const NOMES_MANILHA = { paus: 'zap', copas: 'copeta', espadas: 'espadilha', ouros: 'pica-fumo' };
const FORCA_MANILHA_BASE = VALORES.length + 1;

function validar(carta, nome) {
  if (!carta) {
    throw new Error(`${nome} não informada`);
  }
  criarCarta(carta.valor, carta.naipe);
}

function manilhaDaVira(vira) {
  validar(vira, 'vira');
  const indice = VALORES.indexOf(vira.valor);
  return VALORES[(indice + 1) % VALORES.length];
}

function ehManilha(carta, vira) {
  return carta.valor === manilhaDaVira(vira);
}

function nomeManilha(carta, vira) {
  return ehManilha(carta, vira) ? NOMES_MANILHA[carta.naipe] : null;
}

// Coberta = 0; comuns = 1 a 10; manilhas = 11 (ouros) a 14 (paus).
function forcaCarta(carta, vira, coberta = false) {
  validar(carta, 'carta');
  if (coberta) {
    return 0;
  }
  if (ehManilha(carta, vira)) {
    return FORCA_MANILHA_BASE + NAIPES.indexOf(carta.naipe);
  }
  return VALORES.indexOf(carta.valor) + 1;
}

function compararCartas(a, b, vira) {
  return Math.sign(forcaCarta(a, vira) - forcaCarta(b, vira));
}

module.exports = { manilhaDaVira, ehManilha, nomeManilha, forcaCarta, compararCartas };

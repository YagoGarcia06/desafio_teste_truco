// Gerador mulberry32: mesma semente, mesma sequência de números em [0, 1).
function criarRng(semente) {
  if (!Number.isInteger(semente)) {
    throw new Error('semente deve ser um número inteiro');
  }
  let estado = semente >>> 0;
  return function () {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

module.exports = { criarRng };

const ESCADA = [1, 3, 6, 9, 12];
const NOMES_APOSTA = { 3: 'truco', 6: 'seis', 9: 'nove', 12: 'doze' };
const RESPOSTAS = ['aceitar', 'correr', 'aumentar'];

function indiceNaEscada(valor) {
  const indice = ESCADA.indexOf(valor);
  if (indice === -1) {
    throw new Error(`valor de aposta inválido: ${valor}`);
  }
  return indice;
}

function proximoValor(valor) {
  const indice = indiceNaEscada(valor);
  if (indice === ESCADA.length - 1) {
    throw new Error('não há aumento acima de 12');
  }
  return ESCADA[indice + 1];
}

function valorAoCorrer(valorPedido) {
  const indice = indiceNaEscada(valorPedido);
  if (indice === 0) {
    throw new Error('1 não é um pedido de aumento');
  }
  return ESCADA[indice - 1];
}

function validarDupla(dupla) {
  if (dupla !== 0 && dupla !== 1) {
    throw new Error(`dupla inválida: ${dupla}`);
  }
}

function criarAposta() {
  return { valor: 1, pendente: null, duplaQuePodeAumentar: null };
}

function pedirAumento(aposta, dupla) {
  validarDupla(dupla);
  if (aposta.pendente) {
    throw new Error('há pedido pendente: responda antes de pedir outro aumento');
  }
  if (aposta.duplaQuePodeAumentar !== null && aposta.duplaQuePodeAumentar !== dupla) {
    throw new Error('só a dupla que aceitou o último aumento pode pedir o próximo');
  }
  return { ...aposta, pendente: { valor: proximoValor(aposta.valor), dupla } };
}

// Devolve a nova aposta e, se a dupla correu, quem ganhou e quantos pontos.
function responder(aposta, dupla, resposta) {
  validarDupla(dupla);
  const { pendente } = aposta;
  if (!pendente) {
    throw new Error('não há pedido pendente');
  }
  if (dupla === pendente.dupla) {
    throw new Error('só a dupla adversária responde ao pedido');
  }
  if (!RESPOSTAS.includes(resposta)) {
    throw new Error(`resposta inválida: ${resposta}`);
  }
  if (resposta === 'correr') {
    return { aposta, correu: { vencedor: pendente.dupla, pontos: valorAoCorrer(pendente.valor) } };
  }
  const aceita = { valor: pendente.valor, pendente: null, duplaQuePodeAumentar: dupla };
  if (resposta === 'aceitar') {
    return { aposta: aceita, correu: null };
  }
  return { aposta: pedirAumento(aceita, dupla), correu: null };
}

module.exports = {
  ESCADA,
  NOMES_APOSTA,
  proximoValor,
  valorAoCorrer,
  criarAposta,
  pedirAumento,
  responder,
};

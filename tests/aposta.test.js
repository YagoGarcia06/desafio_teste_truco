const {
  NOMES_APOSTA,
  proximoValor,
  valorAoCorrer,
  criarAposta,
  pedirAumento,
  responder,
} = require('../src/aposta');

// Monta um pedido pendente do valor indicado, alternando pedidos e aceites.
// Devolve a aposta e a dupla que fez o último pedido.
function chegarAoPedido(valor) {
  let aposta = criarAposta();
  let dupla = 0;
  for (let v = proximoValor(1); ; v = proximoValor(v)) {
    aposta = pedirAumento(aposta, dupla);
    if (v === valor) return { aposta, pediu: dupla };
    aposta = responder(aposta, 1 - dupla, 'aceitar').aposta;
    dupla = 1 - dupla;
  }
}

describe('Escada de aumentos', () => {
  test('CT-APOSTA-01: a mão começa valendo 1, sem pedido pendente', () => {
    expect(criarAposta()).toEqual({ valor: 1, pendente: null, duplaQuePodeAumentar: null });
  });

  test('CT-APOSTA-02: aumentos seguem truco (3), seis (6), nove (9) e doze (12)', () => {
    expect([1, 3, 6, 9].map(proximoValor)).toEqual([3, 6, 9, 12]);
    expect(NOMES_APOSTA).toEqual({ 3: 'truco', 6: 'seis', 9: 'nove', 12: 'doze' });
  });

  test('CT-APOSTA-03: não há aumento acima de 12', () => {
    expect(() => proximoValor(12)).toThrow(/acima de 12/);
  });

  test('CT-APOSTA-04: rejeita valor de aposta fora da escada', () => {
    expect(() => proximoValor(2)).toThrow(/valor de aposta inválido/);
    expect(() => valorAoCorrer(4)).toThrow(/valor de aposta inválido/);
  });

  test('CT-APOSTA-05: correr dá a quem pediu o valor anterior da escada', () => {
    expect([3, 6, 9, 12].map(valorAoCorrer)).toEqual([1, 3, 6, 9]);
  });

  test('CT-APOSTA-06: não existe valor anterior a 1', () => {
    expect(() => valorAoCorrer(1)).toThrow(/não é um pedido de aumento/);
  });

  test('CT-APOSTA-07: pedir aumento deixa o pedido pendente sem mudar o valor', () => {
    const aposta = pedirAumento(criarAposta(), 1);
    expect(aposta.valor).toBe(1);
    expect(aposta.pendente).toEqual({ valor: 3, dupla: 1 });
  });
});

describe('Respostas em cada nível', () => {
  test.each([
    ['CT-APOSTA-08', 3],
    ['CT-APOSTA-09', 6],
    ['CT-APOSTA-10', 9],
    ['CT-APOSTA-11', 12],
  ])('%s: aceitar o pedido de %i faz a mão valer esse valor', (_id, valor) => {
    const { aposta, pediu } = chegarAoPedido(valor);
    const r = responder(aposta, 1 - pediu, 'aceitar');
    expect(r.correu).toBeNull();
    expect(r.aposta).toEqual({ valor, pendente: null, duplaQuePodeAumentar: 1 - pediu });
  });

  test.each([
    ['CT-APOSTA-12', 3, 1],
    ['CT-APOSTA-13', 6, 3],
    ['CT-APOSTA-14', 9, 6],
    ['CT-APOSTA-15', 12, 9],
  ])('%s: correr do pedido de %i encerra a mão e dá %i a quem pediu', (_id, valor, pontos) => {
    const { aposta, pediu } = chegarAoPedido(valor);
    const r = responder(aposta, 1 - pediu, 'correr');
    expect(r.correu).toEqual({ vencedor: pediu, pontos });
  });

  test.each([
    ['CT-APOSTA-16', 3, 6],
    ['CT-APOSTA-17', 6, 9],
    ['CT-APOSTA-18', 9, 12],
  ])('%s: aumentar o pedido de %i aceita esse valor e pede %i para a outra dupla', (_id, valor, novo) => {
    const { aposta, pediu } = chegarAoPedido(valor);
    const r = responder(aposta, 1 - pediu, 'aumentar');
    expect(r.correu).toBeNull();
    expect(r.aposta.valor).toBe(valor);
    expect(r.aposta.pendente).toEqual({ valor: novo, dupla: 1 - pediu });
  });

  test('CT-APOSTA-19: aumentar o pedido de doze gera erro', () => {
    const { aposta, pediu } = chegarAoPedido(12);
    expect(() => responder(aposta, 1 - pediu, 'aumentar')).toThrow(/acima de 12/);
  });

  test('CT-APOSTA-20: truco aumentado para seis e corrido dá 3 pontos a quem aumentou', () => {
    let aposta = pedirAumento(criarAposta(), 0);
    aposta = responder(aposta, 1, 'aumentar').aposta;
    const r = responder(aposta, 0, 'correr');
    expect(r.correu).toEqual({ vencedor: 1, pontos: 3 });
  });

  test('CT-APOSTA-21: aumento aceito depois de uma réplica libera o próximo pedido para quem aceitou', () => {
    let aposta = pedirAumento(criarAposta(), 0);
    aposta = responder(aposta, 1, 'aumentar').aposta;
    aposta = responder(aposta, 0, 'aceitar').aposta;
    expect(aposta).toEqual({ valor: 6, pendente: null, duplaQuePodeAumentar: 0 });
    expect(() => pedirAumento(aposta, 1)).toThrow(/só a dupla que aceitou/);
    expect(pedirAumento(aposta, 0).pendente).toEqual({ valor: 9, dupla: 0 });
  });
});

describe('Restrições dos pedidos', () => {
  test('CT-APOSTA-22: depois de aceito, só a dupla que aceitou pode pedir o próximo aumento', () => {
    let aposta = pedirAumento(criarAposta(), 0);
    aposta = responder(aposta, 1, 'aceitar').aposta;
    expect(() => pedirAumento(aposta, 0)).toThrow(/só a dupla que aceitou/);
    expect(pedirAumento(aposta, 1).pendente).toEqual({ valor: 6, dupla: 1 });
  });

  test('CT-APOSTA-23: não pode pedir aumento com pedido pendente', () => {
    const aposta = pedirAumento(criarAposta(), 0);
    expect(() => pedirAumento(aposta, 1)).toThrow(/pedido pendente/);
  });

  test('CT-APOSTA-24: a dupla que pediu não pode responder o próprio pedido', () => {
    const aposta = pedirAumento(criarAposta(), 0);
    expect(() => responder(aposta, 0, 'aceitar')).toThrow(/dupla adversária/);
  });

  test('CT-APOSTA-25: responder sem pedido pendente gera erro', () => {
    expect(() => responder(criarAposta(), 1, 'aceitar')).toThrow(/não há pedido pendente/);
  });

  test('CT-APOSTA-26: resposta diferente de aceitar, correr ou aumentar gera erro', () => {
    const aposta = pedirAumento(criarAposta(), 0);
    expect(() => responder(aposta, 1, 'talvez')).toThrow(/resposta inválida/);
  });

  test('CT-APOSTA-27: com doze aceito não há novo pedido', () => {
    const { aposta, pediu } = chegarAoPedido(12);
    const aceita = responder(aposta, 1 - pediu, 'aceitar').aposta;
    expect(() => pedirAumento(aceita, 1 - pediu)).toThrow(/acima de 12/);
  });

  test('CT-APOSTA-28: rejeita dupla diferente de 0 e 1', () => {
    expect(() => pedirAumento(criarAposta(), 2)).toThrow(/dupla inválida/);
    expect(() => responder(pedirAumento(criarAposta(), 0), -1, 'aceitar')).toThrow(/dupla inválida/);
  });
});

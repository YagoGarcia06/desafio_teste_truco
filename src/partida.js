const { criarRng } = require('./rng');
const {
  JOGADORES,
  cartasIguais,
  criarBaralho,
  embaralhar,
  distribuir,
  validarJogador,
  validarDistribuicao,
} = require('./baralho');
const { duplaDe, resolverRodada } = require('./rodada');
const { resultadoMao } = require('./mao');
const { criarAposta, pedirAumento, responder } = require('./aposta');

const PONTOS_PARA_VENCER = 12;
const PONTOS_MAO_DE_ONZE = 3;
const DECISOES_ONZE = ['jogar', 'correr'];

const proximoJogador = (jogador) => (jogador + 1) % JOGADORES;
const copiarCartas = (cartas) => cartas.map((carta) => ({ ...carta }));

function validarPlacarInicial(placar) {
  const valido =
    Array.isArray(placar) &&
    placar.length === 2 &&
    placar.every((p) => Number.isInteger(p) && p >= 0 && p < PONTOS_PARA_VENCER);
  if (!valido) {
    throw new Error('placar inicial inválido: use dois inteiros de 0 a 11');
  }
}

function tipoDaMao([pontos0, pontos1]) {
  const onze = PONTOS_PARA_VENCER - 1;
  if (pontos0 === onze && pontos1 === onze) return 'ferro';
  if (pontos0 === onze || pontos1 === onze) return 'onze';
  return 'normal';
}

class Partida {
  constructor({ semente = 1, rng, distribuicoes = [], carteadorInicial = 3, placarInicial = [0, 0] } = {}) {
    validarJogador(carteadorInicial, 'carteador');
    validarPlacarInicial(placarInicial);
    if (!Array.isArray(distribuicoes)) {
      throw new Error('distribuicoes deve ser uma lista');
    }
    distribuicoes.forEach(validarDistribuicao);
    this.rng = rng || criarRng(semente);
    this.distribuicoes = [...distribuicoes];
    this.placar = [...placarInicial];
    this.carteador = carteadorInicial;
    this.historico = [];
    this.encerrada = false;
    this.vencedor = null;
    this.iniciarMao();
  }

  // ---------- consultas ----------

  estado() {
    const { mao } = this;
    return {
      placar: [...this.placar],
      carteador: this.carteador,
      vez: mao.vez,
      vira: { ...mao.vira },
      rodada: mao.resultados.length + 1,
      resultadosRodadas: [...mao.resultados],
      cartasNaMesa: mao.jogadas.map(({ jogador, carta, coberta }) =>
        coberta ? { jogador, coberta } : { jogador, carta: { ...carta }, coberta }
      ),
      tipoMao: mao.tipo,
      aguardandoDecisaoOnze: mao.aguardandoDecisao,
      duplaOnze: mao.duplaOnze,
      valorMao: mao.aposta.valor,
      pedidoPendente: mao.aposta.pendente ? { ...mao.aposta.pendente } : null,
      maosJogadas: this.historico.length,
      ultimaMao: this.historico.length ? { ...this.historico.at(-1) } : null,
      encerrada: this.encerrada,
      vencedor: this.vencedor,
    };
  }

  verCartas(observador, dono) {
    validarJogador(observador, 'jogador');
    validarJogador(dono, 'jogador');
    if (!this.podeVer(observador, dono)) {
      throw new Error(`o jogador ${observador} não pode ver as cartas do jogador ${dono}`);
    }
    return copiarCartas(this.mao.maos[dono]);
  }

  // ---------- ações ----------

  jogar(jogador, carta, { coberta = false } = {}) {
    this.verificarAndamento();
    validarJogador(jogador, 'jogador');
    this.verificarVez(jogador);
    const { mao } = this;
    if (mao.aguardandoDecisao) {
      throw new Error('aguardando a decisão da mão de onze');
    }
    if (mao.aposta.pendente) {
      throw new Error('há pedido de aumento pendente: responda antes de jogar');
    }
    const indice = this.indiceDaCarta(jogador, carta);
    if (coberta && mao.tipo === 'ferro') {
      throw new Error('não é permitido cobrir carta na mão de ferro');
    }
    if (coberta && mao.resultados.length === 0) {
      throw new Error('não é permitido cobrir carta na 1ª rodada');
    }
    const [jogada] = mao.maos[jogador].splice(indice, 1);
    mao.jogadas.push({ jogador, carta: jogada, coberta });
    mao.vez = proximoJogador(jogador);
    if (mao.jogadas.length === JOGADORES) {
      this.fecharRodada();
    }
    return this.estado();
  }

  pedirAumento(jogador) {
    this.verificarAndamento();
    validarJogador(jogador, 'jogador');
    this.verificarVez(jogador);
    if (this.mao.tipo !== 'normal') {
      throw new Error(`não há aumento na mão de ${this.mao.tipo}`);
    }
    this.mao.aposta = pedirAumento(this.mao.aposta, duplaDe(jogador));
    return this.estado();
  }

  responder(jogador, resposta) {
    this.verificarAndamento();
    validarJogador(jogador, 'jogador');
    const { aposta, correu } = responder(this.mao.aposta, duplaDe(jogador), resposta);
    if (correu) {
      this.encerrarMao(correu.vencedor, correu.pontos);
    } else {
      this.mao.aposta = aposta;
    }
    return this.estado();
  }

  decidirMaoDeOnze(jogador, decisao) {
    this.verificarAndamento();
    validarJogador(jogador, 'jogador');
    const { mao } = this;
    if (!mao.aguardandoDecisao) {
      throw new Error('não há decisão de mão de onze pendente');
    }
    if (duplaDe(jogador) !== mao.duplaOnze) {
      throw new Error('só a dupla com 11 pontos decide a mão de onze');
    }
    if (!DECISOES_ONZE.includes(decisao)) {
      throw new Error(`decisão inválida: ${decisao}`);
    }
    if (decisao === 'correr') {
      this.encerrarMao(1 - mao.duplaOnze, 1);
    } else {
      mao.aguardandoDecisao = false;
      mao.aposta.valor = PONTOS_MAO_DE_ONZE;
    }
    return this.estado();
  }

  // ---------- regras internas ----------

  // Mão de ferro: ninguém vê nada. Mão de onze: a dupla com 11 vê as cartas dos dois.
  podeVer(observador, dono) {
    const { tipo, duplaOnze } = this.mao;
    if (tipo === 'ferro') return false;
    if (observador === dono) return true;
    return tipo === 'onze' && duplaDe(observador) === duplaOnze && duplaDe(dono) === duplaOnze;
  }

  verificarAndamento() {
    if (this.encerrada) {
      throw new Error('a partida está encerrada');
    }
  }

  verificarVez(jogador) {
    if (jogador !== this.mao.vez) {
      throw new Error(`não é a vez do jogador ${jogador}`);
    }
  }

  // A carta pode ser informada como objeto { valor, naipe } ou pela posição na mão.
  indiceDaCarta(jogador, carta) {
    if (carta === undefined || carta === null) {
      throw new Error('carta não informada');
    }
    const mao = this.mao.maos[jogador];
    const indice = Number.isInteger(carta) ? carta : mao.findIndex((c) => cartasIguais(c, carta));
    if (indice < 0 || indice >= mao.length) {
      throw new Error(`a carta não está na mão do jogador ${jogador}`);
    }
    return indice;
  }

  proximaDistribuicao() {
    if (this.distribuicoes.length) {
      const { maos, vira } = this.distribuicoes.shift();
      return { maos: maos.map(copiarCartas), vira: { ...vira } };
    }
    return distribuir(embaralhar(criarBaralho(), this.rng), this.carteador);
  }

  iniciarMao() {
    const { maos, vira } = this.proximaDistribuicao();
    const tipo = tipoDaMao(this.placar);
    const duplaOnze = tipo === 'onze' ? this.placar.indexOf(PONTOS_PARA_VENCER - 1) : null;
    this.mao = {
      maos,
      vira,
      tipo,
      duplaOnze,
      aguardandoDecisao: tipo === 'onze',
      resultados: [],
      jogadas: [],
      vez: proximoJogador(this.carteador),
      aposta: criarAposta(),
    };
  }

  fecharRodada() {
    const { mao } = this;
    const rodada = resolverRodada(mao.jogadas, mao.vira);
    mao.resultados.push(rodada.vencedor);
    mao.jogadas = [];
    const resultado = resultadoMao(mao.resultados);
    if (resultado.encerrada) {
      this.encerrarMao(resultado.vencedor, mao.aposta.valor);
    } else {
      mao.vez = rodada.proximo;
    }
  }

  encerrarMao(vencedor, pontos) {
    this.historico.push({ vencedor, pontos: vencedor === null ? 0 : pontos });
    if (vencedor !== null) {
      this.placar[vencedor] = Math.min(PONTOS_PARA_VENCER, this.placar[vencedor] + pontos);
      if (this.placar[vencedor] === PONTOS_PARA_VENCER) {
        this.encerrada = true;
        this.vencedor = vencedor;
        return;
      }
    }
    this.carteador = proximoJogador(this.carteador);
    this.iniciarMao();
  }
}

module.exports = { Partida, PONTOS_PARA_VENCER };

# Desafio: Teste de Truco

**Aluno:** Yago Garcia do Canto — **RA:** 24011308-2 — Disciplina: Projeto, Implementação e Teste de Software (2026)

## Especificação do desafio

Enunciado do professor:

- casos de teste para testar o truco paulista;
- truco de 02 duplas;
- casos de teste em Javascript para testar Javascript;

O projeto implementa somente a lógica do jogo (sem interface) e uma suíte de testes em Jest.

### Regras adotadas

**Mesa e baralho**

1. Quatro jogadores (0, 1, 2, 3). Duplas: **0 e 2** (dupla 0) contra **1 e 3** (dupla 1).
2. Baralho de 40 cartas: A, 2, 3, 4, 5, 6, 7, Q, J, K nos naipes ouros, espadas, copas e paus (sem 8, 9, 10 e curingas).
3. Embaralhamento com `rng` injetável (semente). A distribuição também pode ser injetada nos testes.
4. Cada jogador recebe 3 cartas e uma carta é virada: a **vira**.
5. A ordem de jogo é crescente (0 → 1 → 2 → 3 → 0). O primeiro a jogar na mão é o jogador seguinte ao carteador. O carteador passa ao próximo jogador a cada mão.

**Força das cartas**

6. Ordem das cartas comuns, da mais fraca para a mais forte: `4, 5, 6, 7, Q, J, K, A, 2, 3`.
7. **Manilha** é a carta logo acima da vira nessa ordem (vira 3 → manilha 4). A própria vira não é manilha.
8. Ordem das manilhas, da mais forte: **paus (zap)**, **copas (copeta)**, **espadas (espadilha)**, **ouros (pica-fumo)**. Qualquer manilha vence qualquer carta comum.
9. Entre cartas comuns, o naipe não importa: cartas de mesmo valor empatam.

**Rodada e mão**

10. A mão é disputada em até 3 rodadas; cada jogador joga uma carta por rodada, na ordem.
11. Ganha a rodada a dupla da carta mais forte. Se a carta mais forte de cada dupla tiver a mesma força, a rodada **empata** (cangou). Parceiros com cartas iguais não empatam entre si.
12. Quem ganhou a rodada começa a próxima. Se empatou, começa quem cangou, isto é, o jogador que igualou a carta mais forte (o último a jogar uma carta com essa força).
13. Vencedor da mão:
    - quem ganhar 2 rodadas;
    - empate na 1ª: vence quem ganhar a 2ª (se a 2ª também empatar, quem ganhar a 3ª);
    - empate na 2ª ou na 3ª: vence quem ganhou a 1ª;
    - três empates: ninguém pontua.
14. **Carta coberta**: a partir da 2ª rodada, o jogador pode jogar a carta virada para baixo; ela não vale nada (perde para qualquer carta aberta). Na 1ª rodada, cobrir gera erro.

**Aumentos**

15. A mão vale 1 ponto. Os aumentos são **truco (3)**, **seis (6)**, **nove (9)** e **doze (12)**, sempre nessa ordem.
16. Só pode pedir aumento o jogador da vez, antes de jogar a carta.
17. A dupla adversária responde: **aceitar** (a mão passa a valer o novo valor), **correr** (quem pediu ganha o valor anterior e a mão acaba) ou **aumentar** (pede o próximo valor, e a outra dupla passa a responder).
18. Depois de aceito, só a dupla que aceitou pode pedir o próximo aumento. Ninguém joga carta enquanto há pedido pendente. Não há aumento acima de 12.

**Placar e situações especiais**

19. A partida vai até **12 pontos**. O placar não passa de 12.
20. **Mão de onze**: quando só uma dupla tem 11 pontos, os parceiros dela podem ver as cartas um do outro e decidem jogar ou correr. Se jogarem, a mão vale 3. Se correrem, o adversário marca 1. Nessa mão ninguém pode pedir aumento.
21. **Mão de ferro** (11 a 11): todos jogam sem ver as próprias cartas, a mão vale 1 e não há aumentos nem carta coberta. Quem vencer a mão vence a partida. Se as três rodadas empatarem, joga-se outra mão de ferro.
22. Fora da mão de onze, cada jogador só vê as próprias cartas.
23. Jogar fora da vez, jogar carta que não está na mão ou agir com a partida encerrada gera erro.

**Decisões de interpretação** (pontos que as regras acima não detalham):

- **Carteador inicial:** por padrão é o jogador 3, então o jogador 0 começa a primeira mão. Pode ser trocado pela opção `carteadorInicial`.
- **Distribuição a partir do baralho:** as cartas saem uma a uma, começando pelo jogador seguinte ao carteador; a 13ª carta é a vira.
- **Distribuição injetada:** a partida aceita uma lista `distribuicoes` (`{ maos, vira }`), usada em ordem, uma por mão. Quando a lista acaba, as próximas mãos usam o baralho embaralhado pelo `rng`. Toda distribuição é validada (4 mãos de 3 cartas, cartas válidas e sem repetição, incluindo a vira).
- **Quem começa após vitória de rodada:** é o jogador que jogou a carta mais forte da dupla vencedora; se os dois parceiros jogaram cartas de mesma força, começa o primeiro deles que a jogou.
- **Rodada só com cartas cobertas:** todas valem zero, então a rodada empata e começa o último a jogar.
- **Aumentar em resposta:** aumentar equivale a aceitar o pedido atual e pedir o próximo valor. Por isso, se a outra dupla correr, quem aumentou ganha o valor que acabou de aceitar (o valor anterior ao pedido pendente).
- **Resposta pela dupla:** qualquer jogador da dupla que deve responder pode aceitar, correr ou aumentar em nome dela.
- **Primeiro aumento da mão:** pode ser pedido por qualquer dupla (pelo jogador da vez); a restrição da regra 18 vale depois do primeiro aceite.
- **Mão de onze:** qualquer jogador da dupla com 11 decide pela dupla; até a decisão ninguém joga carta. Carta coberta continua permitida nessa mão.
- **Mão em que as três rodadas empatam (fora da mão de ferro):** ninguém pontua e começa a próxima mão.
- **Como jogar uma carta:** informando a carta (`{ valor, naipe }`) ou a posição dela na mão do jogador (0, 1 ou 2). Na mão de ferro, como ninguém vê as cartas, a forma natural é pela posição; o objeto da carta também é aceito. Jogar sem informar a carta gera erro.
- **Placar inicial:** a partida aceita a opção `placarInicial` (dois inteiros de 0 a 11, padrão `[0, 0]`), usada para montar diretamente cenários de mão de onze e mão de ferro.
- **Ver cartas:** `verCartas(observador, dono)` devolve as cartas do dono se o observador puder vê-las e gera erro caso contrário.

## Como executar

Requisitos: Node 18 ou superior.

```bash
npm ci            # instala o Jest a partir do package-lock.json
npm test          # roda todos os casos de teste
npm run coverage  # roda os testes e gera o relatório de cobertura em coverage/
```

## Como funcionam os casos de teste

- **Ferramenta:** Jest, com um arquivo de teste por módulo em `tests/<modulo>.test.js` e um `describe` por grupo de regra.
- **Identificação:** cada teste começa com um ID no formato `CT-<GRUPO>-NN`, numerado sem buracos dentro do grupo. Grupos: `CT-BARALHO`, `CT-MANILHA`, `CT-FORCA`, `CT-RODADA`, `CT-MAO`, `CT-APOSTA`, `CT-PARTIDA`, `CT-ONZE`, `CT-FERRO`, `CT-COBERTA` e `CT-ERRO`.
- **Normal, limite e erro:** para cada regra há o caso comum, os casos de borda (por exemplo, vira 3 fazendo o 4 virar manilha, baralho com exatamente 13 cartas, placar 11 + 3 limitado a 12, pedido de doze) e o caso de erro, verificado com `toThrow` e um trecho da mensagem.
- **Combinações completas:** as 10 viras possíveis para a manilha, todas as sequências de vitória e empate da melhor de 3 (regra 13) e as três respostas (aceitar, correr, aumentar) em cada nível de aumento usam `test.each`.
- **Aleatoriedade controlada:** o embaralhamento usa `criarRng(semente)` (mulberry32) ou um `rng` injetado; a maior parte dos testes de partida injeta a distribuição exata das cartas (`distribuicoes`) para que cada rodada tenha resultado conhecido. Há uma partida completa até 12 com distribuição injetada (CT-PARTIDA-26) e outra só com semente (CT-PARTIDA-27).
- **Independência:** cada teste monta a própria partida ou o próprio cenário.

### Resumo por grupo

| Grupo | Arquivo | Testes | O que cobre |
|---|---|---:|---|
| `CT-BARALHO` | `baralho.test.js` | 26 | Gerador com semente, 40 cartas, embaralhamento e distribuição |
| `CT-MANILHA` | `forca.test.js` | 17 | Manilha para as 10 viras possíveis e ordem zap > copas > espadilha > pica-fumo |
| `CT-FORCA` | `forca.test.js` | 7 | Comparação de força entre cartas comuns e manilhas |
| `CT-RODADA` | `rodada.test.js` | 13 | Vencedor da rodada, empate (cango), quem começa e carta coberta |
| `CT-MAO` | `mao.test.js` | 23 | Todas as combinações de vitória e empate da melhor de 3 |
| `CT-APOSTA` | `aposta.test.js` | 28 | Truco, seis, nove e doze com cada resposta em cada nível |
| `CT-PARTIDA` | `partida.test.js` | 31 | Fluxo de mãos, placar até 12, rotação do carteador e aumentos na mão |
| `CT-COBERTA` | `partida.test.js` | 4 | Carta coberta proibida na 1ª rodada e valendo zero |
| `CT-ONZE` | `partida.test.js` | 14 | Mão de onze: decisão, valor 3, correr dá 1 e sem aumentos |
| `CT-FERRO` | `partida.test.js` | 7 | Mão de ferro: cartas ocultas, vale 1 e quem vence fecha a partida |
| `CT-ERRO` | `partida.test.js` | 19 | Jogada fora da vez, carta fora da mão, partida encerrada e entradas inválidas |
| **Total** | | **189** | |

📄 A lista completa, com cada caso de teste e o resultado esperado, está em [CASOS_DE_TESTE.md](CASOS_DE_TESTE.md).

## Cobertura

Resultado de `npm run coverage`:

| Arquivo | Statements | Branches | Functions | Lines |
|---------|-----------:|---------:|----------:|------:|
| **Todos** | **100%** | **100%** | **100%** | **100%** |
| aposta.js | 100% | 100% | 100% | 100% |
| baralho.js | 100% | 100% | 100% | 100% |
| forca.js | 100% | 100% | 100% | 100% |
| mao.js | 100% | 100% | 100% | 100% |
| partida.js | 100% | 100% | 100% | 100% |
| rng.js | 100% | 100% | 100% | 100% |
| rodada.js | 100% | 100% | 100% | 100% |

## Estrutura do projeto

```
desafio_teste_truco/
├── src/
│   ├── rng.js              ← gerador de números com semente (mulberry32)
│   ├── baralho.js          ← cartas, baralho de 40, embaralhar, distribuir e validar distribuição
│   ├── forca.js            ← manilha a partir da vira, força e comparação de cartas
│   ├── rodada.js           ← vencedor da rodada, empate e quem começa a próxima
│   ├── mao.js              ← vencedor da mão na melhor de 3
│   ├── aposta.js           ← escada de aumentos, pedidos, respostas e valor ao correr
│   └── partida.js          ← fluxo completo, placar, mão de onze e mão de ferro
├── tests/
│   ├── baralho.test.js     ← CT-BARALHO
│   ├── forca.test.js       ← CT-MANILHA e CT-FORCA
│   ├── rodada.test.js      ← CT-RODADA
│   ├── mao.test.js         ← CT-MAO
│   ├── aposta.test.js      ← CT-APOSTA
│   └── partida.test.js     ← CT-PARTIDA, CT-ONZE, CT-FERRO, CT-COBERTA e CT-ERRO
├── package.json            ← scripts test e coverage, Jest como única dependência
├── package-lock.json       ← versões travadas das dependências
├── .gitignore              ← ignora node_modules/ e coverage/
├── CASOS_DE_TESTE.md  ← lista completa dos casos de teste
└── README.md               ← este documento
```

## Colaborador(es)

- Yago Garcia do Canto (trabalho individual)

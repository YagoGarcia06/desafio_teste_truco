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
- **Como jogar uma carta:** informando a carta (`{ valor, naipe }`) ou a posição dela na mão do jogador (0, 1 ou 2). Na mão de ferro, como ninguém vê as cartas, joga-se pela posição.
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

Total: **183 casos de teste**.

### `src/baralho.js` e `src/rng.js` — `tests/baralho.test.js` (26 casos)

| ID | O que testa | Resultado esperado |
|----|-------------|--------------------|
| CT-BARALHO-01 | Baralho tem 40 cartas | `criarBaralho()` devolve 40 cartas |
| CT-BARALHO-02 | Baralho não tem 8, 9, 10 nem curingas | Só os valores 4, 5, 6, 7, Q, J, K, A, 2 e 3 |
| CT-BARALHO-03 | Cada valor aparece uma vez em cada um dos 4 naipes | 40 cartas distintas, 4 naipes por valor |
| CT-BARALHO-04 | Cria carta válida | `{ valor: 'A', naipe: 'paus' }` |
| CT-BARALHO-05 | Rejeita valor fora do baralho (8) | Erro "valor inválido" |
| CT-BARALHO-06 | Rejeita naipe inexistente | Erro "naipe inválido" |
| CT-BARALHO-07 | Converte texto curto em carta | 'Ap', 'Qc', '2e', '7o' viram as cartas correspondentes |
| CT-BARALHO-08 | Rejeita texto de carta inválido | Erro para texto curto, letra de naipe errada, valor 8 ou não texto |
| CT-BARALHO-09 | Compara cartas por valor e naipe | `true` só quando valor e naipe coincidem |
| CT-BARALHO-10 | Mesma semente gera a mesma sequência | Duas sequências iguais |
| CT-BARALHO-11 | Valores ficam no intervalo [0, 1) | 1000 valores entre 0 (incluso) e 1 (excluso) |
| CT-BARALHO-12 | Sementes diferentes geram sequências diferentes | Sequências diferentes |
| CT-BARALHO-13 | Rejeita semente que não é inteiro | Erro "semente" para texto e número fracionário |
| CT-BARALHO-14 | Embaralhar com a mesma semente dá a mesma ordem e não altera o original | Mesma ordem nas duas vezes, diferente da original, mesmas 40 cartas e original intacto |
| CT-BARALHO-15 | Rng injetado que sempre sorteia o último índice mantém a ordem | Ordem igual à do baralho original |
| CT-BARALHO-16 | Rejeita rng que não é função | Erro "rng deve ser uma função" |
| CT-BARALHO-17 | Com carteador 3, distribui uma a uma a partir do jogador 0 e a 13ª carta é a vira | Jogador 0 recebe as cartas 0, 4 e 8; jogador 3 as cartas 3, 7 e 11; vira = carta 12 |
| CT-BARALHO-18 | Com carteador 1, a primeira carta vai para o jogador 2 | Carta 0 com o jogador 2 e carta 3 com o jogador 1 |
| CT-BARALHO-19 | Rejeita carteador fora de 0 a 3 | Erro "carteador inválido" para 4 e -1 |
| CT-BARALHO-20 | Aceita baralho com exatamente 13 cartas e rejeita com 12 | 13 cartas: distribui; 12 cartas: erro "cartas insuficientes" |
| CT-BARALHO-21 | Aceita distribuição com 4 mãos de 3 cartas e vira | Validação devolve `true` sem erro |
| CT-BARALHO-22 | Rejeita distribuição sem 4 mãos | Erro "4 mãos" para 3 mãos ou sem mãos |
| CT-BARALHO-23 | Rejeita mão com quantidade diferente de 3 cartas | Erro "3 cartas" |
| CT-BARALHO-24 | Rejeita carta repetida, inclusive repetição da vira | Erro "carta repetida" (entre mãos e com a vira) |
| CT-BARALHO-25 | Rejeita carta inválida na distribuição | Erro "valor inválido" |
| CT-BARALHO-26 | Rejeita distribuição sem vira | Erro "vira" |

### `src/forca.js` — `tests/forca.test.js` (24 casos)

| ID | O que testa | Resultado esperado |
|----|-------------|--------------------|
| CT-MANILHA-01 | Vira 4o faz a manilha ser 5 | `manilhaDaVira` = 5 e o 5 é manilha |
| CT-MANILHA-02 | Vira 5o faz a manilha ser 6 | `manilhaDaVira` = 6 e o 6 é manilha |
| CT-MANILHA-03 | Vira 6o faz a manilha ser 7 | `manilhaDaVira` = 7 e o 7 é manilha |
| CT-MANILHA-04 | Vira 7o faz a manilha ser Q | `manilhaDaVira` = Q e a Q é manilha |
| CT-MANILHA-05 | Vira Qo faz a manilha ser J | `manilhaDaVira` = J e o J é manilha |
| CT-MANILHA-06 | Vira Jo faz a manilha ser K | `manilhaDaVira` = K e o K é manilha |
| CT-MANILHA-07 | Vira Ko faz a manilha ser A | `manilhaDaVira` = A e o A é manilha |
| CT-MANILHA-08 | Vira Ao faz a manilha ser 2 | `manilhaDaVira` = 2 e o 2 é manilha |
| CT-MANILHA-09 | Vira 2o faz a manilha ser 3 | `manilhaDaVira` = 3 e o 3 é manilha |
| CT-MANILHA-10 | Vira 3o faz a manilha ser 4 | `manilhaDaVira` = 4 (volta ao início da ordem) |
| CT-MANILHA-11 | A própria vira não é manilha | Vira 7: o 7 de paus é comum e perde para a Q de ouros (manilha) |
| CT-MANILHA-12 | Ordem das manilhas é paus > copas > espadas > ouros | Força: zap > copeta > espadilha > pica-fumo |
| CT-MANILHA-13 | Nomes das manilhas: zap, copeta, espadilha e pica-fumo | Nomes zap, copeta, espadilha e pica-fumo |
| CT-MANILHA-14 | Carta comum não tem nome de manilha | `null` |
| CT-MANILHA-15 | A manilha mais fraca (pica-fumo) vence a comum mais forte (3) | `compararCartas` = 1 para a manilha |
| CT-MANILHA-16 | Com vira 3, o 4 vira manilha e vence o 3 | 4 vence o 3 (1) e o 3 perde para o 4 (-1) |
| CT-MANILHA-17 | Rejeita vira inválida | Erro "valor inválido" e erro "vira" quando ausente |
| CT-FORCA-01 | Ordem comum 5 < 6 < 7 < Q < J < K < A < 2 < 3 (vira 3, manilha 4) | Cada carta mais forte que a anterior |
| CT-FORCA-02 | Ordem comum 4 < 5 < 6 < 7 < Q < J < K < A < 2 (vira 2, manilha 3) | Cada carta mais forte que a anterior |
| CT-FORCA-03 | Entre comuns, o naipe não importa (A de ouros empata com A de paus) | Comparação 0 e forças iguais |
| CT-FORCA-04 | CompararCartas indica a carta mais forte | 1 quando a primeira é mais forte, -1 quando é mais fraca |
| CT-FORCA-05 | Manilha contra manilha decide pelo naipe | Zap vence copeta (1); pica-fumo perde para espadilha (-1) |
| CT-FORCA-06 | Carta coberta vale zero e perde para a carta aberta mais fraca | Coberta vale 0 e perde para qualquer aberta; `coberta = false` é o padrão |
| CT-FORCA-07 | Rejeita carta inválida | Erro "valor inválido" |

### `src/rodada.js` — `tests/rodada.test.js` (13 casos)

| ID | O que testa | Resultado esperado |
|----|-------------|--------------------|
| CT-RODADA-01 | Dupla 0 vence com a carta mais forte e o jogador dela começa a próxima | Vencedor dupla 0, sem empate, próximo jogador 2 |
| CT-RODADA-02 | Dupla 1 vence com a carta mais forte | Vencedor dupla 1, próximo jogador 3 |
| CT-RODADA-03 | Manilha vence a carta comum mais forte | Vencedor dupla 1, próximo jogador 1 (dono da manilha) |
| CT-RODADA-04 | Manilhas decidem pelo naipe (zap vence copeta) | Vencedor dupla 0, próximo jogador 2 (dono do zap) |
| CT-RODADA-05 | Melhores cartas das duplas com a mesma força empatam | Vencedor `null` e `empate: true` |
| CT-RODADA-06 | No empate começa quem cangou (último a jogar a carta de maior força) | K×K: começa o jogador 1; A×A×A: começa o jogador 2 |
| CT-RODADA-07 | Parceiros com cartas iguais não empatam entre si | Vencedor dupla 0, começa o primeiro parceiro a jogar a carta (jogador 0) |
| CT-RODADA-08 | Empate com rodada começando no jogador 2 devolve a vez a quem cangou | Empate e próximo jogador 1 |
| CT-RODADA-09 | Manilhas de naipes diferentes nunca empatam (espadilha vence pica-fumo) | Vencedor dupla 0, próximo jogador 0 |
| CT-RODADA-10 | Carta coberta perde para qualquer carta aberta | Vencedor dupla 1 (cartas abertas 4 e 6 contra duas cobertas) |
| CT-RODADA-11 | Rodada só com cartas cobertas empata e começa o último a jogar | Empate e próximo jogador 0 (último a jogar) |
| CT-RODADA-12 | Rejeita rodada com menos de 4 jogadas | Erro "4 jogadas" (3 jogadas ou lista ausente) |
| CT-RODADA-13 | Rejeita jogador repetido ou inválido | Erro "jogador repetido" e "jogador inválido" |

### `src/mao.js` — `tests/mao.test.js` (23 casos)

| ID | O que testa | Resultado esperado |
|----|-------------|--------------------|
| CT-MAO-01 | Dupla 0 vence as duas primeiras | Mão encerrada, vencedor dupla 0 |
| CT-MAO-02 | Dupla 1 vence as duas primeiras | Mão encerrada, vencedor dupla 1 |
| CT-MAO-03 | Dupla 0 vence 1ª e 3ª | Mão encerrada, vencedor dupla 0 |
| CT-MAO-04 | Dupla 1 vence 2ª e 3ª | Mão encerrada, vencedor dupla 1 |
| CT-MAO-05 | Dupla 0 vence 2ª e 3ª | Mão encerrada, vencedor dupla 0 |
| CT-MAO-06 | Dupla 1 vence 1ª e 3ª | Mão encerrada, vencedor dupla 1 |
| CT-MAO-07 | Empate na 2ª: vence quem ganhou a 1ª (dupla 0) | Mão encerrada, vencedor dupla 0 |
| CT-MAO-08 | Empate na 2ª: vence quem ganhou a 1ª (dupla 1) | Mão encerrada, vencedor dupla 1 |
| CT-MAO-09 | Empate na 3ª: vence quem ganhou a 1ª (dupla 0) | Mão encerrada, vencedor dupla 0 |
| CT-MAO-10 | Empate na 3ª: vence quem ganhou a 1ª (dupla 1) | Mão encerrada, vencedor dupla 1 |
| CT-MAO-11 | Empate na 1ª: vence quem ganhar a 2ª (dupla 0) | Mão encerrada, vencedor dupla 0 |
| CT-MAO-12 | Empate na 1ª: vence quem ganhar a 2ª (dupla 1) | Mão encerrada, vencedor dupla 1 |
| CT-MAO-13 | Empate na 1ª e na 2ª: vence quem ganhar a 3ª (dupla 0) | Mão encerrada, vencedor dupla 0 |
| CT-MAO-14 | Empate na 1ª e na 2ª: vence quem ganhar a 3ª (dupla 1) | Mão encerrada, vencedor dupla 1 |
| CT-MAO-15 | Três empates encerram a mão sem vencedor (ninguém pontua) | Mão encerrada, vencedor `null` |
| CT-MAO-16 | A mão continua em aberto com nenhuma rodada jogada | Mão não encerrada |
| CT-MAO-17 | A mão continua em aberto com só a 1ª rodada, com vencedor | Mão não encerrada |
| CT-MAO-18 | A mão continua em aberto com só a 1ª rodada empatada | Mão não encerrada |
| CT-MAO-19 | A mão continua em aberto com uma rodada para cada dupla | Mão não encerrada |
| CT-MAO-20 | A mão continua em aberto com duas rodadas empatadas | Mão não encerrada |
| CT-MAO-21 | Rejeita mais de 3 rodadas | Erro "no máximo 3 rodadas" |
| CT-MAO-22 | Rejeita rodada depois de a mão já estar decidida | Erro "mão já decidida" |
| CT-MAO-23 | Rejeita resultado de rodada que não é 0, 1 ou empate | Erro "resultado de rodada inválido"; erro "lista" se não for lista |

### `src/aposta.js` — `tests/aposta.test.js` (28 casos)

| ID | O que testa | Resultado esperado |
|----|-------------|--------------------|
| CT-APOSTA-01 | A mão começa valendo 1, sem pedido pendente | Valor 1, sem pendência, qualquer dupla pode pedir |
| CT-APOSTA-02 | Aumentos seguem truco (3), seis (6), nove (9) e doze (12) | 1→3→6→9→12 com nomes truco, seis, nove e doze |
| CT-APOSTA-03 | Não há aumento acima de 12 | Erro "acima de 12" |
| CT-APOSTA-04 | Rejeita valor de aposta fora da escada | Erro "valor de aposta inválido" |
| CT-APOSTA-05 | Correr dá a quem pediu o valor anterior da escada | 3→1, 6→3, 9→6, 12→9 |
| CT-APOSTA-06 | Não existe valor anterior a 1 | Erro "não é um pedido de aumento" |
| CT-APOSTA-07 | Pedir aumento deixa o pedido pendente sem mudar o valor | Valor continua 1, pendente `{ valor: 3, dupla: 1 }` |
| CT-APOSTA-08 | Aceitar o pedido de 3 faz a mão valer esse valor | Valor 3, sem pendência, quem aceitou pode aumentar |
| CT-APOSTA-09 | Aceitar o pedido de 6 faz a mão valer esse valor | Valor 6, sem pendência, quem aceitou pode aumentar |
| CT-APOSTA-10 | Aceitar o pedido de 9 faz a mão valer esse valor | Valor 9, sem pendência, quem aceitou pode aumentar |
| CT-APOSTA-11 | Aceitar o pedido de 12 faz a mão valer esse valor | Valor 12, sem pendência |
| CT-APOSTA-12 | Correr do pedido de 3 encerra a mão e dá 1 a quem pediu | Quem pediu ganha 1 ponto |
| CT-APOSTA-13 | Correr do pedido de 6 encerra a mão e dá 3 a quem pediu | Quem pediu ganha 3 pontos |
| CT-APOSTA-14 | Correr do pedido de 9 encerra a mão e dá 6 a quem pediu | Quem pediu ganha 6 pontos |
| CT-APOSTA-15 | Correr do pedido de 12 encerra a mão e dá 9 a quem pediu | Quem pediu ganha 9 pontos |
| CT-APOSTA-16 | Aumentar o pedido de 3 aceita esse valor e pede 6 para a outra dupla | Valor 3 e novo pedido de 6 pela dupla que respondeu |
| CT-APOSTA-17 | Aumentar o pedido de 6 aceita esse valor e pede 9 para a outra dupla | Valor 6 e novo pedido de 9 pela dupla que respondeu |
| CT-APOSTA-18 | Aumentar o pedido de 9 aceita esse valor e pede 12 para a outra dupla | Valor 9 e novo pedido de 12 pela dupla que respondeu |
| CT-APOSTA-19 | Aumentar o pedido de doze gera erro | Erro "acima de 12" |
| CT-APOSTA-20 | Truco aumentado para seis e corrido dá 3 pontos a quem aumentou | Dupla 1 ganha 3 pontos |
| CT-APOSTA-21 | Aumento aceito depois de uma réplica libera o próximo pedido para quem aceitou | Valor 6; dupla 1 não pode pedir, dupla 0 pede 9 |
| CT-APOSTA-22 | Depois de aceito, só a dupla que aceitou pode pedir o próximo aumento | Dupla 0 recebe erro "só a dupla que aceitou"; dupla 1 pede 6 |
| CT-APOSTA-23 | Não pode pedir aumento com pedido pendente | Erro "pedido pendente" |
| CT-APOSTA-24 | A dupla que pediu não pode responder o próprio pedido | Erro "dupla adversária" |
| CT-APOSTA-25 | Responder sem pedido pendente gera erro | Erro "não há pedido pendente" |
| CT-APOSTA-26 | Resposta diferente de aceitar, correr ou aumentar gera erro | Erro "resposta inválida" |
| CT-APOSTA-27 | Com doze aceito não há novo pedido | Erro "acima de 12" |
| CT-APOSTA-28 | Rejeita dupla diferente de 0 e 1 | Erro "dupla inválida" |

### `src/partida.js` — `tests/partida.test.js` (69 casos)

| ID | O que testa | Resultado esperado |
|----|-------------|--------------------|
| CT-PARTIDA-01 | Partida nova começa 0 a 0, mão valendo 1 e jogador 0 na vez | Placar [0, 0], valor 1, carteador 3, vez 0, rodada 1, sem vencedor |
| CT-PARTIDA-02 | O primeiro a jogar é o seguinte ao carteador | Carteador 1 → vez 2; carteador 3 → vez 0 |
| CT-PARTIDA-03 | Com rng, cada jogador recebe 3 cartas diferentes e há uma vira | 4 mãos de 3 cartas e 13 cartas distintas com a vira |
| CT-PARTIDA-04 | A mesma semente gera a mesma distribuição | Mesmas cartas e mesma vira |
| CT-PARTIDA-05 | A distribuição injetada é a usada na mão | Mãos e vira iguais às injetadas |
| CT-PARTIDA-06 | Rng injetado é usado no lugar da semente | Jogador 0 recebe 4, Q e 2 de ouros; vira 6 de espadas |
| CT-PARTIDA-07 | A ordem de jogo é crescente | Vez 2 → 3 → 0 → 1 |
| CT-PARTIDA-08 | Quem ganha a rodada começa a próxima | Resultado [dupla 1], vez do jogador 1, rodada 2 |
| CT-PARTIDA-09 | Vencer duas rodadas dá 1 ponto e começa nova mão com o próximo carteador | Placar [1, 0], carteador 0, vez 1 e cartas da 2ª distribuição |
| CT-PARTIDA-10 | Em rodada empatada começa quem cangou | Resultado [empate] e vez do jogador 1 |
| CT-PARTIDA-11 | Três rodadas empatadas não dão ponto a ninguém e começa a próxima mão | Placar [0, 0], última mão sem vencedor, carteador 0 |
| CT-PARTIDA-12 | Mão decidida na 3ª rodada (2 a 1) | Resultados [0, 1], vez do jogador 3, depois placar [1, 0] |
| CT-PARTIDA-13 | Empate na 3ª rodada dá a mão a quem venceu a 1ª | Placar [1, 0] para a dupla 0 |
| CT-PARTIDA-14 | Carta pode ser jogada pela posição na mão | K de ouros na mesa e 2 cartas na mão |
| CT-PARTIDA-15 | Acabadas as distribuições injetadas, as mãos seguintes vêm do rng | Mãos de 3 cartas, iguais para a mesma semente e diferentes da injetada |
| CT-PARTIDA-16 | Cada jogador só vê as próprias cartas | Vê a própria mão; erro "não pode ver as cartas" para parceiro e adversário |
| CT-PARTIDA-17 | A vez e a ordem continuam certas na segunda mão | Vez do jogador 1 no início da 2ª mão; após a rodada, resultado [0] e vez do jogador 0 |
| CT-PARTIDA-18 | O jogador da vez pede truco e o pedido fica pendente | Pedido pendente `{ valor: 3, dupla: 0 }`, valor ainda 1, vez do jogador 0 |
| CT-PARTIDA-19 | Truco aceito faz a mão valer 3 pontos | Valor 3 e placar [3, 0] |
| CT-PARTIDA-20 | Correr do truco dá 1 ponto a quem pediu e começa a próxima mão | Placar [1, 0], nova mão valendo 1, carteador 0 |
| CT-PARTIDA-21 | Truco aumentado para seis e corrido dá 3 pontos a quem aumentou | Pedido de 6 pela dupla 1 e placar [0, 3] |
| CT-PARTIDA-22 | Aumentos até doze aceitos fazem a mão valer 12 e encerram a partida | Valor 12, placar [12, 0], partida encerrada com vencedor dupla 0 |
| CT-PARTIDA-23 | Truco pedido na 2ª rodada vale para a mão inteira | Placar [3, 0] |
| CT-PARTIDA-24 | Depois do aceite só a dupla que aceitou pode pedir o próximo aumento | Dupla 0 recebe erro; dupla 1 pede seis, que é aceito (valor 6) |
| CT-PARTIDA-25 | Qualquer jogador da dupla adversária responde pela dupla | Valor 3 |
| CT-PARTIDA-26 | Partida completa até 12 com distribuição injetada | Placar 1 a 11 mão a mão, mão de onze, placar final [12, 0], 12 mãos, vencedor dupla 0 |
| CT-PARTIDA-27 | Partida completa só com rng termina com uma dupla em 12 | Partida encerrada, vencedor com 12 e perdedor com menos de 12 |
| CT-PARTIDA-28 | Partida criada sem opções usa os valores padrão | Placar [0, 0], vez 0, mão normal |
| CT-PARTIDA-29 | Placar inicial pode ser injetado | Placar [10, 4] e mão normal |
| CT-ONZE-01 | Só a dupla 0 com 11 pontos: a mão é de onze e aguarda a decisão dela | Tipo "onze", aguardando decisão, dupla com 11 = 0 |
| CT-ONZE-02 | Os parceiros com 11 veem as cartas um do outro; os adversários não | 0 e 2 veem as cartas um do outro; 1 e 3 não; ninguém vê adversário |
| CT-ONZE-03 | Se a dupla jogar, a mão vale 3 (adversário vence e marca 3) | Valor 3 e placar [11, 10] |
| CT-ONZE-04 | A dupla com 11 que joga e vence chega a 12 (placar não passa de 12) | Placar [12, 7] (11 + 3 limitado a 12) e vencedor dupla 0 |
| CT-ONZE-05 | Se a dupla correr, o adversário marca 1 e começa a próxima mão | Placar [11, 8], próxima mão (de onze) com carteador 0 |
| CT-ONZE-06 | Na mão de onze ninguém pode pedir aumento | Erro "não há aumento na mão de onze" para as duas duplas |
| CT-ONZE-07 | Ninguém joga antes da decisão | Erro "decisão da mão de onze" |
| CT-ONZE-08 | Só a dupla com 11 decide | Erro "só a dupla com 11" |
| CT-ONZE-09 | Decisão diferente de jogar ou correr gera erro | Erro "decisão inválida" |
| CT-ONZE-10 | Não há decisão fora da mão de onze nem depois de decidida | Erro "não há decisão de mão de onze" nos dois casos |
| CT-ONZE-11 | Com a dupla 1 em 11, os jogadores 1 e 3 decidem e veem as cartas um do outro | Dupla 1 decide, 1 vê as cartas do 3, 0 não vê as do 2; correr dá [6, 11] |
| CT-ONZE-12 | Correr da mão de onze com o adversário em 10 leva à mão de ferro | Placar [11, 11] e próxima mão de ferro |
| CT-ONZE-13 | Na mão de onze a carta coberta continua permitida a partir da 2ª rodada | Resultados [0, 1] com cartas cobertas na 2ª rodada |
| CT-FERRO-01 | Com 11 a 11 a mão é de ferro, vale 1 e não espera decisão | Tipo "ferro", valor 1, sem decisão pendente |
| CT-FERRO-02 | Ninguém vê as próprias cartas nem as do parceiro | Erro "não pode ver as cartas" mesmo para a própria mão |
| CT-FERRO-03 | Jogando pela posição, quem vence a mão vence a partida | Placar [12, 11], partida encerrada, vencedor dupla 0 |
| CT-FERRO-04 | Não há pedido de aumento | Erro "não há aumento na mão de ferro" |
| CT-FERRO-05 | Não há carta coberta, nem a partir da 2ª rodada | Erro "mão de ferro" |
| CT-FERRO-06 | Se as três rodadas empatarem, joga-se outra mão de ferro | Placar continua [11, 11], nova mão de ferro com carteador 0 |
| CT-COBERTA-01 | Cobrir carta na 1ª rodada gera erro e nada muda | Erro "1ª rodada", mão com 3 cartas e vez inalterada |
| CT-COBERTA-02 | Na 2ª rodada a carta coberta é aceita e perde para qualquer carta aberta | Resultados [0, 1]: a dupla 1 vence com J contra cartas cobertas |
| CT-COBERTA-03 | Na 3ª rodada também é possível cobrir | Placar [0, 1] |
| CT-COBERTA-04 | A carta coberta aparece na mesa sem revelar qual é | Mesa mostra `{ jogador: 0, coberta: true }` sem a carta |
| CT-ERRO-01 | Jogar fora da vez gera erro | Erro "não é a vez" e mão intacta |
| CT-ERRO-02 | Jogar carta que não está na mão gera erro | Erro "não está na mão" |
| CT-ERRO-03 | Jogar carta já jogada gera erro | Erro "não está na mão" |
| CT-ERRO-04 | Posição fora da mão gera erro | Erro "não está na mão" para 3, -1 e posição já usada |
| CT-ERRO-05 | Jogador inexistente gera erro | Erro "jogador inválido" |
| CT-ERRO-06 | Carteador inicial inválido gera erro | Erro "carteador inválido" |
| CT-ERRO-07 | Distribuição injetada inválida gera erro | Erro "carta repetida" |
| CT-ERRO-08 | Semente inválida gera erro | Erro "semente" |
| CT-ERRO-09 | Pedir aumento fora da vez gera erro | Erro "não é a vez" |
| CT-ERRO-10 | Ninguém joga carta com pedido pendente | Erro "pedido de aumento pendente" |
| CT-ERRO-11 | A dupla que pediu não responde o próprio pedido | Erro "dupla adversária" |
| CT-ERRO-12 | Responder sem pedido pendente gera erro | Erro "não há pedido pendente" |
| CT-ERRO-13 | Não há aumento acima de 12 | Erro "acima de 12" ao aumentar o doze e ao pedir depois do doze aceito |
| CT-ERRO-14 | Pedir aumento com pedido pendente gera erro | Erro "pedido pendente" |
| CT-ERRO-15 | Agir com a partida encerrada gera erro | Erro "partida está encerrada" para jogar, pedir e responder |
| CT-ERRO-16 | Placar inicial inválido gera erro | Erro "placar inicial inválido" |
| CT-ERRO-17 | Decidir a mão de onze com a partida encerrada gera erro | Erro "partida está encerrada" |

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
└── README.md               ← este documento
```

## Colaborador(es)

- Yago Garcia do Canto (trabalho individual)

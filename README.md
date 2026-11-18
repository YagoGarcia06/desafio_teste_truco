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
- **Ver cartas:** `verCartas(observador, dono)` devolve as cartas do dono se o observador puder vê-las e gera erro caso contrário.

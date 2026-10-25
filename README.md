# Os 456

Fã-jogo leve em 3D inspirado na série **Round 6**. Roda direto no navegador, no PC ou no celular, sem instalar nada.

Você aceitou o convite: seis brincadeiras de criança separam você do prêmio de ₩ 45,6 bilhões. Cada jogador eliminado coloca ₩ 100 milhões no cofrinho.

## Como jogar

Abra o `index.html` no navegador (precisa de internet para carregar o Three.js). Também dá pra publicar de graça pelo GitHub Pages: Settings → Pages → branch `main`, pasta raiz.

No menu, **Jogar solo** começa da rodada 1. O botão **Treinar** ao lado de cada rodada pula direto para ela.

| Rodada | Jogo | Como funciona | Controles |
| --- | --- | --- | --- |
| 1 | Batatinha Frita 1, 2, 3 | Corra enquanto a boneca canta e pare antes de ela virar. | Segure ↑ ou W, desvie com ← → |
| 2 | Dalgona | Escolha um símbolo e recorte a forma sem rachar o doce. | Segure e arraste com o mouse ou o dedo |
| 3 | Cabo de Guerra | Puxe quando o cursor passar pelo verde. Se o time estiver perdendo, aparece a chance dos "três passos à frente". | Espaço para puxar, E para os três passos |
| 4 | Bolinha de Gude | Par ou ímpar contra o parceiro, valendo bolinhas. Ganha quem ficar com as 20. O parceiro tem manias que dá pra perceber. | Botões na tela |
| 5 | Ponte de Vidro | Escolha o colete (a ordem de travessia) e pule de vidro em vidro. Dá pra olhar o reflexo, mas custa tempo. | ← → para pular, E para olhar o reflexo |
| 6 | Jogo da Lula | Pule num pé só até a cintura da lula, depois corra até a cabeça sem ser empurrado para fora. | Setas ou WASD, Espaço para empurrar |

No celular, os controles aparecem como botões na tela.

Modo multiplayer: planejado. Vai precisar de um servidor para as salas online.

## Organização do código

- `index.html`: telas e HUD.
- `css/style.css`: visual.
- `js/core.js`: som, cena 3D, bonecos, HUD e controles compartilhados.
- `js/r1-batatinha.js` até `js/r6-jogo-da-lula.js`: uma rodada por arquivo. Cada uma expõe `start`, `update`, `cam` e, quando precisa, `press`.
- `js/main.js`: menu, ordem das rodadas, intervalos no dormitório e telas de resultado.

## Tecnologia

- Sem etapa de build: são scripts comuns carregados em ordem pelo `index.html`.
- [Three.js r128](https://threejs.org/) carregado pelo cdnjs para a parte 3D.
- Canvas 2D para a Dalgona e Web Audio para os sons.
- Todos os modelos (jogadores, guardas, boneca, cenários) são feitos com formas simples no código. Não há arquivos de imagem ou modelo copiados da série.

## Aviso

Projeto de fã, sem fins lucrativos e sem ligação com a Netflix ou com os criadores de Round 6.

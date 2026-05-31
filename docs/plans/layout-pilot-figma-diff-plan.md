# LayoutPilot Figma Diff Plan

## Objetivo

Adicionar um modo que compara um frame do Figma com a implementação real renderizada na
página e aponta automaticamente os pontos divergentes (posição, tamanho, cor, tipografia,
presença de elementos), encaixando o design por cima da tela via overlay.

A entrada do design é feita pelo próprio clipboard do Figma ("Copiar como SVG" ou "Copiar como
PNG"), sem API, sem token e sem alinhamento manual obrigatório.

## Por que SVG é o caminho principal

O "Copiar como SVG" do Figma entrega dados **tipados e com coordenadas absolutas** dentro do
frame: cada `<text>` traz a string, `font-size` e `fill`; cada `<rect>` traz posição/tamanho,
`fill` e `rx`; cada `<image>` traz a caixa (e às vezes o data URI); ícones vêm como `<path>`.

Isso resolve o problema mais difícil de um diff design↔implementação: a **correspondência**
entre o que está no design e o que está no DOM. O texto vira a chave de junção (as labels da
tela são as mesmas do design), e o que não tem texto (imagem/ícone) casa por **geometria**
depois que um alinhamento global é calculado a partir das âncoras de texto.

O PNG é tratado como complemento opcional: bom para diff puramente visual (pixel) de coisas que
não têm texto, mas ruidoso (antialias de fonte, sombras, conteúdo dinâmico). Fica como fase
posterior e opt-in.

## Como a extensão funciona hoje (pontos reaproveitados)

> Arquitetura atual (baseline de integração — não é escopo deste plano, só o terreno onde a
> feature pluga): duas camadas — **primitivas globais** em `src/shared/` (`constants.js`,
> `dom.js`, `icons.js`, `i18n.js`, `ui/*`, `locales/*`, `messaging.js`) e **features** em
> `src/content/{core,inspect,review}`, com um orquestrador fino em `src/content/core/orchestrator.js`.
> O Figma Diff entra como um novo feature folder `src/content/figma` e um novo controller no mapa
> do orquestrador, reusando as primitivas via suas chaves em `root` (`root.dom`,
> `root.elementInspector`, etc.).

- **Módulos via IIFE**: cada arquivo registra em `window.LayoutPilotModules` (`root`):
  `root.dom`, `root.ui`, `root.elementInspector`, `root.reviewMode`, `root.reviewMarkers`,
  `root.reviewSnapshot`, `root.modalShield`, `root.inspectMode`, `root.constants`, `root.icons`,
  `root.i18n`.
- **Ordem de carga**: `shared/constants.js` → `CONTENT_SCRIPT_FILES` lista a ordem exata;
  `core/orchestrator.js` é o último. Módulos novos entram antes de quem os consome.
- **`core/orchestrator.js`**: orquestrador fino. Mantém um mapa `MODE -> controller`
  (`createInspectMode`, `createReviewMode`), roteamento de teclado por contrato, messaging
  (`chrome.runtime.onMessage`), tooltips (`initTooltips`/`teardownTooltips`), health check e
  lifecycle. **É aqui que o Figma entra** (mais um item no mapa).
- **Contrato de modo**: cada `create<Mode>Mode({ showToast, t })` expõe `start`, `stop`, `destroy`,
  `handleKeyDown(event, normalized) -> boolean`, `refreshLanguage` (e, opcional, `handleUiClick` e
  `blocksGlobalShortcuts`). O Figma seguirá esse contrato.
- **`core/modal-shield.js`**: shield global (`createModalShield`) que impede a UI da extensão de
  fechar modais Reka/Nuxt da página (para `pointerdown`/`click`/`focusin`/`focusout` no
  `documentElement` quando o alvo é própria UI). Já cobre o overlay do Figma de graça.
- **`shared/dom.js`** (`root.dom`): `createElement(className)` anexa um `div` em
  `document.documentElement` (fora do `<body>`, imune a `pointer-events:none` de modais); também
  `isLayoutPilotElement`, `getModalInteractionNode`, helpers de geometria/cor e `escapeHtml`.
- **`core/element-inspector.js`**: `collectElementInfo(element)` devolve `rect`, `x/y/width/height`,
  `tag`, `classes`, `name`, `selector`, `color`, `fontSize`, `fontFamily`, `padding`, `margin`,
  `borderColors`. É o lado "implementação" do diff.
- **`review/review-markers.js`**: render de caixas e marcadores numerados
  (`getAnnotationViewportRect`, `renderReviewAnnotationBoxes`, `renderReviewMarkers`) — hoje é da
  feature review (ver nota de dependência em "Arquitetura proposta").
- **`review/review-snapshot.js`**: `requestVisibleTabCapture()` captura o viewport como PNG via
  `chrome.runtime` (`MESSAGE_TYPE.CAPTURE_VISIBLE_TAB`). Reaproveitável na fase de pixel diff.
- **`shared/ui`**: `renderAttrs`, `getTooltipAttrs`, `icon(...)`, `renderButton` etc. (primitivas
  globais).
- **CSS**: split em `src/content/base.css` (regra base + tooltip + toast), `inspect/inspect.css` e
  `review/review.css`; `CONTENT_CSS_FILES` lista os três. O Figma adiciona `figma/figma.css`.

## Abordagem

Um modo único "Figma Diff" que combina:

1. **Overlay** (camada visual): o design encaixado por cima da tela, com opacidade, blend
   `difference`, modo "esqueleto" (só contornos) e toggle.
2. **Marcadores semânticos**: caixas/badges nos elementos divergentes, com tooltip do delta.

Overlay e marcadores compartilham **o mesmo transform** (escala + translate), então ficam
sempre coerentes.

## Arquitetura proposta (novos módulos, padrão IIFE/root)

Todos seguem o padrão `(() => { const root = window.LayoutPilotModules ||= {}; ... })()` e
entram em `CONTENT_SCRIPT_FILES` na ordem de dependência.

- `src/content/figma/figma-clipboard.js` → `root.figmaClipboard`
  - Lê o clipboard via evento `paste` (`clipboardData.items`): SVG vem como `text/html` e/ou
    `image/svg+xml`; PNG vem como item de imagem (`getAsFile`). Normaliza para
    `{ kind: 'svg' | 'png', svgText?, blob? }`.
  - **Nota:** já existe `src/content/core/clipboard.js` (`root.clipboard`), porém é uma cópia
    de texto via `navigator.clipboard.writeText` (lado export do inspect) — abordagem e propósito
    diferentes. Usar chave nova `root.figmaClipboard` (sem colisão) e não tentar reaproveitar
    `root.clipboard`.
- `src/content/figma/figma-svg-parser.js` → `root.figmaSvgParser`
  - `parseFigmaSvg(svgText)` usa `DOMParser` e devolve `{ frame: { width, height }, nodes: [...] }`,
    onde cada node é uma **primitiva** normalizada (ver Modelo de dados). Função pura.
- `src/content/figma/figma-align.js` → `root.figmaAlign`
  - `computeTransform(anchors)` recebe pares (ponto design ↔ ponto DOM) e devolve
    `{ scale, offsetX, offsetY }`. Fallback por largura quando faltam âncoras. Função pura.
- `src/content/figma/figma-match.js` → `root.figmaMatch`
  - `matchByText(designNodes, domIndex)` casa texto por string normalizada.
  - `matchByGeometry(designNodes, domCandidates, transform, tol)` casa imagem/ícone por
    vizinho mais próximo com tolerância de tamanho. Função pura (recebe rects já coletados).
- `src/content/figma/figma-diff.js` → `root.figmaDiff`
  - `diffPair(designNode, domInfo, transform, tolerances)` devolve a lista de divergências de
    um par. `summarize(results)` agrega contagens. Funções puras.
- `src/content/figma/figma-overlay.js` → `root.figmaOverlay`
  - Cria a camada de overlay (via `createElement`), aplica o transform, controla opacidade,
    blend mode e modo esqueleto. Renderiza SVG inline ou `<img>` do PNG.
- `src/content/figma/figma-diff-mode.js` → `root.figmaDiffMode`
  - `createFigmaDiffMode({ showToast, t })` cumprindo o **contrato de modo** (`start`, `stop`,
    `destroy`, `handleKeyDown`, `refreshLanguage`, e `handleUiClick`/`blocksGlobalShortcuts` se
    precisar). Orquestra clipboard → parse → align → match → diff → overlay + marcadores. Faz
    bind/unbind do `paste` no `start`/`stop`.
- `src/content/figma/figma.css` → estilos do overlay/marcadores (classes `.layoutpilot-figma-*`),
  seguindo a regra base; entra em `CONTENT_CSS_FILES` (não no `inspector.css`, que não existe mais).

Reaproveitam os existentes (chaves de `root` inalteradas): `dom.createElement`,
`elementInspector.collectElementInfo`, `ui.renderAttrs`/`getTooltipAttrs`, `icons.icon`, `i18n.t`,
e (fase pixel) `reviewSnapshot.requestVisibleTabCapture`.

**Nota de dependência (markers).** O render de marcadores hoje vive em `review/review-markers.js`.
Reaproveitá-lo direto criaria uma dependência `figma → review` (cheiro ruim entre features). Decisão:
no MVP o `figma/` tem o **seu próprio** desenho de marcadores (é simples — caixa + badge + tooltip do
delta, reusando `ui`/`icons`); só promover um renderizador genérico para `core/` se a duplicação
incomodar mais tarde.

## Modelo de dados

Primitiva do design (saída do parser):

```
{
  type: 'text' | 'rect' | 'image' | 'icon',
  rect: { x, y, width, height },   // px de design, relativo ao frame
  text?: string,                   // type === 'text'
  fontSize?: number,
  fontWeight?: number,
  fill?: string,                   // hex/rgba normalizado
  radius?: number,                 // type === 'rect'
  stroke?: string
}
```

Resultado de divergência (saída do diff):

```
{
  designNode, domElement, domInfo,
  matchedBy: 'text' | 'geometry',
  issues: [
    { kind: 'position', dx, dy },
    { kind: 'size', dw, dh },
    { kind: 'color', design, actual },
    { kind: 'font-size', design, actual },
    { kind: 'missing' | 'extra' }
  ]
}
```

## Comparações por tipo

| Tipo (SVG) | Como casa | O que compara |
| --- | --- | --- |
| `text` | string normalizada | posição, tamanho, cor, font-size/weight |
| `rect` (card/badge) | geometria / proximidade | fill, radius, borda, caixa |
| `image` | geometria | presença, posição, tamanho, proporção (pixel = opt-in) |
| `icon` (path) | geometria | presença, posição, tamanho, fill (se monocromático) |

Tolerâncias configuráveis (ligar/desligar cada checagem para controlar ruído). Defaults
sugeridos: posição/tamanho ±2px, cor por distância em espaço de cor, font-size exato.

## Alinhamento (encaixe automático)

1. Casar 2+ textos âncora (string única e estável, ex.: título da tela e um label de canto).
2. De cada par tira-se (ponto no design, ponto no DOM via `getBoundingClientRect`).
3. `computeTransform` resolve `scale` (idealmente uniforme, derivado da razão de larguras) e
   `offset`. Com 1 âncora: usa escala por largura do frame e alinha pela âncora. Sem âncora:
   escala por largura, origem no topo-esquerdo do conteúdo.
4. O mesmo transform posiciona o overlay (CSS `transform`) e converte coordenadas do design para
   a viewport ao desenhar marcadores. Overlay HTML é em px de CSS, então **não há matemática de
   devicePixelRatio** (diferente do canvas).

## Matching

- **Texto**: indexa o DOM por texto normalizado (trim + colapso de espaços). Em caso de texto
  repetido, desambigua pelo mais próximo após o alinhamento global.
- **Imagem/ícone**: vizinho mais próximo entre a caixa do design (já transformada) e os
  candidatos do DOM (`img`, `background-image`, `svg`, `[class*=icon]`), com tolerância de
  tamanho. Sobra de um lado → `missing`/`extra`.

## Fluxo de uso (UX)

1. Usuário ativa o modo Figma Diff (popup/toolbar).
2. No Figma: "Copiar como SVG" no frame; na página: colar (Ctrl+V).
3. Extensão parseia, calcula o transform a partir das âncoras de texto e encaixa o overlay.
4. Roda o diff e desenha marcadores nos elementos divergentes; painel resume ("12 elementos,
   3 divergentes") e lista cada divergência com o delta.
5. Controles: opacidade, blend `difference`, modo esqueleto, ligar/desligar checagens, e nudge
   fino opcional para corrigir o alinhamento.

## Integração no orquestrador

O orquestrador roteia por um mapa `MODE -> controller`, e `startMode`/`stopMode`/`destroy()` e o
despacho de `handleKeyDown` ao controller ativo já são genéricos. Porém **o orquestrador ainda tem
três suposições binárias inspect/review** que precisam ser generalizadas antes do 3º modo
funcionar:

- `shared/constants.js`: novo `MODE.COMPARE` (ou `'figma'`); entradas em `SHORTCUTS_BY_MODE`; novas
  classes em `UI_CLASSES`; registrar os arquivos `figma/*` em `CONTENT_SCRIPT_FILES` (ordem:
  clipboard/parser/align/match/diff/overlay antes de `figma-diff-mode.js`; **tudo antes de
  `core/orchestrator.js`**); adicionar `src/content/figma/figma.css` em `CONTENT_CSS_FILES`.
- `core/orchestrator.js`: adicionar a entrada no mapa `controllers`
  (`[MODE.COMPARE]: createFigmaDiffMode({ showToast, t })`). **Não é "uma linha só"** — também é
  preciso:
  1. **Generalizar `setMode(mode)`**: hoje faz `const nextMode = mode === MODE.REVIEW ? MODE.REVIEW
     : MODE.INSPECT`, ou seja, qualquer modo que não seja `REVIEW` é coagido para `INSPECT` e
     `MODE.COMPARE` **nunca ativaria**. Trocar por validação contra as chaves de `controllers`
     (ex.: `const nextMode = controllers[mode] ? mode : MODE.INSPECT`).
  2. **Revisar `getHelpNote()`**: hoje é `state.mode === MODE.REVIEW ? review : inspect`; precisa
     de um ramo para `COMPARE` (ou virar um mapa `MODE -> help.note.<mode>`), senão mostra a ajuda
     do inspect.
  3. **Revisar `handleKeyDown`**: a flag `isReviewMode` (`state.mode === MODE.REVIEW`) controla
     `allowReviewCancel` e o early-return do atalho `INSPECT`. Decidir o comportamento do `i`/Esc
     no modo COMPARE (provavelmente o controller do Figma deve interceptar via `blocksGlobalShortcuts`
     e/ou tratar Esc no próprio `handleKeyDown`, como o review faz).

  `destroy()` e o loop `Object.values(controllers)` já cobrem o novo controller sem mudança.
- Popup: adicionar a 3ª opção de modo ("Comparar Figma") em `popup.html`/`popup.js`, enviando
  `MODE.COMPARE` no `TOGGLE`/`SET_ENABLED` (mesmo fluxo de inspect/review). O `onMessage` do
  orquestrador já repassa `message.mode` para `setMode`, então basta o `setMode` generalizado.
- `figma/figma.css`: classes `.layoutpilot-figma-overlay`, `.layoutpilot-figma-marker`,
  `.layoutpilot-figma-skeleton`, etc., seguindo a regra base.
- `i18n`: chaves em `en`, `pt-BR`, `es` para toolbar, painel, tooltips e mensagens.

## Faseamento (cada fase entregável)

- **Fase 0 — Ingestão**: `figma-clipboard.js` + colar SVG e logar as primitivas parseadas.
- **Fase 1 — Overlay encaixável**: parser + align por âncora + `figma-overlay.js` com
  opacidade/blend/skeleton/toggle. Já dá o "encaixar na tela".
- **Fase 2 — Diff de texto**: match por texto + diff de posição/cor/font + marcadores + painel.
- **Fase 3 — Tags e rects**: badges/cards (fill, radius, caixa).
- **Fase 4 — Imagens e ícones**: match geométrico + presença/posição/tamanho/fill.
- **Fase 5 (opt-in) — Pixel diff PNG**: `requestVisibleTabCapture` + `pixelmatch` vendorado +
  heatmap/% para o que texto/geometria não cobrem.

## Testabilidade

Parser, align, match e diff são **funções puras** → testáveis no mesmo padrão dos arquivos em
`tests/` (script Node com `assert`, sem DOM real, passando rects/strings já prontos). Não criar
testes nesta etapa de planejamento.

## Riscos e limitações

- **Texto vinculado a contorno** (export "outline text") → perde a string; cai para pixel diff
  na região.
- **Texto repetido** → ambiguidade; resolvida por proximidade pós-alinhamento.
- **Conteúdo dinâmico** (thumbnail, avatar, "Plano Gold") → tratar como diff de conteúdo
  esperado, não como bug; pixel de imagem fica opt-in.
- **Responsivo** → comparar na largura do breakpoint do design (ex.: 1440px); larguras
  diferentes invalidam o diff.
- **Fontes do SVG inline** podem renderizar diferente no overlay; alinhamento usa coordenadas,
  não o texto renderizado (ou esconde o texto do SVG e mantém só caixas no modo esqueleto).
- **Scroll**: comparar o frame visível; reaproveitar a trava de scroll do review para abaixo da
  dobra.

## Fora desta fase

Matching semântico totalmente automático de toda a árvore (layout heurístico), integração com a
API REST do Figma (token), e diff de pixel de conteúdo dinâmico. Tudo isso fica para depois do
MVP (Fases 1–2).

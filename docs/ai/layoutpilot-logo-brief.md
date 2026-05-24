# LayoutPilot Logo Brief

Este documento descreve a direcao recomendada para uma logo final do LayoutPilot, mantendo conexao visual com InterceptPilot e com a identidade compartilhada das extensoes.

## Avaliacao da Marca Atual

Hoje o LayoutPilot usa principalmente:

- `LP` no popup;
- icone de extensao com simbolo simples;
- icone inline de ponteiro na toolbar.

Isso funciona como placeholder, mas ainda nao parece uma marca final.

Pontos positivos:

- o `LP` e legivel em tamanho pequeno;
- o ciano combina muito bem com a interface;
- a toolbar ja usa um simbolo de ponteiro que conversa com o nome `Pilot`;
- a identidade dark/ciano esta ficando forte.

Problemas:

- `LP` e generico e pouco memoravel;
- o icone atual nao comunica revisao visual, layout, medidas ou anotacao;
- falta uma relacao clara entre icon-only, toolbar brand e store icon;
- a marca ainda depende mais da UI do que de um simbolo proprio.

Conclusao: LayoutPilot precisa de um simbolo proprio, mas ele deve ser mais simples e preciso do que ilustrativo.

## Direcao Ideal

LayoutPilot deve parecer uma ferramenta de inspecao, revisao visual e anotacao de interface.

Conceitos visuais:

- layout;
- frame;
- medida;
- cursor;
- selecao;
- revisao;
- camada visual;
- precisao frontend.

A logo ideal deveria combinar:

- um cursor/ponteiro simples;
- um frame/retangulo de selecao;
- uma pequena linha de medida ou corner handles;
- um toque de anotacao visual.

Evitar:

- letras `LP` como solucao principal;
- ruler/regua literal demais;
- screenshot/monitor generico;
- muitos quadradinhos;
- 3D;
- gradiente roxo;
- simbolo complexo que suma em 16px.

## Paleta Recomendada

Usar a paleta compartilhada:

```text
background dark: #0A0F1C
surface dark: #111827
primary cyan: #38BDF8
strong cyan: #0EA5E9
annotation amber: #FBBF24
text light: #F8FAFC
muted slate: #94A3B8
```

Direcao de cor:

- ciano como cor principal;
- amarelo/amber como detalhe opcional para anotacao/marker;
- fundo escuro opcional para app icon;
- versao monocromatica precisa funcionar.

## Requisitos de Aplicacao

A logo precisa funcionar em:

- `16x16`;
- `32x32`;
- `48x48`;
- `128x128`;
- popup header;
- review toolbar;
- Chrome Web Store / Edge Add-ons;
- fundo escuro;
- fundo claro;
- versao monocromatica.

Entregaveis ideais:

- icon-only quadrado;
- horizontal com wordmark;
- versao monocromatica;
- versao transparente;
- SVG editavel;
- PNGs exportados em 16, 32, 48, 128, 256 e 512.

## Estrutura Visual Recomendada

### Icon-only

Um simbolo simples em uma grade quadrada:

- base: quadrado arredondado dark ou transparente;
- icone: cursor/ponteiro;
- frame: canto de retangulo ou bounding box;
- detalhe: pequeno marker ou linha de medida;
- composicao central e forte.

Sugestao:

```text
cursor tocando um frame de selecao
dois cantos de bounding box sugerindo layout
pequeno ponto/marker amber opcional
```

### Wordmark

Manter `LayoutPilot` em texto forte, tecnico e limpo.

Direcao:

- sans-serif tecnica;
- peso 700 ou 800;
- branco/quase branco em dark UI;
- sem efeito 3D;
- wordmark alinhada ao mesmo sistema de InterceptPilot.

## Prompt Para Gerar Logo

Use este prompt para gerar propostas visuais:

```text
Create a premium vector logo for a browser extension named "LayoutPilot".

Product context:
LayoutPilot is a frontend visual inspection and review tool. It helps developers and designers inspect spacing, layout, element boundaries, annotations, screenshots, and visual review marks directly on live web pages.

Visual concept:
Design an icon that combines a simplified cursor/pointer with a layout selection frame or bounding box. The mark should suggest inspecting UI layout, selecting elements, measuring visual structure, and creating visual annotations. Use one clear central symbol.

Style:
Dark technical developer-tool brand, minimal geometric vector, clean stroked shapes, compact silhouette, high legibility at 16x16 and 32x32, suitable for Chrome/Edge extension icons. No mascot, no 3D, no decorative illustration, no complex dashboard, no ruler clutter.

Color palette:
- deep dark background: #0A0F1C
- surface dark: #111827
- primary cyan: #38BDF8
- strong cyan: #0EA5E9
- optional annotation amber: #FBBF24
- white text: #F8FAFC

Icon requirements:
- icon-only version in a rounded square app icon
- transparent-background symbol version
- horizontal logo version with the word "LayoutPilot"
- the icon must remain readable at 16px
- use cyan as the main accent
- amber may be used only as a small annotation/marker detail
- avoid purple as the dominant color

Composition:
A precise cursor/pointer interacting with a rectangular selection frame or layout bounding box. Include subtle corner handles or a small annotation marker if it improves clarity. The symbol should feel precise, calm, modern, and technical.

Output style:
Flat vector, polished, high contrast, modern developer-tool aesthetic, no photorealism.
```

## Prompt Curto Alternativo

```text
Design a clean vector app icon for "LayoutPilot", a browser extension for visual layout inspection and review. Use a dark rounded-square background (#0A0F1C), cyan accent (#38BDF8), and optional small amber annotation detail (#FBBF24). The mark should combine a simple cursor with a layout selection frame or bounding box. Minimal, geometric, high contrast, readable at 16px, no mascot, no 3D, no complex ruler, no purple gradient.
```

## Criterios Para Escolher a Melhor Opcao

Escolher a proposta que:

- comunique layout/inspecao sem depender de texto;
- funcione em 16px;
- pareca mais memoravel que `LP`;
- tenha uma silhueta simples;
- combine com toolbar e popup dark;
- possa usar ciano como cor principal;
- tenha relacao visual com InterceptPilot sem copiar o mesmo simbolo.


# InterceptPilot Logo Brief

Este documento descreve a direcao recomendada para uma nova logo do InterceptPilot, mantendo conexao visual com LayoutPilot e com a identidade compartilhada das extensoes.

## Avaliacao da Logo Atual

Arquivos observados:

- `intercept-pilot/src/assets/brand/logo-icon.png`
- `intercept-pilot/src/assets/brand/logo-horizontal.png`
- `intercept-pilot/icons/icon128.png`

A ideia atual tem pontos bons:

- comunica movimento, rota e navegacao;
- o simbolo de ponteiro/aviao combina com o nome `Pilot`;
- usa azul/ciano, que conversa com a direcao visual desejada;
- ja existe versao horizontal e versao icon-only.

Mas ela tem problemas para uso como produto de extensao:

- e detalhada demais para 16px, 32px e 48px;
- a orbita tracejada com varios pontos perde legibilidade em tamanho pequeno;
- o gradiente do ponteiro compete com os demais elementos;
- o simbolo tem muitos focos visuais ao mesmo tempo;
- a wordmark horizontal parece menos refinada que a UI atual;
- a logo parece mais ilustrativa do que sistemica.

Conclusao: a ideia de "piloto/navegacao/fluxo" e boa, mas a execucao deveria ser mais simples, geometrica e memoravel.

## Direcao Ideal

InterceptPilot deve parecer uma ferramenta de controle de rede, captura e regras.

Conceitos visuais:

- interceptacao;
- fluxo;
- rota;
- desvio controlado;
- regra;
- captura;
- piloto tecnico.

A logo ideal deveria combinar:

- um cursor/ponteiro simples;
- uma linha de rota ou circuito;
- um pequeno ponto/nodo de interceptacao;
- formato compacto que funcione como favicon/extension icon.

Evitar:

- orbita completa muito detalhada;
- muitos pontos;
- ilustracao 3D;
- brilho neon pesado;
- mascote;
- palavra dentro do icone;
- gradiente roxo dominante.

## Paleta Recomendada

Usar a paleta compartilhada:

```text
background dark: #0A0F1C
surface dark: #111827
primary cyan: #38BDF8
strong cyan: #0EA5E9
secondary blue: #5B82FF
text light: #F8FAFC
muted slate: #94A3B8
```

Direcao de cor:

- ciano como cor principal de familia;
- azul como apoio funcional do InterceptPilot;
- fundo escuro opcional para app icon;
- versao monocromatica precisa funcionar em branco/ciano.

## Requisitos de Aplicacao

A logo precisa funcionar em:

- `16x16`;
- `32x32`;
- `48x48`;
- `128x128`;
- sidepanel header;
- full app sidebar;
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

- base: quadrado arredondado dark ou simbolo transparente;
- icone: cursor/ponteiro em linha geometrica;
- detalhe: uma rota curta ou bifurcacao;
- ponto de interceptacao: um pequeno node circular;
- peso visual forte no centro.

Sugestao:

```text
cursor/ponteiro apontando para nordeste
linha curta de rota passando por um node
pequeno desvio indicando mock/interceptacao
```

### Wordmark

Manter `InterceptPilot` em texto limpo e forte.

Direcao:

- sans-serif tecnica;
- peso 700 ou 800;
- kerning cuidadoso;
- sem efeitos 3D;
- `Mock` e `Pilot` podem ter pesos iguais;
- usar branco ou quase branco em dark UI.

## Prompt Para Gerar Logo

Use este prompt para gerar propostas visuais:

```text
Create a premium vector logo for a browser extension named "InterceptPilot".

Product context:
InterceptPilot is a developer and QA tool for intercepting network requests, creating mock rules, inspecting captured traffic, and controlling frontend test scenarios. It should feel technical, precise, reliable, compact, and modern.

Visual concept:
Design an icon that combines a simplified navigation pointer/cursor with a network route or interception path. The mark should suggest controlled routing, request interception, and developer tooling. Use one clear central symbol, not a complex illustration.

Style:
Dark technical SaaS extension brand, minimal geometric vector, clean stroked shapes, compact silhouette, high legibility at 16x16 and 32x32, suitable for Chrome/Edge extension icons. No mascot, no 3D, no busy orbit, no excessive dots, no decorative glow.

Color palette:
- deep dark background: #0A0F1C
- surface dark: #111827
- primary cyan: #38BDF8
- strong cyan: #0EA5E9
- secondary blue: #5B82FF
- white text: #F8FAFC

Icon requirements:
- icon-only version in a rounded square app icon
- transparent-background symbol version
- horizontal logo version with the word "InterceptPilot"
- the icon must remain readable at 16px
- use at most 2 accent colors
- avoid purple as the dominant color

Composition:
A sharp but friendly pointer/cursor angled slightly upward, connected to a short route line with one small node or branch, implying intercepted network flow. The symbol should be balanced, centered, and memorable.

Output style:
Flat vector, polished, high contrast, modern developer-tool aesthetic, no photorealism.
```

## Prompt Curto Alternativo

```text
Design a clean vector app icon for "InterceptPilot", a browser extension for network request mocking and capture. Use a dark rounded-square background (#0A0F1C), cyan primary accent (#38BDF8), and secondary blue (#5B82FF). The mark should combine a simple navigation pointer with a short network route/interception node. Minimal, geometric, high contrast, readable at 16px, no mascot, no 3D, no complex orbit, no excessive glow.
```

## Criterios Para Escolher a Melhor Opcao

Escolher a proposta que:

- ainda seja reconhecivel em 16px;
- funcione sem wordmark;
- pareca tecnica, nao infantil;
- tenha no maximo um detalhe secundario;
- use ciano/azul sem virar gradiente generico;
- combine com dark UI;
- possa ficar ao lado da futura logo do LayoutPilot sem parecer outro universo.


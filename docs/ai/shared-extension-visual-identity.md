# Shared Extension Visual Identity

Este relatorio avalia a identidade visual de LayoutPilot e InterceptPilot como dois produtos que podem viver sob a mesma assinatura de desenvolvedor. A intencao nao e deixar os dois iguais, mas fazer com que parecam parentes: mesma linguagem visual, mesmo cuidado de interacao e uma familia clara de componentes.

## Diagnostico Geral

Os dois produtos ja tem uma base visual compativel:

- tema dark;
- interfaces densas e funcionais;
- bordas discretas;
- cards compactos;
- icones SVG de linha;
- foco em ferramentas para frontend, QA e revisao;
- vanilla JS/CSS com componentes proprios;
- suporte a PT-BR, EN e ES.

A diferenca principal e de tom:

- LayoutPilot parece mais uma ferramenta visual de precisao, sobreposta na pagina.
- InterceptPilot parece mais um painel operacional de captura, regras e diagnostico.

Essa diferenca e boa. O que precisa ser unificado e o vocabulario visual: cores base, botoes, raio, icones, espessura de borda, estados, tipografia, sombras e linguagem de marca.

## Pontos Fortes do LayoutPilot

### Background e atmosfera

O fundo do LayoutPilot e um dos pontos mais fortes. Ele usa uma base escura mais profunda e elegante:

```css
--bg: #0a0f1c;
--panel: #111827;
--panel-soft: #172033;
```

Essa base funciona bem porque:

- parece mais refinada que um dark cinza generico;
- combina com ferramenta tecnica;
- deixa o ciano/azul respirar;
- funciona bem em popup e overlays;
- nao compete com a pagina inspecionada.

### Acento ciano

O acento `#38bdf8` e forte para LayoutPilot porque combina com:

- inspecao visual;
- medidas;
- overlays;
- linhas de captura;
- interface de precisao.

Ele da uma identidade mais propria ao produto.

### Floating UI

A toolbar e o painel de Review deram ao LayoutPilot uma presenca visual mais reconhecivel.

Pontos bons:

- toolbar flutuante com agrupamento claro;
- botoes compactos;
- icones coerentes;
- painel de anotacoes separado das acoes;
- marcacoes visuais com cores fortes.

### Linguagem de revisao

O Review Mode tem um diferencial visual forte:

- marcadores numerados;
- boxes;
- conectores;
- area marks;
- pen marks;
- snapshot;
- PDF visual.

Essa parte pode virar uma assinatura de produto.

## Pontos Fortes do InterceptPilot

### Estrutura operacional clara

InterceptPilot tem uma arquitetura visual mais madura para ferramentas de gerenciamento:

- sidepanel compacto;
- full app com sidebar;
- topbar;
- data panels;
- filtros;
- tabelas/listas;
- modais;
- empty states.

Ele esta mais proximo de um produto SaaS operacional.

### Componentes de acao

InterceptPilot tem uma boa hierarquia de botoes:

```css
.btn.primary
.btn.secondary
.btn.danger
.btn.warning
.btn.info
.btn.ghost
```

Isso e um ponto forte que deveria influenciar LayoutPilot. O produto fica mais previsivel quando cada tipo de acao tem cor e peso definidos.

### Icon system

InterceptPilot centraliza icones em `src/shared/icons.js`, o que facilita consistencia. LayoutPilot agora tambem segue essa direcao.

Esse padrao deve virar regra de familia:

- icones centralizados;
- SVG stroked;
- tamanho padrao;
- mesma espessura de linha;
- nada de SVG solto espalhado por modulo.

### Full App

O full app do InterceptPilot mostra um caminho importante para produtos maiores:

- sidebar fixa;
- paginas especializadas;
- data panel;
- filtros persistentes;
- footer com count/pagination.

Isso pode inspirar futuras telas maiores do LayoutPilot, caso ele ganhe historico, biblioteca de revisoes ou galeria de snapshots.

## O Que Esta Diferente Demais Hoje

### Azul principal

LayoutPilot usa ciano:

```css
--accent: #38bdf8;
```

InterceptPilot usa azul violeta:

```css
--accent: #5b82ff;
```

Os dois funcionam isoladamente, mas juntos parecem produtos de familias diferentes.

Minha recomendacao:

- usar a base escura do LayoutPilot como fundacao da familia;
- manter ciano como acento principal comum;
- permitir que InterceptPilot tenha um azul secundario para estados de captura/regras;
- evitar roxo/violeta como cor dominante.

### Raios e densidade

LayoutPilot usa mais `8px`, `9px`, `10px`.
InterceptPilot usa bastante `10px`, `12px`.

Recomendacao:

- botoes: `8px`;
- cards/panels compactos: `10px`;
- paineis grandes/full app: `12px`;
- badges/pills: `999px`.

Isso preserva a densidade do LayoutPilot e a organizacao do InterceptPilot.

### Backgrounds de superficie

InterceptPilot usa:

```css
--surface-1: #111827;
--surface-2: #1f2937;
--surface-3: #243044;
```

LayoutPilot usa:

```css
--panel: #111827;
--panel-soft: #172033;
```

Recomendacao:

- unificar nomes de tokens nos dois produtos;
- escolher uma escala comum:

```css
--brand-bg: #0a0f1c;
--brand-surface-1: #0f172a;
--brand-surface-2: #111827;
--brand-surface-3: #172033;
--brand-surface-raised: #1f2937;
```

### Botoes

InterceptPilot tem melhor sistema semantico de botoes.
LayoutPilot tem botoes visualmente bonitos, mas ainda mais especificos por contexto.

Recomendacao:

- levar o sistema semantico do InterceptPilot para os dois;
- aplicar o acabamento visual do LayoutPilot onde fizer sentido;
- padronizar altura, padding e foco.

## Direcao Visual Recomendada

### Conceito

Uma familia de ferramentas dark, compactas e precisas para desenvolvimento frontend.

Palavras-chave:

- preciso;
- tecnico;
- calmo;
- moderno;
- operacional;
- visual;
- confiavel;
- nao decorativo.

Evitar:

- gradientes roxos genericos;
- excesso de glow;
- cards grandes demais;
- UI de landing page;
- paleta diferente por produto;
- icones com estilos misturados.

## Paleta Recomendada

### Base compartilhada

```css
--brand-bg: #0a0f1c;
--brand-bg-elevated: #0b1220;
--brand-surface: #111827;
--brand-surface-soft: #172033;
--brand-surface-raised: #1f2937;
--brand-border: rgba(148, 163, 184, 0.22);
--brand-border-strong: rgba(148, 163, 184, 0.36);
--brand-text: #f8fafc;
--brand-muted: #94a3b8;
--brand-soft: #cbd5e1;
```

### Acentos compartilhados

```css
--brand-accent: #38bdf8;
--brand-accent-strong: #0ea5e9;
--brand-accent-soft: rgba(56, 189, 248, 0.16);
--brand-success: #22c55e;
--brand-warning: #f59e0b;
--brand-danger: #ff5c66;
```

### Acentos por produto

LayoutPilot:

```css
--product-accent: #38bdf8;
--product-accent-secondary: #fbbf24;
```

InterceptPilot:

```css
--product-accent: #38bdf8;
--product-accent-secondary: #5b82ff;
```

Assim, InterceptPilot ainda pode usar azul para captura/regras, mas a identidade geral fica conectada ao ciano.

## Tipografia

Manter familia system/Inter e bom para extensoes:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Recomendacao:

- nao trocar fonte agora;
- usar peso 800 para titulos pequenos/kickers;
- usar 13px como base em paineis compactos;
- usar 14px em full app;
- usar monospace apenas para keys, atalhos, URLs, selectors e dados tecnicos.

## Sistema de Componentes Compartilhado

Mesmo mantendo repos separados, os dois deveriam seguir os mesmos padroes.

### Button

Alturas:

- compacto: `32px`;
- default: `38px` ou `40px`;
- icon: `28px` ou `32px`.

Variantes:

- primary: acao principal;
- secondary: acao comum;
- neutral: cancelar/fechar;
- info: diagnostico/inspecionar;
- warning: limpar/reiniciar;
- danger: remover/parar;
- ghost: acoes leves.

### Panel/Card

Regras:

- background surface;
- border sutil;
- radius 10px ou 12px;
- sombra apenas para floating UI;
- sem cards dentro de cards quando nao for necessario;
- header com titulo claro e acao a direita.

### Icon Button

Regras:

- SVG centralizado;
- 28px/32px;
- border sutil;
- hover com acento ciano;
- `aria-label` obrigatorio.

### Empty State

Padrao comum:

- borda dashed;
- fundo sutil;
- texto curto;
- acao contextual quando existir.

### Language Picker

O picker do LayoutPilot ficou mais polido e pode virar referencia:

- flag no botao;
- menu custom;
- auto opcional;
- itens com gap consistente;
- sem select nativo.

InterceptPilot poderia adotar o mesmo padrao se ganhar idioma na UI principal.

## Logos e Marca

Como voce pretende gerar/melhorar logos, eu recomendo criar uma relacao visual entre elas.

Briefs detalhados:

- `docs/ai/interceptpilot-logo-brief.md`
- `docs/ai/layoutpilot-logo-brief.md`

Ideia de familia:

- mesma grade/base geometrica;
- mesmo stroke ou mesma logica de forma;
- mesma paleta dark/ciano;
- nomes com `Pilot` tratados de forma semelhante;
- icone simples que funcione em 16px, 32px, 48px e 128px.

Direcao possivel:

- LayoutPilot: simbolo ligado a cursor, frame, medida, camada visual.
- InterceptPilot: simbolo ligado a rota, interceptacao, fluxo, switch, rede.

O importante e que os dois parecam do mesmo universo:

- mesma espessura visual;
- cantos semelhantes;
- mesmo tipo de brilho/acento;
- versoes monocromaticas funcionando.

## Recomendacoes Por Produto

### LayoutPilot

Manter:

- background atual;
- ciano como acento principal;
- toolbar flutuante;
- painel compacto;
- marcadores coloridos;
- snapshot/PDF com visual proprio.

Melhorar:

- extrair tokens de cor para uma escala compartilhavel;
- padronizar botoes com variantes semanticas;
- manter todos os icones centralizados;
- criar logo final com simbolo mais memoravel que `LP`;
- garantir que popup, toolbar, painel e snapshot usem a mesma terminologia visual.

### InterceptPilot

Manter:

- estrutura de sidepanel/full app;
- data panel pattern;
- button variants;
- organizacao operacional;
- icon system centralizado.

Melhorar:

- aproximar background da base do LayoutPilot;
- reduzir dominancia do azul violeta;
- usar ciano como acento de familia;
- deixar azul secundario para estados especificos;
- revisar logo para ficar mais forte em tamanhos pequenos;
- aplicar o mesmo language picker se fizer sentido.

## O Que Eu Faria Primeiro

1. Criar uma paleta compartilhada documentada.
2. Atualizar InterceptPilot para usar o background base do LayoutPilot.
3. Manter ciano como acento de familia nos dois.
4. Preservar azul secundario do InterceptPilot apenas como cor funcional.
5. Padronizar botao/icon-button/radius/focus nos dois.
6. Criar um pequeno `docs/ai/visual-identity.md` em cada repo ou manter este documento como fonte principal.
7. Criar logos novas usando a mesma regra visual.
8. Depois disso, revisar screenshots das lojas para que parecam da mesma familia.

## Checklist de Consistencia Visual

- Os dois usam a mesma base dark?
- O acento principal e reconhecivel nos dois?
- Os botoes tem alturas e raios parecidos?
- Icon buttons parecem da mesma familia?
- Empty states usam o mesmo tipo de borda/fundo?
- O idioma usa o mesmo padrao visual?
- Logos funcionam lado a lado?
- Screenshots da loja parecem do mesmo desenvolvedor?
- O produto ainda preserva sua personalidade propria?

## Conclusao

LayoutPilot tem a melhor atmosfera visual base, especialmente background, acento ciano e floating UI. InterceptPilot tem a melhor estrutura de produto operacional, principalmente em botoes, paineis, full app e hierarquia de informacao.

A melhor direcao e combinar os dois pontos fortes:

- usar a base visual refinada do LayoutPilot como fundacao;
- trazer a disciplina de componentes do InterceptPilot;
- deixar cada produto com um acento funcional proprio, sem quebrar a familia;
- criar logos que compartilhem forma, stroke e paleta.

O resultado deve ser uma familia de extensoes tecnicas, escuras, compactas e precisas, com personalidade propria sem parecer tema aleatorio em cada produto.

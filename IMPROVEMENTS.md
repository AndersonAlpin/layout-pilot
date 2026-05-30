# LayoutPilot Improvements Roadmap

## Visao geral

Este documento organiza ideias futuras para evoluir o LayoutPilot sem misturar planejamento exploratorio com documentacao tecnica estavel.

O foco atual do produto esta em dois modos:

- Inspect: inspecao rapida de layout, estilos, espacamentos e contexto tecnico.
- Review: revisao visual com anotacoes, marcacoes livres, imagem, snapshot e relatorio PDF printavel.

## Entregue recentemente

- Modo Review reestruturado em modulos dedicados para estado, toolbar, painel, marcadores, snapshot, cores e PDF.
- Cores de anotacoes estruturadas com paleta automatica, cor padrao, cor customizada, cores recentes e alteracao individual por card.
- Exportacoes do Review consolidadas na toolbar: copiar imagem, baixar imagem e gerar PDF.
- Relatorio PDF printavel restaurado em uma pagina propria da extensao, com imagens das anotacoes e secao final para marcacoes livres.
- Dropdowns do popup e da toolbar receberam abertura/fechamento mais suave.
- Site estatico de privacidade em EN, PT-BR e ES, alinhado ao fluxo local-first do LayoutPilot.
- Script de empacotamento para gerar o zip de envio para a Chrome Web Store.

---

## Prioridade 1 — Cores customizaveis para marcacoes livres

Objetivo: permitir que o usuario controle melhor as cores usadas em area e caneta. As anotacoes estruturadas ja possuem paleta, cor padrao, cor customizada, cores recentes e edicao individual.

### 1.1 Cor global para ferramentas livres

Hoje, area e caneta usam vermelho fixo.

Ideia:

- adicionar um seletor de cor global na toolbar do Review;
- posicionar esse seletor perto do botao de fixar/desafixar toolbar;
- a cor escolhida passa a valer para novas areas e novos riscos de caneta;
- inicialmente, o mesmo seletor pode controlar Area e Caneta ao mesmo tempo.

Comportamento esperado:

- usuario escolhe uma cor;
- novas areas usam essa cor;
- novos riscos usam essa cor;
- cor atual fica visualmente clara na toolbar, talvez como swatch.

### 1.2 Alterar cor de areas e riscos existentes

Ideia:

- adicionar um botao de cor no hover das marcacoes livres;
- para area: hover mostra comentar, cor e remover;
- para caneta: hover mostra cor e remover;
- alterar cor afeta somente aquela marcacao livre.

Cuidados:

- controles de hover nao devem aparecer nas capturas/exportacoes;
- botoes precisam ficar acima das marcacoes;
- a UI precisa funcionar em marcacoes pequenas.

### 1.3 Ajustes futuros para cores de anotacoes estruturadas

Ja entregue:

- acao de cor em cada card do painel de anotacoes;
- alteracao individual refletida em marker, box, conector, card, snapshot e relatorio PDF;
- modo automatico, cor padrao, custom color e cores recentes.

Ideias futuras:

- permitir alterar a cor pelo marker ou pela annotation box em um menu contextual;
- permitir salvar presets de paleta por usuario;
- avaliar contraste automatico em paginas muito claras/escuras.

### 1.4 Paleta inicial

Sugestao de paleta:

- amarelo;
- cyan;
- verde;
- violeta;
- rosa;
- laranja;
- vermelho;
- branco/neutro para casos especificos.

Critérios de aceite para a proxima etapa:

- o usuario consegue escolher a cor global de novas marcacoes livres;
- areas e riscos ja desenhados podem ter cor alterada;
- exportacoes refletem as cores atuais;
- i18n cobre labels e tooltips;
- `node --check` e `git diff --check` passam.

---

## Prioridade 2 — Melhorias nas ferramentas livres do Review

Objetivo: deixar Area e Caneta mais completas sem transformar tudo em anotacao obrigatoria.

### 2.1 Paleta e espessura da caneta

Ideias:

- seletor de espessura da caneta;
- manter defaults simples;
- permitir alternar entre linha fina, media e grossa;
- evitar painel complexo demais na primeira versao.

### 2.2 Desfazer ultima marcacao livre

Ideia:

- adicionar um botao de desfazer na toolbar;
- desfaz a ultima acao visual livre:
  - ultimo risco;
  - ultima area;
  - talvez ultima anotacao criada, se for seguro e claro.

Atalho futuro possivel:

- `Z` para desfazer no Review Mode, sem usar `Ctrl+Z` inicialmente.

### 2.3 Limpar apenas marcacoes livres

Hoje, limpar anotacoes preserva marcacoes livres.

Ideia:

- adicionar uma acao separada para limpar apenas areas/riscos;
- manter confirmacao se houver muitas marcacoes;
- nao apagar anotacoes estruturadas.

### 2.4 Retangulos com resize/move

Ideia:

- permitir selecionar uma area livre existente;
- permitir selecionar o retangulo de uma anotacao de elemento existente;
- exibir handles de resize;
- mover o retangulo arrastando a borda ou interior;
- para area livre, manter botao de converter em anotacao;
- para elemento, preservar o vinculo com a anotacao estruturada e atualizar a area destacada.

Cuidados:

- diferenciar bem quando o usuario esta movendo a area e quando esta interagindo com a pagina;
- manter handles e controles fora das capturas/exportacoes;
- garantir que o PDF e snapshots usem a posicao final ajustada.

### 2.5 Texto livre no Review

Ideia:

- adicionar um botao na toolbar para criar texto livre;
- ao ativar a ferramenta, permitir clicar em qualquer area da tela;
- exibir uma caixinha de texto no ponto clicado para o usuario escrever;
- permitir mover a caixa de texto depois de criada;
- tratar texto livre como marcacao visual, sem obrigar a aparecer no painel de anotacoes.

Possiveis usos:

- escrever observacoes curtas direto na imagem;
- rotular uma area sem criar uma anotacao numerada;
- complementar marcacoes de area/caneta em capturas rapidas.

Cuidados:

- definir se texto livre entra na secao final de marcacoes sem anotacao no PDF;
- garantir contraste e legibilidade sobre paginas claras e escuras;
- limitar tamanho minimo/maximo da caixa para nao quebrar exportacoes.

Fora de escopo inicial:

- rotacao;
- formas complexas;
- multiplos shapes.

---

## Prioridade 3 — Review toolbar mais poderosa, sem poluir

Objetivo: concentrar acoes de trabalho na toolbar e manter o painel lateral focado em anotacoes.

Ideias:

- swatch de cor global;
- undo;
- limpar marcacoes livres;
- indicador da ferramenta ativa mais contextual;
- tooltip curto por ferramenta;
- mini menu para opcoes avancadas de area/caneta.

Regras:

- nao devolver acoes de exportacao para o painel lateral;
- toolbar recolhida deve continuar pequena e discreta;
- z-index da toolbar deve ficar acima do painel e das marcacoes.

### 3.1 Painel lateral de propriedades do Review

Se a toolbar comecar a acumular opcoes demais, nao aumentar indefinidamente a quantidade de botoes no topo.

Ideia:

- manter a toolbar apenas com ferramentas e acoes principais;
- abrir um painel lateral de propriedades para configuracoes avancadas;
- usar esse painel para opcoes da ferramenta ativa e ajustes de exportacao.

Separacao desejada:

- toolbar: o que estou fazendo agora;
- painel de anotacoes: o que ja foi comentado;
- painel de propriedades: como a ferramenta atual se comporta.

Possiveis conteudos do painel de propriedades:

- cor atual;
- espessura da caneta;
- estilo da linha;
- limpar apenas marcacoes livres;
- camadas de marcacao;
- opcoes de snapshot;
- opcoes de PDF;
- historico/desfazer.

Comportamento sugerido:

- abrir por um botao discreto na toolbar;
- manter visual consistente com LayoutPilot;
- nao competir com o painel de anotacoes;
- se os dois paineis estiverem abertos, garantir que nao se sobreponham de forma ruim;
- em telas pequenas, preferir um painel por vez.

---

## Prioridade 4 — Snapshot e PDF

Objetivo: melhorar a qualidade das imagens geradas e dos relatorios visuais.

### 4.1 Snapshot composto

Ideias:

- permitir escolher se a sidebar aparece ou nao;
- permitir escolher fundo claro/escuro da sidebar;
- melhorar layout quando ha muitas anotacoes;
- opcao futura para copiar snapshot composto, alem de baixar.

### 4.2 PDF printavel

Ideias:

- opcoes de escala das imagens;
- incluir ou ocultar marcacoes livres;
- incluir uma capa simples;
- mostrar data/hora discreta;
- permitir titulo customizado do relatorio.

### 4.3 Captura alem da viewport atual

Problema atual:

- relatorio PDF depende da viewport capturada;
- anotacoes fora da viewport podem ficar sem imagem.

Ideia futura:

- avaliar scroll automatico por anotacao;
- capturar cada anotacao no contexto em que ela aparece;
- restaurar scroll ao final;
- tratar paginas com scroll interno e sticky headers com cuidado.

---

## Prioridade 5 — Inspect Mode

Objetivo: continuar melhorando a parte tecnica do LayoutPilot sem transformar o Inspect em DevTools completo.

Ideias:

- melhorar comparacao entre elemento fixado e elemento em hover;
- exportar resumo de layout em formatos mais organizados;
- copiar snippet de classes e estilos relevantes;
- mostrar contraste aproximado de texto/fundo;
- detectar overflow visual;
- detectar texto truncado;
- mostrar estados de flex/grid de forma mais amigavel;
- medir gap entre elementos com melhor legibilidade.

Possiveis acoes:

- "Copiar diagnostico visual";
- "Copiar resumo CSS";
- "Destacar overflow";
- "Destacar elementos com texto truncado".

---

## Prioridade 6 — Organizacao e persistencia

Objetivo: preservar melhor o trabalho do usuario quando fizer sentido.

Ideias:

- salvar revisao por aba/session de forma temporaria;
- perguntar antes de perder revisao ao trocar de pagina;
- exportar/importar revisao como JSON;
- reabrir ultima revisao em uma aba compativel;
- persistir posicao da toolbar/painel por site ou globalmente.

Cuidados:

- nao persistir dados demais sem transparencia;
- evitar salvar conteudo sensivel da pagina por padrao;
- deixar claro o que fica local.

---

## Prioridade 7 — UX e acessibilidade

Objetivo: manter a ferramenta agradavel em uso real e evitar friccoes pequenas.

Ideias:

- melhorar foco de teclado nos controles da toolbar;
- reduzir risco de overlays bloquearem inputs;
- estados vazios mais claros;
- tooltips consistentes para icon buttons;
- modo alto contraste para anotacoes;
- suporte melhor a viewports pequenas;
- evitar textos quebrando em botoes e cards.

---

## Ideias exploratorias

Estas ideias ainda precisam de validacao antes de virar escopo.

- Menu contextual proprio no Review Mode ao clicar com botao direito.
- Camadas de marcacao com visibilidade liga/desliga.
- Agrupar anotacoes por cor ou tipo.
- Duplicar anotacao/area.
- Modo foco: esconder todas as marcacoes exceto uma.
- Modo apresentacao para navegar entre anotacoes.
- Biblioteca de estilos de marcacao: seta, circulo, blur, destaque.
- Exportar imagem com escala customizada.
- Integracao futura com ferramentas de design, se fizer sentido.

---

## Priorizacao resumida

### Proximo lote recomendado

1. Cores customizaveis para area/caneta novas.
2. Alterar cor de area/risco existente via hover.
3. Espessura da caneta.
4. Desfazer ultima marcacao livre.

### Depois

5. Limpar apenas marcacoes livres.
6. Melhorias no PDF para anotacoes fora da viewport.
7. Menu contextual para alterar cor pelo marker/box.

### Maiores

8. Captura com scroll por anotacao.
9. Persistencia/exportacao de revisao.
10. Modo apresentacao/foco para revisar anotacoes.

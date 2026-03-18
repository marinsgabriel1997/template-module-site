# Template Mestre de Sites

## Objetivo

Esta pasta base inicia novos sites com arquitetura em camadas (`frontend` + `backend local`), com modulos por rota e carregamento HTML dedicado por modulo.

## Stack principal

- HTML5 nativo
- CSS3 nativo
- JavaScript nativo
- IndexedDB como persistencia principal
- `localStorage` apenas para preferencias simples

## Arquitetura padrao

- `frontend`: layout, navegacao, interacao e renderizacao.
- `backend local`: regras de negocio, orquestracao de estado e acesso a dados.
- `data layer`: wrapper de IndexedDB e repositorios.
- Cada modulo em sua propria rota em `modulos/`.
- Sidebar compartilhada injetada por `assets/js/frontend/sidebar.js` em todas as paginas.
- Use rotas HTML dedicadas por modulo.
- Use links relativos entre paginas (`./` e `../`) para compatibilidade local e GitHub Pages.
- Publique e teste sempre com base path de repositorio (ex.: `/nome-do-repo/` no GitHub Pages).
- Em cada `index.html`, use apenas o container `<aside class="sidebar" data-sidebar></aside>`.
- Mantenha itens e ordem do menu em um unico ponto (`NAV_ITEMS` no `assets/js/frontend/sidebar.js`).

## Regras obrigatorias

- Mantenha o fluxo `UI -> backend local -> persistencia -> resposta -> re-render`.
- A UI consome dados somente pelo `action-dispatcher` do backend local.
- Coloque regras de negocio na camada backend local (`state-store` e `action-dispatcher`).
- Cada modulo deve ter `index.html`, `style.css` e `script.js`.
- Padronize erros como `{ ok: false, error: { code, message } }`.
- Trate observabilidade e log como pilar de arquitetura em todos os modulos.

## Persistencia

- IndexedDB para dados principais dos modulos.
- `localStorage` somente para preferencias leves (ex.: tema, aba ativa).

## Politica de abas

- Use atualizacao manual de dados por modulo em cada aba.
- Mantenha a consistencia entre abas via acao explicita de atualizacao.

## Convencoes de modulos

- Modulos de UI devem ter `script.js` responsavel por inicializar a propria pagina.
- Expor API publica do modulo (`init`, `render`, etc.) e opcional e so deve acontecer quando outro codigo realmente precisar acionar esses metodos.
- Camada de estado/backend deve expor `dispatch` e `getState`.
- Nomes de `action` no padrao verbo + entidade (`getInitialData`, `saveModuleData`).
- Navegacao interna deve evitar `href` absoluto iniciado por `/`.

## Logs

- Niveis: `ERROR`, `WARN`, `INFO`, `DEBUG`.
- Use logger compartilhado por modulo.
- Registre inicio/fim de fluxo, acao de usuario, persistencia e falha.
- Ative `DEBUG` para diagnostico de bugs e travamentos.

## Documentacao complementar

- [architecture.md](docs/architecture.md)
- [bootstrap-site.md](docs/bootstrap-site.md)
- [logging-policy.md](docs/logging-policy.md)
- [product.md](docs/product.md)
- [tasks.md](docs/tasks.md)

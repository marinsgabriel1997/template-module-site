# Template Mestre de Sites

## Objetivo

Esta pasta base inicia novos sites com arquitetura em camadas (`frontend` + `backend local`), com modulos por rota e carregamento HTML dedicado por modulo.

## Stack principal

- HTML5 nativo
- CSS3 nativo
- JavaScript nativo
- IndexedDB como persistencia unica

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

- IndexedDB para todos os dados.

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
- `logMaxLines` aceita minimo `0` (zero desativa armazenamento de logs).
- Em `indexeddb-wrapper`, registros tecnicos persistidos devem ser apenas de erro.

## Documentacao complementar

- [architecture.md](docs/architecture.md)
- [bootstrap-site.md](docs/bootstrap-site.md)
- [logging-policy.md](docs/logging-policy.md)
- [product.md](docs/product.md)
- [tasks.md](docs/tasks.md)

## Fluxo obrigatorio de entrega com usuario

Para qualquer demanda de evolucao/correcao, seguir esta ordem:

1. Conversar com o usuario para alinhar escopo e proposta tecnica.
2. Definir e apresentar plano de implementacao.
3. Aguardar aprovacao explicita do usuario antes de codar.
4. Atualizar documentacao e `docs/tasks.md` antes ou junto da implementacao, quando houver mudanca de fluxo/contrato.
5. Implementar e solicitar validacao funcional do usuario no ambiente real.
7. Apenas apos validacao do usuario, realizar commit. Se houver reprova ou ajuste, voltar ao passo 1.

## Regra de commit

1. Nao realizar commit sem solicitacao ou confirmacao explicita do usuario.
2. Quando houver validacao pendente do usuario, manter alteracoes sem commit ate retorno.

## Padroes de commits

Utilizar commits semanticos com os tipos abaixo:

- `feat`: incluir novo recurso. Relaciona-se com `MINOR` do versionamento semantico.
- `fix`: solucionar problema ou bug. Relaciona-se com `PATCH` do versionamento semantico.
- `docs`: mudancas apenas na documentacao, como `README`.
- `test`: criacao, alteracao ou exclusao de testes, sem incluir alteracoes de codigo de producao.
- `build`: modificacoes em arquivos de build e dependencias.
- `perf`: alteracoes de codigo relacionadas a performance.
- `style`: alteracoes de formatacao, lint, semicolons, trailing spaces e similares, sem mudar comportamento.
- `refactor`: refatoracoes sem alteracao funcional.
- `chore`: tarefas de build, configuracoes administrativas, pacotes e ajustes operacionais sem alteracao de codigo de producao.
- `ci`: mudancas relacionadas a integracao continua.
- `raw`: mudancas em arquivos de configuracoes, dados, features ou parametros.
- `cleanup`: limpeza de codigo comentado, trechos desnecessarios ou melhoria de legibilidade e manutencao.
- `remove`: exclusao de arquivos, diretorios ou funcionalidades obsoletas ou nao utilizadas.

## Regra de testes automatizados

1. Sempre criar ou atualizar testes automatizados quando implementar correcao/evolucao com comportamento verificavel.
2. Quando aplicavel, o teste deve falhar antes da mudanca e passar depois da implementacao.
3. Sempre executar a suite de testes relevante antes de concluir a entrega.
4. Nao solicitar commit com testes quebrados ou sem execucao, salvo autorizacao explicita do usuario.
5. No retorno da entrega, informar quais testes foram executados e o resultado.

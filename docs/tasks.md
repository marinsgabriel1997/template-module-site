# Template de Backlog Inicial

## Padroes ja incluidos no template

- Arquitetura em camadas (`frontend`, `backend local`, `data`).
- Modulos por rota com `index.html` dedicado.
- Navegacao com links relativos compativeis com local e GitHub Pages.
- Sidebar compartilhada por injecao JS via `assets/js/frontend/sidebar.js` e container `data-sidebar`.
- Persistencia principal em IndexedDB com acesso via backend local.
- Politica de logs por nivel (`ERROR`, `WARN`, `INFO`, `DEBUG`).
- Atualizacao manual de dados por modulo.

## Tarefas de projeto (variaveis)

### Descoberta e escopo

- [ ] Definir objetivo do produto e publico alvo.
- [ ] Definir escopo do MVP.
- [ ] Definir modulos reais e ordem no menu lateral em `NAV_ITEMS` do `assets/js/frontend/sidebar.js`.

### Dominio e regras de negocio

- [ ] Definir entidades e casos de uso do dominio.
- [ ] Implementar `actions` especificas do produto no `action-dispatcher`.
- [ ] Implementar regras de negocio especificas no `state-store`.

### Persistencia do produto

- [ ] Definir stores de dominio no IndexedDB.
- [ ] Definir estrategia de migracao de schema.
- [ ] Definir preferencias reais em store dedicada no IndexedDB.

### Interface e experiencia

- [ ] Ajustar identidade visual e tema.
- [ ] Implementar telas e componentes de cada modulo.
- [ ] Definir mensagens de status e erros para usuario final.

### Observabilidade

- [ ] Definir eventos obrigatorios de log por modulo.
- [ ] Definir criterio operacional para ativar `DEBUG`.

### Validacao

- [ ] Validar fluxos principais de negocio ponta a ponta.
- [ ] Validar cenarios de erro e recuperacao.
- [ ] Validar build e rotas no ambiente local e GitHub Pages.
- [ ] Validar confirmacao simples em todas as acoes destrutivas.
- [ ] Validar contrato `dispatch` + `getState` no backend local.
- [ ] Validar `logMaxLines = 0` (sem armazenamento de logs).
- [ ] Validar conflito entre abas com regra de ultima gravacao vence.
- [ ] Validar preservacao de `error.code` no fluxo UI -> backend -> UI.
- [ ] Validar sinalizacao de sobrescrita (`conflict`) em gravacao entre abas.
- [ ] Validar que `getState` nao expoe referencias mutaveis de estado interno.

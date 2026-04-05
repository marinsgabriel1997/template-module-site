# Arquitetura Base de Sites

## Objetivo

Definir a arquitetura tecnica padrao da pasta `template-module-site`.

## Estrutura recomendada

```text
template-module-site/
  index.html
  assets/
    css/
      global.css
      layout.css
      sidebar.css
      theme.css
    js/
      backend/
        indexeddb-wrapper.js
        preferences-storage.js
        state-store.js
        action-dispatcher.js
      frontend/
        sidebar.js
        logger.js
        module-page.js
  modulos/
    configuracoes/
      index.html
      style.css
      script.js
    modulo-01/
      index.html
      style.css
      script.js
    modulo-02/
      index.html
      style.css
      script.js
    modulo-03/
      index.html
      style.css
      script.js
```

## Camadas

- `frontend`: render, componentes visuais, navegacao e handlers.
- `backend local`: actions, regras de negocio, consolidacao de estado.
- `data`: wrapper IndexedDB e repositorios.

## Convencao de modulos

- Cada modulo deve ter `index.html`, `style.css` e `script.js`.
- O `script.js` do modulo deve inicializar a pagina e conectar a UI ao backend local.
- O modulo pode usar helpers compartilhados do `frontend` para evitar repeticao.
- Expor API publica do modulo (`init`, `render`, etc.) e opcional; so faca isso quando outro codigo realmente precisar chamar esses metodos.

## Observabilidade

- Use `TemplateFrontend.logger.createLogger("<modulo>")` em cada modulo.
- Registre `INFO` em fluxos principais e `ERROR` em falhas.
- Ative `DEBUG` por configuracao ao investigar bug dificil.

## Regra de rotas

- Use links relativos entre paginas (`./` e `../`).
- Mantenha cada modulo em arquivo `index.html` proprio dentro de `modulos/`.
- Garanta funcionamento em ambiente local e em GitHub Pages (base path de repositorio).

## Sidebar compartilhada

- Nao replique HTML da sidebar em cada pagina.
- Em cada `index.html`, use somente `<aside class="sidebar" data-sidebar></aside>`.
- A montagem do menu deve ser feita por `assets/js/frontend/sidebar.js`.
- Defina itens e ordem da navegacao em uma unica fonte de verdade (`NAV_ITEMS` no `sidebar.js`).
- O script deve manter o link `Painel` para a home, ajustar `href` relativo por rota e marcar item ativo.

## Fluxo obrigatorio

`UI -> backend local -> persistencia -> resposta -> re-render`

Passos:

1. UI chama `dispatch(action, payload)`.
2. Backend local valida e executa regra.
3. Persiste no IndexedDB quando necessario.
4. Backend retorna estado consolidado.
5. UI re-renderiza a partir da resposta.

## Persistencia

- IndexedDB: dados principais dos modulos.
- IndexedDB: preferencias tambem persistidas em store dedicada.
- UI acessa dados via `action-dispatcher` do backend local.

## Politica de abas

- Sincronize dados por acao manual do usuario em cada modulo (`Atualizar dados`).
- Mantenha estado de cada aba em memoria local durante a sessao.
- Recarregue estado consolidado ao executar a acao de atualizacao.
- Em escrita, pode ser enviado `expectedUpdatedAt` para diagnostico de sobrescrita entre abas.

## Contratos

- `action`: verbo + entidade (`getInitialData`, `reloadModuleData`, `saveModuleData`).
- Backend local deve expor `dispatch` e `getState`.
- Resposta de erro:

```javascript
{
  ok: false,
  error: {
    code: "ERROR_CODE",
    message: "Mensagem de erro"
  }
}
```

## Regras operacionais definidas

- Toda acao destrutiva deve pedir exatamente uma confirmacao simples (`window.confirm`) por execucao.
- `logMaxLines`:
  - minimo `0`
  - padrao `5000`
  - `0` desativa armazenamento de logs.
- Em `indexeddb-wrapper`, logs tecnicos persistidos devem registrar apenas erros.
- Conflito entre abas: ultima gravacao vence; backend retorna sinalizacao de conflito quando houver sobrescrita detectada.
- `Atualizar dados` de modulo apenas recarrega do IndexedDB local e atualiza a tela.

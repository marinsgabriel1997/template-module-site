# Template Module Site

Template base para sites modulares com arquitetura em camadas:

- `frontend`: UI, navegação e renderização
- `backend local`: regras de negócio e orquestração de estado
- `data layer`: persistência em IndexedDB

## Stack

- HTML5, CSS3, JavaScript nativo
- IndexedDB como persistência única

## Estrutura

```text
/
  index.html
  AGENTS.md
  docs/
  assets/
    css/
    js/
      backend/
      frontend/
  modulos/
    configuracoes/
    modulo-01/
    modulo-02/
    modulo-03/
```

## Regras principais

- Fluxo obrigatório: `UI -> backend local -> persistência -> resposta -> re-render`
- UI só acessa dados via `assets/js/backend/action-dispatcher.js`
- Cada módulo deve ter `index.html`, `style.css`, `script.js`
- Sidebar é compartilhada por injeção (`assets/js/frontend/sidebar.js`)
- Em cada página, usar apenas: `<aside class="sidebar" data-sidebar></aside>`
- Navegação interna deve usar links relativos (`./` e `../`)

## Persistência

- Todos os dados (incluindo preferências) em IndexedDB
- Schema versionado no wrapper (`DB_VERSION`)

## Logs

- Níveis: `ERROR`, `WARN`, `INFO`, `DEBUG`
- `logMaxLines` padrão: `5000`
- `logMaxLines = 0` desativa armazenamento de logs
- `indexeddb-wrapper` persiste apenas erros técnicos
- Exportação de logs em `.log`

## Módulo de configurações

Permite:

- Ajustar nível e limite de logs
- Gerar/exportar/limpar logs
- Limpar dados de módulos
- Limpar configurações
- Limpar preferências
- Limpar tudo
- Apagar o banco IndexedDB

Todas as ações destrutivas usam confirmação simples.

## Execução local

1. Abra a pasta do projeto.
2. Rode um servidor estático local (ex.: `npx serve .`).
3. Acesse `index.html` pelo servidor.

## Documentação

- [Arquitetura](docs/architecture.md)
- [Bootstrap](docs/bootstrap-site.md)
- [Política de logs](docs/logging-policy.md)
- [Produto](docs/product.md)
- [Backlog inicial](docs/tasks.md)
- [Instruções operacionais do agente](AGENTS.md)

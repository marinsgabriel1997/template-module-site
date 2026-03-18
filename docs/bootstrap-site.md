# Bootstrap de Novo Site

## Objetivo

Iniciar um novo site baseado em modulos por rota, com separacao de `frontend` e `backend local`.

## Passos iniciais

1. Copiar a pasta `template-sites` para o novo projeto.
2. Preencher [product.md](product.md).
3. Definir modulos iniciais em `modulos/`.
4. Ajustar textos, identidade visual e navegacao.
5. Implementar regras de negocio na camada backend local.

## Arquivos para alterar primeiro

1. `index.html`
2. `assets/css/theme.css`
3. `assets/js/backend/action-dispatcher.js`
4. `modulos/configuracoes/index.html`
5. `modulos/modulo-01/script.js`

## Regras de implementacao

- Cada modulo em sua propria rota.
- Use rotas HTML dedicadas por modulo.
- Use navegacao com links relativos (`./` e `../`) em toda sidebar/menu.
- Nao copie a sidebar entre paginas. Use `<aside class="sidebar" data-sidebar></aside>` em cada `index.html`.
- Centralize menu e ordem dos modulos em `assets/js/frontend/sidebar.js` (array `NAV_ITEMS`).
- O `script.js` de cada modulo deve inicializar sua propria pagina.
- Expor API publica do modulo e opcional; prefira inicializacao direta quando o modulo for simples.
- Validar links no ambiente local e no GitHub Pages antes de publicar.
- IndexedDB como persistencia principal.
- `localStorage` apenas para preferencias simples.
- Use atualizacao manual por modulo entre abas.
- Recarregue estado consolidado ao acionar `Atualizar dados`.
- Trate logs como pilar de observabilidade com nivel configuravel.

## Checklist

- [ ] Definir menu lateral e ordem dos modulos no `NAV_ITEMS` de `assets/js/frontend/sidebar.js`.
- [ ] Implementar actions no `action-dispatcher`.
- [ ] Validar leitura/escrita no IndexedDB wrapper.
- [ ] Garantir acesso ao IndexedDB somente pela camada backend local.
- [ ] Garantir que cada pagina usa `<aside class="sidebar" data-sidebar></aside>`.
- [ ] Validar botao de `Atualizar dados` em cada modulo.
- [ ] Validar contrato de erro padronizado.
- [ ] Validar cobertura minima de logs por modulo (`INFO`, `ERROR`).

## Referencias

- [architecture.md](architecture.md)
- [tasks.md](tasks.md)

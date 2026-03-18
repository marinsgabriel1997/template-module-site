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
- Validar links no ambiente local e no GitHub Pages antes de publicar.
- IndexedDB como persistencia principal.
- `localStorage` apenas para preferencias simples.
- Use atualizacao manual por modulo entre abas.
- Recarregue estado consolidado ao acionar `Atualizar dados`.
- Trate logs como pilar de observabilidade com nivel configuravel.

## Checklist

- [ ] Definir menu lateral e ordem dos modulos.
- [ ] Implementar actions no `action-dispatcher`.
- [ ] Validar leitura/escrita no IndexedDB wrapper.
- [ ] Garantir acesso ao IndexedDB somente pela camada backend local.
- [ ] Validar botao de `Atualizar dados` em cada modulo.
- [ ] Validar contrato de erro padronizado.
- [ ] Validar cobertura minima de logs por modulo (`INFO`, `ERROR`).

## Referencias

- [architecture.md](architecture.md)
- [tasks.md](tasks.md)

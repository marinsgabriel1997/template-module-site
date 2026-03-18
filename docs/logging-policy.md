# Politica de Logs

## Objetivo

Padronizar logs como pilar de observabilidade do template para acelerar diagnostico de bug, erro e travamento.

## Niveis de log

- `ERROR`: falha funcional que interrompe fluxo.
- `WARN`: comportamento fora do esperado com recuperacao.
- `INFO`: evento relevante de negocio e navegacao.
- `DEBUG`: diagnostico detalhado para investigacao ativa.

## Regra de ativacao

- Use `INFO` como nivel operacional padrao.
- Ative `DEBUG` em investigacao de bug dificil.
- Retorne para `INFO` apos concluir diagnostico.

## Pontos obrigatorios de log

- Inicio e fim de inicializacao de modulo.
- Inicio e fim de acao de usuario relevante.
- Leitura e escrita em IndexedDB.
- Operacoes de limpeza de dados.
- Qualquer `catch` com detalhes do erro.

## Formato recomendado

- `timestamp`
- `level`
- `module`
- `message`
- `additionalData` (quando aplicavel)

## Exemplo de uso

```javascript
var logger = window.TemplateFrontend.logger.createLogger("modulo-01");

logger.info("Modulo iniciado");
logger.debug("Payload de entrada", { id: 123 });
logger.error("Falha ao salvar", { message: error.message });
```

## Checklist rapido

- [ ] Todo modulo possui logger proprio.
- [ ] Fluxos criticos possuem `INFO`.
- [ ] Falhas possuem `ERROR` com contexto.
- [ ] Investigacao ativa habilita `DEBUG`.

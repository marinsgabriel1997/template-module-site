(function initModulePageFrontend(global) {
  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function formatState(state) {
    var hasData = state.data !== null && state.data !== undefined;
    return "Modulo: " + state.moduleId + " | Ultima leitura: " + state.lastLoadedAt + " | Dados: " + (hasData ? "OK" : "vazio");
  }

  function init(moduleId) {
    var logger = global.TemplateFrontend.logger.createLogger(moduleId);
    var statusEl = document.querySelector('[data-role="module-status"]');
    var refreshBtn = document.querySelector('[data-action="refresh-state"]');

    function render(state) {
      setText(statusEl, formatState(state));
    }

    function reload() {
      logger.info("Recarregamento manual iniciado");
      global.TemplateBackend.dispatch(global.TemplateBackend.ACTIONS.RELOAD_MODULE_DATA, { moduleId: moduleId }).then(function (result) {
        if (!result.ok) {
          logger.error("Falha ao recarregar dados", result.error);
          setText(statusEl, "Erro ao recarregar: " + result.error.message);
          return;
        }
        logger.info("Dados recarregados", { lastLoadedAt: result.response.lastLoadedAt });
        render(result.response);
      });
    }

    function setupEventListeners() {
      if (refreshBtn) {
        refreshBtn.addEventListener("click", reload);
      }
    }

    logger.info("Inicializacao do modulo iniciada");
    setupEventListeners();

    return global.TemplateBackend.dispatch(global.TemplateBackend.ACTIONS.GET_INITIAL_DATA, { moduleId: moduleId }).then(function (result) {
      if (!result.ok) {
        logger.error("Falha ao carregar dados iniciais", result.error);
        setText(statusEl, "Erro inicial: " + result.error.message);
        return result;
      }
      logger.info("Dados iniciais carregados", { lastLoadedAt: result.response.lastLoadedAt });
      logger.info("Inicializacao do modulo concluida");
      render(result.response);
      return result;
    });
  }

  global.TemplateFrontend = global.TemplateFrontend || {};
  global.TemplateFrontend.modulePage = { init: init };
})(window);

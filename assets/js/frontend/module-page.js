(function initModulePageFrontend(global) {
  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function formatTime(isoString) {
    if (!isoString) return "";

    var date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatStateMessage(state) {
    var hasData = state.data !== null && state.data !== undefined;
    var time = formatTime(state.lastLoadedAt);

    if (!hasData) {
      return time
        ? "Nenhum dado salvo neste modulo ate " + time + "."
        : "Nenhum dado salvo neste modulo ainda.";
    }

    return time
      ? "Dados do modulo atualizados com sucesso as " + time + "."
      : "Dados do modulo atualizados com sucesso.";
  }

  function init(moduleId) {
    var logger = global.TemplateFrontend.logger.createLogger(moduleId);
    var statusEl = document.querySelector('[data-role="module-status"]');
    var refreshBtn = document.querySelector('[data-action="refresh-state"]');

    function render(state) {
      setText(statusEl, formatStateMessage(state));
    }

    function reload() {
      logger.info("Recarregamento manual iniciado");
      setText(statusEl, "Atualizando dados do modulo...");
      global.TemplateBackend.dispatch(global.TemplateBackend.ACTIONS.RELOAD_MODULE_DATA, { moduleId: moduleId }).then(function (result) {
        if (!result.ok) {
          logger.error("Falha ao recarregar dados", result.error);
          setText(statusEl, "Nao foi possivel atualizar os dados deste modulo agora.");
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
    setText(statusEl, "Carregando dados do modulo...");

    return global.TemplateBackend.dispatch(global.TemplateBackend.ACTIONS.GET_INITIAL_DATA, { moduleId: moduleId }).then(function (result) {
      if (!result.ok) {
        logger.error("Falha ao carregar dados iniciais", result.error);
        setText(statusEl, "Nao foi possivel carregar os dados iniciais deste modulo.");
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

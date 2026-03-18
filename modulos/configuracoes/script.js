(function initSettingsPage(global) {
  var logger = global.TemplateFrontend.logger.createLogger("configuracoes");
  var state = {
    initialSettings: null,
    currentSettings: null,
    isDirty: false
  };

  var elements = {
    saveButton: document.querySelector('[data-action="save-settings"]'),
    saveStatus: document.querySelector('[data-role="save-status"]'),
    feedback: document.querySelector('[data-role="feedback"]'),
    logsMeta: document.querySelector('[data-role="logs-meta"]'),
    logLevel: document.querySelector('[data-field="log-level"]'),
    logMaxLines: document.querySelector('[data-field="log-max-lines"]'),
    generateLogButton: document.querySelector('[data-action="generate-log"]'),
    clearLogsButton: document.querySelector('[data-action="clear-logs"]'),
    downloadLogsButton: document.querySelector('[data-action="download-logs"]'),
    clearModuleDataButton: document.querySelector('[data-action="clear-module-data"]'),
    clearSettingsButton: document.querySelector('[data-action="clear-settings"]'),
    clearPreferencesButton: document.querySelector('[data-action="clear-preferences"]'),
    deleteIndexedDBButton: document.querySelector('[data-action="delete-indexeddb"]'),
    clearAllDataButton: document.querySelector('[data-action="clear-all-data"]')
  };

  function setFeedback(message) {
    if (elements.feedback) elements.feedback.textContent = message;
  }

  function toSettingsFromForm() {
    return {
      logLevel: elements.logLevel.value,
      logMaxLines: parseInt(elements.logMaxLines.value, 10)
    };
  }

  function fillForm(settings) {
    elements.logLevel.value = settings.logLevel;
    elements.logMaxLines.value = String(settings.logMaxLines);
  }

  function settingsEqual(a, b) {
    if (!a || !b) return false;
    return a.logLevel === b.logLevel && Number(a.logMaxLines) === Number(b.logMaxLines);
  }

  function updateSaveState() {
    state.currentSettings = toSettingsFromForm();
    state.isDirty = !settingsEqual(state.currentSettings, state.initialSettings);
    elements.saveButton.disabled = !state.isDirty;
    elements.saveStatus.textContent = state.isDirty ? "Alteracoes pendentes" : "Sem alteracoes";
  }

  function hasUnsavedChanges() {
    return state.isDirty;
  }

  function confirmPendingBeforeCleanup(actionLabel) {
    if (!hasUnsavedChanges()) return true;
    return window.confirm("Existem alteracoes nao salvas. Deseja continuar com '" + actionLabel + "'?");
  }

  function setupLeaveWarning() {
    window.addEventListener("beforeunload", function (event) {
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    });

    var sidebarLinks = document.querySelectorAll(".sidebar nav a");
    sidebarLinks.forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (!hasUnsavedChanges()) return;
        var confirmed = window.confirm("Existem alteracoes nao salvas. Deseja sair mesmo assim?");
        if (!confirmed) {
          event.preventDefault();
        }
      });
    });
  }

  function runAction(action, payload) {
    return global.TemplateBackend.dispatch(action, payload || {}).then(function (result) {
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.response;
    });
  }

  function formatDateForFile(date) {
    function pad(value) {
      return String(value).padStart(2, "0");
    }

    return [
      pad(date.getDate()),
      pad(date.getMonth() + 1),
      date.getFullYear()
    ].join("-") + "-" + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("-");
  }

  function downloadTextFile(filename, content) {
    var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function refreshLogsMeta() {
    return runAction(global.TemplateBackend.ACTIONS.GET_LOGS).then(function (logs) {
      elements.logsMeta.textContent = "Logs armazenados: " + logs.length;
    });
  }

  function saveSettings() {
    var settings = toSettingsFromForm();
    logger.info("Salvamento de configuracoes iniciado", settings);
    runAction(global.TemplateBackend.ACTIONS.SAVE_SETTINGS, { settings: settings })
      .then(function (savedSettings) {
        state.initialSettings = savedSettings;
        fillForm(savedSettings);
        updateSaveState();
        setFeedback("Configuracoes salvas com sucesso.");
        logger.info("Configuracoes salvas com sucesso", savedSettings);
        return runAction(global.TemplateBackend.ACTIONS.WRITE_LOG, {
          level: "INFO",
          module: "configuracoes",
          message: "Configuracoes atualizadas",
          additionalData: savedSettings
        });
      })
      .then(function () {
        return refreshLogsMeta();
      })
      .catch(function (error) {
        logger.error("Falha ao salvar configuracoes", { message: error.message });
        setFeedback("Erro ao salvar configuracoes: " + error.message);
      });
  }

  function clearLogs() {
    if (!confirmPendingBeforeCleanup("Limpar logs")) return;

    logger.info("Limpeza de logs iniciada");
    runAction(global.TemplateBackend.ACTIONS.CLEAR_LOGS)
      .then(function () {
        logger.info("Limpeza de logs concluida");
        setFeedback("Logs removidos.");
        window.location.reload();
      })
      .catch(function (error) {
        logger.error("Falha ao limpar logs", { message: error.message });
        setFeedback("Erro ao limpar logs: " + error.message);
      });
  }

  function downloadLogs() {
    logger.info("Exportacao de logs iniciada");
    runAction(global.TemplateBackend.ACTIONS.EXPORT_LOGS)
      .then(function (exported) {
        var filename = formatDateForFile(new Date()) + ".log";
        downloadTextFile(filename, exported.content || "");
        logger.info("Exportacao de logs concluida", { filename: filename, total: exported.total });
        setFeedback("Arquivo de log gerado: " + filename);
      })
      .catch(function (error) {
        logger.error("Falha ao exportar logs", { message: error.message });
        setFeedback("Erro ao baixar logs: " + error.message);
      });
  }

  function generateTestLog() {
    logger.info("Geracao de log de teste iniciada");
    runAction(global.TemplateBackend.ACTIONS.WRITE_LOG, {
      level: "INFO",
      module: "configuracoes",
      message: "Log de teste manual"
    })
      .then(function (result) {
        if (!result.written) {
          logger.warn("Log de teste ignorado pelo nivel configurado", result);
          setFeedback("Log de teste ignorado pelo nivel configurado.");
          return;
        }
        logger.info("Log de teste registrado");
        setFeedback("Log de teste registrado.");
        return refreshLogsMeta();
      })
      .catch(function (error) {
        logger.error("Falha ao gerar log de teste", { message: error.message });
        setFeedback("Erro ao gerar log: " + error.message);
      });
  }

  function clearModuleData() {
    if (!confirmPendingBeforeCleanup("Limpar dados de modulos")) return;

    logger.info("Limpeza de dados de modulos iniciada");
    runAction(global.TemplateBackend.ACTIONS.CLEAR_ALL_MODULE_DATA)
      .then(function () {
        logger.info("Limpeza de dados de modulos concluida");
        setFeedback("Dados de modulos removidos.");
        window.location.reload();
      })
      .catch(function (error) {
        logger.error("Falha ao limpar dados de modulos", { message: error.message });
        setFeedback("Erro ao limpar dados de modulos: " + error.message);
      });
  }

  function clearSettings() {
    if (!confirmPendingBeforeCleanup("Limpar configuracoes persistidas")) return;

    logger.info("Limpeza de configuracoes persistidas iniciada");
    runAction(global.TemplateBackend.ACTIONS.CLEAR_SETTINGS)
      .then(function () {
        logger.info("Limpeza de configuracoes persistidas concluida");
        setFeedback("Configuracoes persistidas removidas.");
        window.location.reload();
      })
      .catch(function (error) {
        logger.error("Falha ao limpar configuracoes persistidas", { message: error.message });
        setFeedback("Erro ao limpar configuracoes persistidas: " + error.message);
      });
  }

  function clearPreferences() {
    if (!confirmPendingBeforeCleanup("Limpar preferencias locais")) return;

    logger.info("Limpeza de preferencias locais iniciada");
    runAction(global.TemplateBackend.ACTIONS.CLEAR_LOCAL_PREFERENCES)
      .then(function () {
        logger.info("Limpeza de preferencias locais concluida");
        setFeedback("Preferencias locais removidas.");
        window.location.reload();
      })
      .catch(function (error) {
        logger.error("Falha ao limpar preferencias locais", { message: error.message });
        setFeedback("Erro ao limpar preferencias locais: " + error.message);
      });
  }

  function clearAllData() {
    if (!confirmPendingBeforeCleanup("Limpar todos os dados")) return;

    logger.info("Limpeza completa de dados iniciada");
    runAction(global.TemplateBackend.ACTIONS.CLEAR_ALL_DATA)
      .then(function () {
        logger.info("Limpeza completa de dados concluida");
        setFeedback("Todos os dados foram removidos.");
        window.location.reload();
      })
      .catch(function (error) {
        logger.error("Falha ao limpar todos os dados", { message: error.message });
        setFeedback("Erro ao limpar todos os dados: " + error.message);
      });
  }

  function deleteIndexedDBDatabase() {
    if (!confirmPendingBeforeCleanup("Apagar IndexedDB")) return;

    var confirmed = window.confirm("Deseja apagar completamente o banco IndexedDB deste template?");
    if (!confirmed) return;

    logger.info("Remocao do banco IndexedDB iniciada");
    runAction(global.TemplateBackend.ACTIONS.DELETE_INDEXEDDB_DATABASE)
      .then(function () {
        logger.info("Remocao do banco IndexedDB concluida");
        setFeedback("IndexedDB apagado com sucesso.");
        window.location.reload();
      })
      .catch(function (error) {
        logger.error("Falha ao apagar IndexedDB", { message: error.message });
        setFeedback("Erro ao apagar IndexedDB: " + error.message);
      });
  }

  function setupEventListeners() {
    elements.logLevel.addEventListener("change", updateSaveState);
    elements.logMaxLines.addEventListener("input", updateSaveState);
    elements.saveButton.addEventListener("click", saveSettings);
    elements.generateLogButton.addEventListener("click", generateTestLog);
    elements.clearLogsButton.addEventListener("click", clearLogs);
    elements.downloadLogsButton.addEventListener("click", downloadLogs);
    elements.clearModuleDataButton.addEventListener("click", clearModuleData);
    elements.clearSettingsButton.addEventListener("click", clearSettings);
    elements.clearPreferencesButton.addEventListener("click", clearPreferences);
    elements.deleteIndexedDBButton.addEventListener("click", deleteIndexedDBDatabase);
    elements.clearAllDataButton.addEventListener("click", clearAllData);
  }

  function init() {
    logger.info("Inicializacao da pagina de configuracoes iniciada");
    setupEventListeners();
    setupLeaveWarning();

    runAction(global.TemplateBackend.ACTIONS.GET_SETTINGS)
      .then(function (settings) {
        logger.info("Configuracoes carregadas", settings);
        state.initialSettings = settings;
        fillForm(settings);
        updateSaveState();
        setFeedback("Configuracoes carregadas.");
        logger.info("Inicializacao da pagina de configuracoes concluida");
        return refreshLogsMeta();
      })
      .catch(function (error) {
        logger.error("Falha ao carregar configuracoes", { message: error.message });
        state.initialSettings = toSettingsFromForm();
        updateSaveState();
        setFeedback("Erro ao carregar configuracoes: " + error.message + ". Edite e salve para recriar.");
      });
  }

  init();
})(window);

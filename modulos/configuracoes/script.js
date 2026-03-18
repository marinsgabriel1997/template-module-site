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
    runAction(global.TemplateBackend.ACTIONS.SAVE_SETTINGS, { settings: settings })
      .then(function (savedSettings) {
        state.initialSettings = savedSettings;
        fillForm(savedSettings);
        updateSaveState();
        setFeedback("Configuracoes salvas com sucesso.");
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

    runAction(global.TemplateBackend.ACTIONS.CLEAR_LOGS)
      .then(function () {
        setFeedback("Logs removidos.");
        window.location.reload();
      })
      .catch(function (error) {
        logger.error("Falha ao limpar logs", { message: error.message });
        setFeedback("Erro ao limpar logs: " + error.message);
      });
  }

  function downloadLogs() {
    runAction(global.TemplateBackend.ACTIONS.EXPORT_LOGS)
      .then(function (exported) {
        var filename = formatDateForFile(new Date()) + ".log";
        downloadTextFile(filename, exported.content || "");
        setFeedback("Arquivo de log gerado: " + filename);
      })
      .catch(function (error) {
        logger.error("Falha ao exportar logs", { message: error.message });
        setFeedback("Erro ao baixar logs: " + error.message);
      });
  }

  function generateTestLog() {
    runAction(global.TemplateBackend.ACTIONS.WRITE_LOG, {
      level: "INFO",
      module: "configuracoes",
      message: "Log de teste manual"
    })
      .then(function (result) {
        if (!result.written) {
          setFeedback("Log de teste ignorado pelo nivel configurado.");
          return;
        }
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

    runAction(global.TemplateBackend.ACTIONS.CLEAR_ALL_MODULE_DATA)
      .then(function () {
        setFeedback("Dados de modulos removidos.");
        window.location.reload();
      })
      .catch(function (error) {
        logger.error("Falha ao limpar dados de modulos", { message: error.message });
        setFeedback("Erro ao limpar dados de modulos: " + error.message);
      });
  }

  function clearPreferences() {
    if (!confirmPendingBeforeCleanup("Limpar configuracoes")) return;

    runAction(global.TemplateBackend.ACTIONS.CLEAR_PREFERENCES)
      .then(function () {
        setFeedback("Configuracoes removidas.");
        window.location.reload();
      })
      .catch(function (error) {
        logger.error("Falha ao limpar configuracoes", { message: error.message });
        setFeedback("Erro ao limpar configuracoes: " + error.message);
      });
  }

  function clearAllData() {
    if (!confirmPendingBeforeCleanup("Limpar todos os dados")) return;

    runAction(global.TemplateBackend.ACTIONS.CLEAR_ALL_DATA)
      .then(function () {
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

    runAction(global.TemplateBackend.ACTIONS.DELETE_INDEXEDDB_DATABASE)
      .then(function () {
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
    elements.clearPreferencesButton.addEventListener("click", clearPreferences);
    elements.deleteIndexedDBButton.addEventListener("click", deleteIndexedDBDatabase);
    elements.clearAllDataButton.addEventListener("click", clearAllData);
  }

  function init() {
    setupEventListeners();
    setupLeaveWarning();

    runAction(global.TemplateBackend.ACTIONS.GET_SETTINGS)
      .then(function (settings) {
        logger.info("Configuracoes carregadas", settings);
        state.initialSettings = settings;
        fillForm(settings);
        updateSaveState();
        setFeedback("Configuracoes carregadas.");
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

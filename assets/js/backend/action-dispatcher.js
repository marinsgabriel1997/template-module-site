(function initActionDispatcher(global) {
  var ACTIONS = {
    GET_INITIAL_DATA: "getInitialData",
    RELOAD_MODULE_DATA: "reloadModuleData",
    SAVE_MODULE_DATA: "saveModuleData",
    GET_SETTINGS: "getSettings",
    SAVE_SETTINGS: "saveSettings",
    WRITE_LOG: "writeLog",
    GET_LOGS: "getLogs",
    CLEAR_LOGS: "clearLogs",
    EXPORT_LOGS: "exportLogs",
    CLEAR_ALL_MODULE_DATA: "clearAllModuleData",
    CLEAR_LOCAL_PREFERENCES: "clearLocalPreferences",
    CLEAR_SETTINGS: "clearSettings",
    CLEAR_ALL_DATA: "clearAllData",
    DELETE_INDEXEDDB_DATABASE: "deleteIndexedDBDatabase"
  };

  function fail(code, message) {
    return {
      ok: false,
      error: { code: code, message: message }
    };
  }

  function success(response) {
    return { ok: true, response: response };
  }

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function validatePayload(action, payload) {
    var data = payload || {};

    switch (action) {
      case ACTIONS.GET_INITIAL_DATA:
      case ACTIONS.RELOAD_MODULE_DATA:
        if (!isNonEmptyString(data.moduleId)) {
          return fail("MODULE_ID_REQUIRED", "moduleId obrigatorio para carregar dados do modulo");
        }
        return null;

      case ACTIONS.SAVE_MODULE_DATA:
        if (!isNonEmptyString(data.moduleId)) {
          return fail("MODULE_ID_REQUIRED", "moduleId obrigatorio para salvar dados do modulo");
        }
        if (!hasOwn(data, "data")) {
          return fail("MODULE_DATA_REQUIRED", "data obrigatorio para salvar dados do modulo");
        }
        return null;

      case ACTIONS.SAVE_SETTINGS:
        if (!data.settings || typeof data.settings !== "object" || Array.isArray(data.settings)) {
          return fail("SETTINGS_REQUIRED", "settings obrigatorio e deve ser um objeto");
        }
        return null;

      case ACTIONS.WRITE_LOG:
        if (!isNonEmptyString(data.level)) {
          return fail("LOG_LEVEL_REQUIRED", "level obrigatorio para gravar log");
        }
        if (!isNonEmptyString(data.message)) {
          return fail("LOG_MESSAGE_REQUIRED", "message obrigatorio para gravar log");
        }
        return null;

      default:
        return null;
    }
  }

  function logActionFailure(action, error) {
    if (!global.TemplateStateStore || !global.TemplateStateStore.writeLog) {
      return Promise.resolve();
    }

    if (action === ACTIONS.WRITE_LOG) {
      return Promise.resolve();
    }

    return global.TemplateStateStore
      .writeLog("ERROR", "action-dispatcher", "Falha na acao", {
        action: action,
        message: error && error.message ? error.message : "Falha na acao"
      })
      .then(function () {
        return null;
      })
      .catch(function () {
        return null;
      });
  }

  function safe(action, actionRunner) {
    return actionRunner().then(success).catch(function (error) {
      return logActionFailure(action, error).then(function () {
        return fail(error && error.code ? error.code : "ACTION_FAILED", error && error.message ? error.message : "Falha na acao");
      });
    });
  }

  function getState() {
    return global.TemplateStateStore.getState();
  }

  function dispatch(action, payload) {
    var data = payload || {};
    var validationError = validatePayload(action, data);

    if (validationError) {
      return Promise.resolve(validationError);
    }

    switch (action) {
      case ACTIONS.GET_INITIAL_DATA:
      case ACTIONS.RELOAD_MODULE_DATA:
        return safe(action, function () {
          return global.TemplateStateStore.loadModuleState(data.moduleId);
        });

      case ACTIONS.SAVE_MODULE_DATA:
        return safe(action, function () {
          return global.TemplateStateStore.saveModuleState(data.moduleId, data.data, {
            expectedUpdatedAt: data.expectedUpdatedAt || null
          });
        });

      case ACTIONS.GET_SETTINGS:
        return safe(action, function () {
          return global.TemplateStateStore.getSettings();
        });

      case ACTIONS.SAVE_SETTINGS:
        return safe(action, function () {
          return global.TemplateStateStore.saveSettings(data.settings);
        });

      case ACTIONS.WRITE_LOG:
        return safe(action, function () {
          return global.TemplateStateStore.writeLog(data.level, data.module, data.message, data.additionalData);
        });

      case ACTIONS.GET_LOGS:
        return safe(action, function () {
          return global.TemplateStateStore.getLogs();
        });

      case ACTIONS.CLEAR_LOGS:
        return safe(action, function () {
          return global.TemplateStateStore.clearLogs();
        });

      case ACTIONS.EXPORT_LOGS:
        return safe(action, function () {
          return global.TemplateStateStore.exportLogs();
        });

      case ACTIONS.CLEAR_ALL_MODULE_DATA:
        return safe(action, function () {
          return global.TemplateStateStore.clearAllModuleData();
        });

      case ACTIONS.CLEAR_LOCAL_PREFERENCES:
        return safe(action, function () {
          return global.TemplateStateStore.clearLocalPreferences();
        });

      case ACTIONS.CLEAR_SETTINGS:
        return safe(action, function () {
          return global.TemplateStateStore.clearSettingsData();
        });

      case ACTIONS.CLEAR_ALL_DATA:
        return safe(action, function () {
          return global.TemplateStateStore.clearAllData();
        });

      case ACTIONS.DELETE_INDEXEDDB_DATABASE:
        return safe(action, function () {
          return global.TemplateStateStore.deleteIndexedDBDatabase();
        });

      default:
        return Promise.resolve(fail("UNKNOWN_ACTION", "Acao nao reconhecida"));
    }
  }

  global.TemplateBackend = {
    ACTIONS: ACTIONS,
    dispatch: dispatch,
    getState: getState
  };
})(window);

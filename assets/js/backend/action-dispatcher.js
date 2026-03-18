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
    CLEAR_PREFERENCES: "clearPreferences",
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

  function safe(actionRunner) {
    return actionRunner().then(success).catch(function (error) {
      return fail("ACTION_FAILED", error && error.message ? error.message : "Falha na acao");
    });
  }

  function dispatch(action, payload) {
    var data = payload || {};

    switch (action) {
      case ACTIONS.GET_INITIAL_DATA:
      case ACTIONS.RELOAD_MODULE_DATA:
        return safe(function () {
          return global.TemplateStateStore.loadModuleState(data.moduleId);
        });

      case ACTIONS.SAVE_MODULE_DATA:
        return safe(function () {
          return global.TemplateStateStore.saveModuleState(data.moduleId, data.data);
        });

      case ACTIONS.GET_SETTINGS:
        return safe(function () {
          return global.TemplateStateStore.getSettings();
        });

      case ACTIONS.SAVE_SETTINGS:
        return safe(function () {
          return global.TemplateStateStore.saveSettings(data.settings);
        });

      case ACTIONS.WRITE_LOG:
        return safe(function () {
          return global.TemplateStateStore.writeLog(data.level, data.module, data.message, data.additionalData);
        });

      case ACTIONS.GET_LOGS:
        return safe(function () {
          return global.TemplateStateStore.getLogs();
        });

      case ACTIONS.CLEAR_LOGS:
        return safe(function () {
          return global.TemplateStateStore.clearLogs();
        });

      case ACTIONS.EXPORT_LOGS:
        return safe(function () {
          return global.TemplateStateStore.exportLogs();
        });

      case ACTIONS.CLEAR_ALL_MODULE_DATA:
        return safe(function () {
          return global.TemplateStateStore.clearAllModuleData();
        });

      case ACTIONS.CLEAR_PREFERENCES:
        return safe(function () {
          return global.TemplateStateStore.clearPreferencesData();
        });

      case ACTIONS.CLEAR_ALL_DATA:
        return safe(function () {
          return global.TemplateStateStore.clearAllData();
        });

      case ACTIONS.DELETE_INDEXEDDB_DATABASE:
        return safe(function () {
          return global.TemplateStateStore.deleteIndexedDBDatabase();
        });

      default:
        return Promise.resolve(fail("UNKNOWN_ACTION", "Acao nao reconhecida"));
    }
  }

  global.TemplateBackend = {
    ACTIONS: ACTIONS,
    dispatch: dispatch
  };
})(window);

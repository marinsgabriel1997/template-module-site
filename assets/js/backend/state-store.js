(function initStateStore(global) {
  var SETTINGS_ID = "global";
  var LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
  var DEFAULT_SETTINGS = {
    logLevel: "INFO",
    logMaxLines: 5000
  };

  var moduleStates = {};

  function createModuleState(moduleId, data, lastLoadedAt) {
    return {
      moduleId: moduleId,
      lastLoadedAt: lastLoadedAt,
      data: data
    };
  }

  function getModuleState(moduleId) {
    if (!moduleId) return null;

    if (!Object.prototype.hasOwnProperty.call(moduleStates, moduleId)) {
      return null;
    }

    var state = moduleStates[moduleId];
    return createModuleState(state.moduleId, state.data, state.lastLoadedAt);
  }

  function normalizeLogLevel(level) {
    if (!level) return DEFAULT_SETTINGS.logLevel;
    var upper = String(level).toUpperCase();
    return Object.prototype.hasOwnProperty.call(LOG_LEVELS, upper) ? upper : DEFAULT_SETTINGS.logLevel;
  }

  function normalizeMaxLines(value) {
    var parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1) return DEFAULT_SETTINGS.logMaxLines;
    return parsed;
  }

  function normalizeSettings(value) {
    var safe = value || {};
    return {
      logLevel: normalizeLogLevel(safe.logLevel),
      logMaxLines: normalizeMaxLines(safe.logMaxLines)
    };
  }

  function getSettings() {
    return global.TemplateIndexedDB.getById(global.TemplateIndexedDB.stores.SETTINGS, SETTINGS_ID).then(function (record) {
      if (!record) return normalizeSettings(DEFAULT_SETTINGS);
      return normalizeSettings(record.payload);
    });
  }

  function saveSettings(payload) {
    var normalized = normalizeSettings(payload);
    return global.TemplateIndexedDB.upsert(global.TemplateIndexedDB.stores.SETTINGS, {
      id: SETTINGS_ID,
      payload: normalized,
      updatedAt: new Date().toISOString()
    }).then(function () {
      return normalized;
    });
  }

  function loadModuleState(moduleId) {
    return global.TemplateIndexedDB.getById(global.TemplateIndexedDB.stores.MODULE_DATA, moduleId).then(function (record) {
      moduleStates[moduleId] = createModuleState(moduleId, record ? record.payload : null, new Date().toISOString());
      return getModuleState(moduleId);
    });
  }

  function saveModuleState(moduleId, payload) {
    return global.TemplateIndexedDB.upsert(global.TemplateIndexedDB.stores.MODULE_DATA, {
      id: moduleId,
      payload: payload,
      updatedAt: new Date().toISOString()
    }).then(function () {
      return loadModuleState(moduleId);
    });
  }

  function shouldWriteLog(settings, level) {
    var currentLevel = LOG_LEVELS[normalizeLogLevel(settings.logLevel)];
    var incomingLevel = LOG_LEVELS[normalizeLogLevel(level)];
    return incomingLevel <= currentLevel;
  }

  function getLogs() {
    return global.TemplateIndexedDB.getAll(global.TemplateIndexedDB.stores.LOGS);
  }

  function trimLogs(maxLines) {
    return getLogs().then(function (logs) {
      if (logs.length <= maxLines) return logs;
      var toDelete = logs.slice(0, logs.length - maxLines);
      var removals = toDelete.map(function (entry) {
        return global.TemplateIndexedDB.deleteById(global.TemplateIndexedDB.stores.LOGS, entry.id);
      });
      return Promise.all(removals).then(function () {
        return getLogs();
      });
    });
  }

  function writeLog(level, moduleName, message, additionalData) {
    return getSettings().then(function (settings) {
      if (!shouldWriteLog(settings, level)) {
        return { written: false, reason: "level_filtered", settings: settings };
      }

      var payload = {
        level: normalizeLogLevel(level),
        module: moduleName || "app",
        message: message || "",
        additionalData: additionalData || null,
        createdAt: new Date().toISOString()
      };

      return global.TemplateIndexedDB.add(global.TemplateIndexedDB.stores.LOGS, payload).then(function () {
        return trimLogs(settings.logMaxLines).then(function (logs) {
          return { written: true, settings: settings, total: logs.length };
        });
      });
    });
  }

  function clearLogs() {
    return global.TemplateIndexedDB.clearStore(global.TemplateIndexedDB.stores.LOGS);
  }

  function clearAllModuleData() {
    return global.TemplateIndexedDB.clearStore(global.TemplateIndexedDB.stores.MODULE_DATA).then(function () {
      moduleStates = {};
      return true;
    });
  }

  function clearAllData() {
    return Promise.all([
      global.TemplateIndexedDB.clearStore(global.TemplateIndexedDB.stores.MODULE_DATA),
      global.TemplateIndexedDB.clearStore(global.TemplateIndexedDB.stores.SETTINGS),
      global.TemplateIndexedDB.clearStore(global.TemplateIndexedDB.stores.LOGS)
    ]).then(function () {
      moduleStates = {};
      var clearedPreferences = global.TemplatePreferences.clearAll();
      return { clearedPreferences: clearedPreferences };
    });
  }

  function clearLocalPreferences() {
    var clearedPreferences = global.TemplatePreferences.clearAll();
    return Promise.resolve({ clearedPreferences: clearedPreferences });
  }

  function clearSettingsData() {
    return global.TemplateIndexedDB.clearStore(global.TemplateIndexedDB.stores.SETTINGS).then(function () {
      return { clearedSettings: true };
    });
  }

  function deleteIndexedDBDatabase() {
    return global.TemplateIndexedDB.deleteDatabase().then(function () {
      moduleStates = {};
      return { deleted: true };
    });
  }

  function formatLogLine(entry) {
    var parts = [entry.createdAt, "[" + entry.level + "]", "[" + entry.module + "]", entry.message];
    if (entry.additionalData !== null && entry.additionalData !== undefined) {
      try {
        parts.push(JSON.stringify(entry.additionalData));
      } catch (error) {
        parts.push(String(entry.additionalData));
      }
    }
    return parts.join(" ");
  }

  function exportLogs() {
    return getLogs().then(function (logs) {
      var lines = logs.map(formatLogLine);
      return {
        total: logs.length,
        content: lines.join("\n")
      };
    });
  }

  global.TemplateStateStore = {
    getModuleState: getModuleState,
    loadModuleState: loadModuleState,
    saveModuleState: saveModuleState,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getLogs: getLogs,
    writeLog: writeLog,
    clearLogs: clearLogs,
    exportLogs: exportLogs,
    clearAllModuleData: clearAllModuleData,
    clearAllData: clearAllData,
    clearLocalPreferences: clearLocalPreferences,
    clearSettingsData: clearSettingsData,
    deleteIndexedDBDatabase: deleteIndexedDBDatabase
  };
})(window);

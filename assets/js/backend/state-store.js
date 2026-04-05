(function initStateStore(global) {
  var SETTINGS_ID = "global";
  var LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
  var DEFAULT_SETTINGS = {
    logLevel: "INFO",
    logMaxLines: 5000
  };

  var moduleStates = {};

  function cloneValue(value) {
    if (value === null || value === undefined) return value;
    if (typeof global.structuredClone === "function") {
      return global.structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function createModuleState(moduleId, data, lastLoadedAt) {
    return {
      moduleId: moduleId,
      lastLoadedAt: lastLoadedAt,
      data: cloneValue(data)
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

  function getState() {
    var snapshot = {};
    var keys = Object.keys(moduleStates);

    keys.forEach(function (moduleId) {
      var state = getModuleState(moduleId);
      if (state) {
        snapshot[moduleId] = state;
      }
    });

    return {
      modules: snapshot
    };
  }

  function normalizeLogLevel(level) {
    if (!level) return DEFAULT_SETTINGS.logLevel;
    var upper = String(level).toUpperCase();
    return Object.prototype.hasOwnProperty.call(LOG_LEVELS, upper) ? upper : DEFAULT_SETTINGS.logLevel;
  }

  function normalizeMaxLines(value) {
    var parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) return DEFAULT_SETTINGS.logMaxLines;
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
      if (normalized.logMaxLines === 0) {
        return clearLogs().then(function () {
          return normalized;
        });
      }
      return normalized;
    });
  }

  function loadModuleState(moduleId) {
    return global.TemplateIndexedDB.getById(global.TemplateIndexedDB.stores.MODULE_DATA, moduleId).then(function (record) {
      moduleStates[moduleId] = createModuleState(moduleId, record ? record.payload : null, new Date().toISOString());
      return getModuleState(moduleId);
    });
  }

  function saveModuleState(moduleId, payload, options) {
    var meta = options || {};
    var previousState = moduleStates[moduleId] || null;
    var previousUpdatedAt = previousState && previousState.data && previousState.data.updatedAt ? previousState.data.updatedAt : null;
    var hasConflict = !!(meta.expectedUpdatedAt && previousUpdatedAt && meta.expectedUpdatedAt !== previousUpdatedAt);
    var safePayload = cloneValue(payload);
    var payloadWithMeta = (safePayload && typeof safePayload === "object")
      ? Object.assign({}, safePayload, { updatedAt: new Date().toISOString() })
      : { value: safePayload, updatedAt: new Date().toISOString() };

    return global.TemplateIndexedDB.upsert(global.TemplateIndexedDB.stores.MODULE_DATA, {
      id: moduleId,
      payload: payloadWithMeta,
      updatedAt: new Date().toISOString()
    }).then(function () {
      return loadModuleState(moduleId).then(function (state) {
        if (!meta.expectedUpdatedAt) {
          return state;
        }
        return {
          state: state,
          conflict: hasConflict,
          previousUpdatedAt: previousUpdatedAt,
          expectedUpdatedAt: meta.expectedUpdatedAt || null
        };
      });
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
    if (maxLines === 0) {
      return clearLogs().then(function () {
        return [];
      });
    }

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
      if (settings.logMaxLines === 0) {
        return { written: false, reason: "max_lines_zero", settings: settings };
      }

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
      return global.TemplatePreferences.clearAll().then(function (clearedPreferences) {
        return { clearedPreferences: clearedPreferences };
      });
    });
  }

  function clearLocalPreferences() {
    return global.TemplatePreferences.clearAll().then(function (clearedPreferences) {
      return { clearedPreferences: clearedPreferences };
    });
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
    getState: getState,
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

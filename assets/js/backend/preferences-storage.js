(function initPreferencesStorage(global) {
  function failIfIndexedDBUnavailable() {
    if (!global.TemplateIndexedDB) {
      return Promise.reject(new Error("TemplateIndexedDB indisponivel"));
    }
    return null;
  }

  function get(key) {
    var unavailable = failIfIndexedDBUnavailable();
    if (unavailable) return unavailable;

    return global.TemplateIndexedDB
      .getById(global.TemplateIndexedDB.stores.PREFERENCES, key)
      .then(function (record) {
        return record ? record.payload : null;
      });
  }

  function set(key, value) {
    var unavailable = failIfIndexedDBUnavailable();
    if (unavailable) return unavailable;

    return global.TemplateIndexedDB
      .upsert(global.TemplateIndexedDB.stores.PREFERENCES, {
        id: key,
        payload: value,
        updatedAt: new Date().toISOString()
      })
      .then(function () {
        return value;
      });
  }

  function clearAll() {
    var unavailable = failIfIndexedDBUnavailable();
    if (unavailable) return unavailable;

    return global.TemplateIndexedDB
      .getAll(global.TemplateIndexedDB.stores.PREFERENCES)
      .then(function (records) {
        return global.TemplateIndexedDB.clearStore(global.TemplateIndexedDB.stores.PREFERENCES).then(function () {
          return records.length;
        });
      });
  }

  global.TemplatePreferences = {
    get: get,
    set: set,
    clearAll: clearAll
  };
})(window);

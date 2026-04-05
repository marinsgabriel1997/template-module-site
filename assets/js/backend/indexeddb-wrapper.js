(function initIndexedDBWrapper(global) {
  var DB_NAME = "template_sites_db";
  var DB_VERSION = 3;
  var STORE_MODULE_DATA = "module_data";
  var STORE_SETTINGS = "settings";
  var STORE_LOGS = "logs";
  var STORE_PREFERENCES = "preferences";
  var SETTINGS_ID = "global";
  var dbConnection = null;
  var dbPromise = null;

  function createStoreIfMissing(db, storeName, options) {
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, options);
    }
  }

  function runMigrations(db, oldVersion) {
    if (oldVersion < 1) {
      createStoreIfMissing(db, STORE_MODULE_DATA, { keyPath: "id" });
      createStoreIfMissing(db, STORE_SETTINGS, { keyPath: "id" });
    }

    if (oldVersion < 2) {
      createStoreIfMissing(db, STORE_LOGS, { keyPath: "id", autoIncrement: true });
    }

    if (oldVersion < 3) {
      createStoreIfMissing(db, STORE_PREFERENCES, { keyPath: "id" });
    }
  }

  function shouldPersistIndexedDBErrorLog(db) {
    if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
      return Promise.resolve(true);
    }

    return new Promise(function (resolve) {
      var tx = db.transaction(STORE_SETTINGS, "readonly");
      var store = tx.objectStore(STORE_SETTINGS);
      var req = store.get(SETTINGS_ID);

      req.onsuccess = function () {
        var record = req.result;
        var payload = record && record.payload ? record.payload : null;
        var parsedMaxLines = parseInt(payload && payload.logMaxLines, 10);
        var maxLines = isNaN(parsedMaxLines) || parsedMaxLines < 0 ? 5000 : parsedMaxLines;
        resolve(maxLines > 0);
      };

      req.onerror = function () {
        resolve(true);
      };
    });
  }

  function persistIndexedDBErrorLog(db, message, additionalData, storeName) {
    if (storeName === STORE_LOGS) {
      return Promise.resolve(false);
    }

    if (!db.objectStoreNames.contains(STORE_LOGS)) {
      return Promise.resolve(false);
    }

    return shouldPersistIndexedDBErrorLog(db).then(function (enabled) {
      if (!enabled) return false;

      return new Promise(function (resolve) {
        var tx = db.transaction(STORE_LOGS, "readwrite");
        var store = tx.objectStore(STORE_LOGS);
        var req = store.add({
          level: "ERROR",
          module: "indexeddb-wrapper",
          message: message,
          additionalData: additionalData || null,
          createdAt: new Date().toISOString()
        });

        req.onsuccess = function () {
          resolve(true);
        };

        req.onerror = function () {
          resolve(false);
        };
      });
    }).catch(function () {
      return false;
    });
  }

  function openDB() {
    if (dbConnection) {
      return Promise.resolve(dbConnection);
    }

    if (dbPromise) {
      return dbPromise;
    }

    dbPromise = new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        var db = request.result;
        runMigrations(db, event.oldVersion || 0);
      };

      request.onsuccess = function () {
        dbConnection = request.result;
        dbConnection.onversionchange = function () {
          if (dbConnection) {
            dbConnection.close();
          }
          dbConnection = null;
          dbPromise = null;
        };
        resolve(dbConnection);
      };

      request.onerror = function () {
        dbPromise = null;
        reject(request.error || new Error("Falha ao abrir IndexedDB"));
      };
    });

    return dbPromise;
  }

  function getById(storeName, id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, "readonly");
        var store = tx.objectStore(storeName);
        var req = store.get(id);

        req.onsuccess = function () {
          resolve(req.result || null);
        };
        req.onerror = function () {
          persistIndexedDBErrorLog(db, "Falha ao buscar registro", {
            storeName: storeName,
            id: id,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao buscar registro"));
          });
        };
      });
    });
  }

  function upsert(storeName, value) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, "readwrite");
        var store = tx.objectStore(storeName);
        var req = store.put(value);

        req.onsuccess = function () {
          resolve(value);
        };
        req.onerror = function () {
          persistIndexedDBErrorLog(db, "Falha ao salvar registro", {
            storeName: storeName,
            id: value && value.id,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao salvar registro"));
          });
        };
      });
    });
  }

  function add(storeName, value) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, "readwrite");
        var store = tx.objectStore(storeName);
        var req = store.add(value);

        req.onsuccess = function () {
          resolve(req.result);
        };
        req.onerror = function () {
          persistIndexedDBErrorLog(db, "Falha ao adicionar registro", {
            storeName: storeName,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao adicionar registro"));
          });
        };
      });
    });
  }

  function getAll(storeName) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, "readonly");
        var store = tx.objectStore(storeName);
        var req = store.getAll();

        req.onsuccess = function () {
          resolve(req.result || []);
        };
        req.onerror = function () {
          persistIndexedDBErrorLog(db, "Falha ao listar registros", {
            storeName: storeName,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao listar registros"));
          });
        };
      });
    });
  }

  function deleteById(storeName, id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, "readwrite");
        var store = tx.objectStore(storeName);
        var req = store.delete(id);

        req.onsuccess = function () {
          resolve(true);
        };
        req.onerror = function () {
          persistIndexedDBErrorLog(db, "Falha ao remover registro", {
            storeName: storeName,
            id: id,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao remover registro"));
          });
        };
      });
    });
  }

  function clearStore(storeName) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, "readwrite");
        var store = tx.objectStore(storeName);
        var req = store.clear();

        req.onsuccess = function () {
          resolve(true);
        };
        req.onerror = function () {
          persistIndexedDBErrorLog(db, "Falha ao limpar store", {
            storeName: storeName,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao limpar store"));
          });
        };
      });
    });
  }

  function deleteDatabase() {
    if (dbConnection) {
      dbConnection.close();
      dbConnection = null;
    }
    dbPromise = null;

    return new Promise(function (resolve, reject) {
      var request = indexedDB.deleteDatabase(DB_NAME);

      request.onsuccess = function () {
        resolve(true);
      };

      request.onerror = function () {
        reject(request.error || new Error("Falha ao apagar banco IndexedDB"));
      };

      request.onblocked = function () {
        reject(new Error("Remocao do banco bloqueada por outra aba aberta"));
      };
    });
  }

  global.TemplateIndexedDB = {
    stores: {
      MODULE_DATA: STORE_MODULE_DATA,
      SETTINGS: STORE_SETTINGS,
      LOGS: STORE_LOGS,
      PREFERENCES: STORE_PREFERENCES
    },
    getById: getById,
    upsert: upsert,
    add: add,
    getAll: getAll,
    deleteById: deleteById,
    clearStore: clearStore,
    deleteDatabase: deleteDatabase
  };
})(window);

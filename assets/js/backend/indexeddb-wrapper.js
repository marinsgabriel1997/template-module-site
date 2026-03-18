(function initIndexedDBWrapper(global) {
  var DB_NAME = "template_sites_db";
  var DB_VERSION = 2;
  var STORE_MODULE_DATA = "module_data";
  var STORE_SETTINGS = "settings";
  var STORE_LOGS = "logs";
  var SETTINGS_ID = "global";

  function shouldPersistIndexedDBLog(db) {
    if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
      return Promise.resolve(false);
    }

    return new Promise(function (resolve) {
      var tx = db.transaction(STORE_SETTINGS, "readonly");
      var store = tx.objectStore(STORE_SETTINGS);
      var req = store.get(SETTINGS_ID);

      req.onsuccess = function () {
        var record = req.result;
        var payload = record && record.payload ? record.payload : null;
        var logLevel = payload && payload.logLevel ? String(payload.logLevel).toUpperCase() : "INFO";
        resolve(logLevel === "DEBUG");
      };

      req.onerror = function () {
        resolve(false);
      };
    });
  }

  function persistIndexedDBLog(db, level, message, additionalData, storeName) {
    if (storeName === STORE_LOGS) {
      return Promise.resolve(false);
    }

    if (!db.objectStoreNames.contains(STORE_LOGS)) {
      return Promise.resolve(false);
    }

    return shouldPersistIndexedDBLog(db).then(function (enabled) {
      if (!enabled) return false;

      return new Promise(function (resolve) {
        var tx = db.transaction(STORE_LOGS, "readwrite");
        var store = tx.objectStore(STORE_LOGS);
        var req = store.add({
          level: level,
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
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE_MODULE_DATA)) {
          db.createObjectStore(STORE_MODULE_DATA, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_LOGS)) {
          db.createObjectStore(STORE_LOGS, { keyPath: "id", autoIncrement: true });
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error || new Error("Falha ao abrir IndexedDB"));
      };
    });
  }

  function getById(storeName, id) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(storeName, "readonly");
        var store = tx.objectStore(storeName);
        var req = store.get(id);

        req.onsuccess = function () {
          persistIndexedDBLog(db, "DEBUG", "Leitura por id concluida", {
            storeName: storeName,
            id: id,
            found: !!req.result
          }, storeName).then(function () {
            resolve(req.result || null);
          });
        };
        req.onerror = function () {
          persistIndexedDBLog(db, "ERROR", "Falha ao buscar registro", {
            storeName: storeName,
            id: id,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao buscar registro"));
          });
        };
      }).finally(function () {
        db.close();
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
          persistIndexedDBLog(db, "DEBUG", "Gravacao concluida", {
            storeName: storeName,
            id: value && value.id
          }, storeName).then(function () {
            resolve(value);
          });
        };
        req.onerror = function () {
          persistIndexedDBLog(db, "ERROR", "Falha ao salvar registro", {
            storeName: storeName,
            id: value && value.id,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao salvar registro"));
          });
        };
      }).finally(function () {
        db.close();
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
          persistIndexedDBLog(db, "DEBUG", "Inclusao concluida", {
            storeName: storeName,
            id: req.result
          }, storeName).then(function () {
            resolve(req.result);
          });
        };
        req.onerror = function () {
          persistIndexedDBLog(db, "ERROR", "Falha ao adicionar registro", {
            storeName: storeName,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao adicionar registro"));
          });
        };
      }).finally(function () {
        db.close();
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
          persistIndexedDBLog(db, "DEBUG", "Listagem concluida", {
            storeName: storeName,
            total: (req.result || []).length
          }, storeName).then(function () {
            resolve(req.result || []);
          });
        };
        req.onerror = function () {
          persistIndexedDBLog(db, "ERROR", "Falha ao listar registros", {
            storeName: storeName,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao listar registros"));
          });
        };
      }).finally(function () {
        db.close();
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
          persistIndexedDBLog(db, "DEBUG", "Remocao por id concluida", {
            storeName: storeName,
            id: id
          }, storeName).then(function () {
            resolve(true);
          });
        };
        req.onerror = function () {
          persistIndexedDBLog(db, "ERROR", "Falha ao remover registro", {
            storeName: storeName,
            id: id,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao remover registro"));
          });
        };
      }).finally(function () {
        db.close();
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
          persistIndexedDBLog(db, "DEBUG", "Limpeza de store concluida", {
            storeName: storeName
          }, storeName).then(function () {
            resolve(true);
          });
        };
        req.onerror = function () {
          persistIndexedDBLog(db, "ERROR", "Falha ao limpar store", {
            storeName: storeName,
            error: req.error ? req.error.message : null
          }, storeName).then(function () {
            reject(req.error || new Error("Falha ao limpar store"));
          });
        };
      }).finally(function () {
        db.close();
      });
    });
  }

  function deleteDatabase() {
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
      LOGS: STORE_LOGS
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

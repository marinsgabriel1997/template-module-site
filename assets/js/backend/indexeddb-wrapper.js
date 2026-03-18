(function initIndexedDBWrapper(global) {
  var DB_NAME = "template_sites_db";
  var DB_VERSION = 2;
  var STORE_MODULE_DATA = "module_data";
  var STORE_SETTINGS = "settings";
  var STORE_LOGS = "logs";

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
          resolve(req.result || null);
        };
        req.onerror = function () {
          reject(req.error || new Error("Falha ao buscar registro"));
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
          resolve(value);
        };
        req.onerror = function () {
          reject(req.error || new Error("Falha ao salvar registro"));
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
          resolve(req.result);
        };
        req.onerror = function () {
          reject(req.error || new Error("Falha ao adicionar registro"));
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
          resolve(req.result || []);
        };
        req.onerror = function () {
          reject(req.error || new Error("Falha ao listar registros"));
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
          resolve(true);
        };
        req.onerror = function () {
          reject(req.error || new Error("Falha ao remover registro"));
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
          resolve(true);
        };
        req.onerror = function () {
          reject(req.error || new Error("Falha ao limpar store"));
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

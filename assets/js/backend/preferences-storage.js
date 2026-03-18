(function initPreferencesStorage(global) {
  var PREFIX = "template_sites_pref:";

  function get(key) {
    var raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return raw;
    }
  }

  function set(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return value;
  }

  function clearAll() {
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i += 1) {
      var key = localStorage.key(i);
      if (key && key.indexOf(PREFIX) === 0) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(function (key) {
      localStorage.removeItem(key);
    });
    return keysToRemove.length;
  }

  global.TemplatePreferences = {
    get: get,
    set: set,
    clearAll: clearAll
  };
})(window);

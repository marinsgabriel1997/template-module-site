(function initTemplateLogger(global) {
  function createLogger(moduleName) {
    function write(level, message, additionalData) {
      return global.TemplateBackend.dispatch(global.TemplateBackend.ACTIONS.WRITE_LOG, {
        level: level,
        module: moduleName,
        message: message,
        additionalData: additionalData || null
      }).then(function (result) {
        if (!result || !result.ok) {
          console.error("[logger] Falha ao persistir log", {
            module: moduleName,
            level: level,
            message: message
          });
        }
        return result;
      }).catch(function (error) {
        console.error("[logger] Erro ao persistir log", {
          module: moduleName,
          level: level,
          message: message,
          error: error && error.message ? error.message : null
        });
        return { ok: false };
      });
    }

    return {
      debug: function (message, additionalData) {
        return write("DEBUG", message, additionalData);
      },
      info: function (message, additionalData) {
        return write("INFO", message, additionalData);
      },
      warn: function (message, additionalData) {
        return write("WARN", message, additionalData);
      },
      error: function (message, additionalData) {
        return write("ERROR", message, additionalData);
      }
    };
  }

  global.TemplateFrontend = global.TemplateFrontend || {};
  global.TemplateFrontend.logger = {
    createLogger: createLogger
  };
})(window);

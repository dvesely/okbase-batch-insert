(() => {
  // src/lib/logger.js
  var MAX_LOGS = 20;
  var Logger = class {
    _logs = [];
    _onChnageHooks = [];
    log(...args) {
      pushMax(this._logs, JSON.stringify(args), MAX_LOGS);
      for (const callback of this._onChnageHooks) {
        callback(this._logs.slice(0));
      }
    }
    onChange(callback) {
      this._onChnageHooks.push(callback);
    }
  };
  var logger = new Logger();
  function pushMax(arr, value, max) {
    if (arr.length >= max) {
      arr.splice(0, arr.length - max + 1);
    }
    arr.push(value);
    return arr;
  }

  // src/lib/storage.js
  var Storage = class {
    constructor(storage2) {
      this._storage = storage2;
    }
    get(syncName) {
      log("on get", syncName);
      return new Promise((resolve) => {
        this._storage.get([syncName], (result) => {
          const value = result[syncName];
          resolve(value);
          log("get", syncName, value);
        });
      });
    }
    set(syncName, value) {
      log("on set", syncName, value);
      return new Promise((resolve) => {
        this._storage.set({[syncName]: value}, function() {
          resolve();
          log("set", syncName, value);
        });
      });
    }
  };
  var storage = new Storage(chrome.storage.sync);
  function log(...args) {
    logger.log("storage", ...args);
  }

  // src/content-scripts/load-interrupts.js
  (function() {
    chrome.runtime.sendMessage("INTERRUPT_ITEMS_LOADED");
  })();
})();

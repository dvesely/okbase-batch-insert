import { logger } from "./logger.js";

class Storage {
  constructor(storage) {
    this._storage = storage;
  }

  /**
   *
   * @param {string} syncName
   */
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

  /**
   *
   * @param {string} syncName
   * @param {any} value
   */
  set(syncName, value) {
    log("on set", syncName, value);

    return new Promise((resolve) => {
      this._storage.set({ [syncName]: value }, function () {
        resolve();
        log("set", syncName, value);
      });
    });
  }

  /**
   *
   * @param {string} syncName
   */
  del(syncName) {
    return new Promise((resolve) => {
      this._storage.remove([syncName], function () {
        resolve();
        log("del", syncName);
      });
    });
  }
}

export const storage = new Storage(chrome.storage.sync);

function log(...args) {
  logger.log("storage", ...args);
}

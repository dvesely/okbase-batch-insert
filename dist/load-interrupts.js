(() => {
  // src/lib/logger.js
  var MAX_LOGS = 20;
  var Logger = class {
    _logs = [];
    _onChnageHooks = [];
    clear() {
      this._logs = [];
      this._callCallbacks();
    }
    log(...args) {
      pushMax(this._logs, JSON.stringify(args), MAX_LOGS);
      this._callCallbacks();
    }
    _callCallbacks() {
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
    del(syncName) {
      return new Promise((resolve) => {
        this._storage.remove([syncName], function() {
          resolve();
          log("del", syncName);
        });
      });
    }
  };
  var storage = new Storage(chrome.storage.sync);
  function log(...args) {
    logger.log("storage", ...args);
  }

  // src/utils/commonUtil.js
  function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // src/utils/domUtil.js
  async function getSelectBoxItems(form, name) {
    const sb = findWidgetElement(form, name);
    if (sb == null)
      throw `SelectBox '${name}' was not found.`;
    const btnArrow = sb.querySelector(".dijitArrowButton");
    if (btnArrow == null)
      throw `SelectBox '${name}' btnArrow not found.`;
    fireEvent(btnArrow, "pointerdown");
    await wait(200);
    const items = (await findElement(`#${form.id}_${name}_popup`)).querySelectorAll(".dijitMenuItem");
    return items;
  }
  function findFormElement(form, name) {
    const ctrl = form.querySelector(`#${form.id}_${name}`);
    return ctrl;
  }
  function findWidgetElement(form, name) {
    const ctrl = form.querySelector(`#widget_${form.id}_${name}`);
    return ctrl;
  }
  async function findElement(selector, parent, callback) {
    const ms = 200;
    const maxTime = 3e3;
    const test = parent == null ? document : parent;
    return new Promise((resolve, reject) => {
      let current = 0;
      setInterval(function() {
        if (current >= maxTime) {
          reject(`Selector '${selector}' not found after ${maxTime / 1e3}secs.`);
        }
        current += ms;
        const el = test.querySelector(selector);
        if (el !== null) {
          if (typeof callback === "function") {
            resolve(callback(el));
          } else {
            resolve(el);
          }
        }
      }, ms);
    });
  }
  function fireEvent(el, name) {
    el.dispatchEvent(new Event(name));
  }

  // src/utils/okBaseUtil.js
  async function loadForm() {
    const insertButton = document.querySelector(".ContextMenuButton.is-vlozit");
    insertButton.click();
    const dialog = await findElement(".planovani-dialog");
    const form = await findElement(".PlanovaniDetail", dialog);
    const typyPreruseni = findFormElement(form, "typyPreruseni");
    const btnOdDo = typyPreruseni.querySelector(".ButtonSelect");
    btnOdDo.click();
    await wait(100);
    return {
      dialog,
      form
    };
  }
  async function closeDialog(dialog) {
    const btnClose = dialog.querySelector('[data-dojo-attach-point="closeButtonNode"]');
    btnClose.click();
  }

  // src/content-scripts/load-interrupts.js
  (function() {
    loadSelectBox().catch((error) => {
      alert(error);
    });
  })();
  async function loadSelectBox() {
    const {dialog, form} = await loadForm();
    const itemElements = Array.from(await getSelectBoxItems(form, "preruseniZacatek"));
    const items = itemElements.map((x) => x.innerText);
    document.body.click(itemElements && itemElements[0].click());
    await storage.set("interruptItems", items);
    closeDialog(dialog);
    chrome.runtime.sendMessage("INTERRUPT_ITEMS_LOADED");
  }
})();

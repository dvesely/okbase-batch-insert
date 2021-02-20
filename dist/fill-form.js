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

  // src/utils/commonUtil.js
  function wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // src/utils/dateTimeUtil.js
  function isEqualDateTime(d1, d2) {
    return compareDate(d1, d2) < 1e3;
  }
  function compareDate(d1, d2) {
    return d1.getTime() - d2.getTime();
  }
  function isValidDate(date) {
    return date && date.getTime && typeof date.getTime === "function" && date.getTime() > 0;
  }
  function getDateTime(date, time) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), time.getSeconds());
  }
  function getTime(date) {
    return new Date(0, 0, 1, date.getHours(), date.getMinutes(), date.getSeconds());
  }
  function getDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  function parseDateTimeFromGrid(dateTime) {
    const [date, time] = dateTime.trim().split(" ");
    const [day, month, year] = date.split(".");
    const [hours, minutes] = time.split(":");
    return new Date(year, Number(month) - 1, day, hours, minutes);
  }
  async function parseDateTimeFromStorage(dateName, timeName) {
    const dateStr = await storage.get(dateName);
    const timeStr = await storage.get(timeName);
    const datePattern = /^\s*\d{4}-\d\d-\d\d\s*$/;
    const timePattern = /^\s*\d\d:\d\d\s*$/;
    if (!dateStr || !timeStr || !datePattern.test(dateStr) || !timePattern.test(timeStr)) {
      return null;
    }
    const [year, month, day] = dateStr.trim().split("-");
    const [hours, minutes] = timeStr.trim().split(":");
    return new Date(year, month - 1, day, hours, minutes);
  }
  function formatDate(date) {
    return [
      date.getDate(),
      date.getMonth() + 1,
      date.getFullYear()
    ].join(".");
  }
  function formatTime(date) {
    return date.getHours() + ":" + date.getMinutes();
  }

  // src/utils/domUtil.js
  async function setDateTextBox(form, name, date) {
    const widget = findWidgetElement(form, name);
    if (widget === null)
      throw `Widget DateBox '${name}' not found.`;
    const tb = findFormElement(form, name);
    if (tb == null)
      throw `Widget DateBox '${name}' has not TextBox.`;
    fireEvent(widget, "focus");
    await wait(200);
    tb.value = date;
    fireEvent(widget, "blur");
    await wait(200);
    fireEvent(widget, "focus");
    fireEvent(widget, "blur");
  }
  async function setTextBox(form, name, value) {
    const tb = findFormElement(form, name);
    if (tb === null)
      throw `TextBox '${name}' not found.`;
    tb.value = value;
  }
  async function setSelectBox(form, name, textValue) {
    const items = await getSelectBoxItems(form, name);
    textValue = textValue && textValue.toUpperCase();
    let found = false;
    for (const item of items) {
      if (item.innerText.toUpperCase() === textValue) {
        item.click();
        found = true;
        break;
      }
    }
    if (!found)
      throw `SelectBox '${name}' item '${textValue}' not found.`;
  }
  async function getSelectBoxItems(form, name) {
    const sb = findWidgetElement(form, name);
    if (sb == null)
      throw `SelectBox '${name}' was not found.`;
    const btnArrow = sb.querySelector(".dijitArrowButton");
    if (btnArrow == null)
      throw `SelectBox '${name}' btnArrow not found.`;
    fireEvent(btnArrow, "pointerdown");
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
        ;
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

  // src/content-scripts/fill-form.js
  (function() {
    fillForm().catch((error) => {
      alert(error);
    });
  })();
  async function fillForm() {
    const grid = document.querySelector(".dgrid.PlanovaniGrid");
    if (grid == null)
      throw `Grid was not found.`;
    const from = await parseDateTimeFromStorage("dateFrom", "timeFrom");
    const to = await parseDateTimeFromStorage("dateTo", "timeTo");
    const beginInterrupt = await storage.get("beginInterrupt");
    const endInterrupt = await storage.get("endInterrupt");
    if (!isValidDate(from) || !isValidDate(to) || !beginInterrupt || !endInterrupt) {
      throw `You must fill all fields.`;
    }
    const record = {
      from,
      to,
      beginInterrupt,
      endInterrupt
    };
    await addDays(grid, record);
  }
  async function addDays(grid, {from, to, beginInterrupt, endInterrupt}) {
    const timeFrom = getTime(from);
    const timeTo = getTime(to);
    let date = getDate(from);
    while (date <= to) {
      if (isBusinessDay(date)) {
        const record = {
          from: getDateTime(date, timeFrom),
          to: getDateTime(date, timeTo),
          beginInterrupt,
          endInterrupt
        };
        await insertRecord(grid, record);
      }
      date.setDate(date.getDate() + 1);
    }
  }
  async function insertRecord(grid, {from, to, beginInterrupt, endInterrupt}) {
    const {dialog, form} = await loadForm();
    await Promise.all([
      setSelectBox(form, "preruseniZacatek", beginInterrupt),
      setSelectBox(form, "preruseniKonec", endInterrupt),
      setTextBox(form, "casOd", formatTime(from)),
      setTextBox(form, "casDo", formatTime(to))
    ]);
    await setDateTextBox(form, "datumOd", formatDate(from));
    await setDateTextBox(form, "datumDo_", formatDate(to));
    const btnSubmit = dialog.querySelector(".button-primary .dijitButtonNode");
    btnSubmit.click();
    const maxWait = 3e3;
    let waiting = 0;
    while (true) {
      await wait(200);
      waiting += 200;
      if (await hasRecord(grid, {from, to})) {
        return;
      }
      if (waiting > maxWait) {
        throw `Inserting '${from.toLocaleString()} - ${to.toLocaleString()}' item timeout.`;
      }
    }
  }
  async function hasRecord(grid, {from, to}) {
    const begins = grid.querySelectorAll(".dgrid-content td.field-zacatek");
    for (const begin of begins) {
      const dateFrom = parseDateTimeFromGrid(begin.innerText);
      if (!isValidDate(dateFrom) || !isEqualDateTime(from, dateFrom))
        continue;
      const end = begin.parentElement.querySelector("td.field-konec");
      const dateTo = parseDateTimeFromGrid(end.innerText);
      if (!isValidDate(dateTo) || !isEqualDateTime(to, dateTo))
        continue;
      return true;
    }
    return false;
  }
  function isBusinessDay(date) {
    return !isWeekend(date);
  }
  function isWeekend(date) {
    return date.getDay() === 0 || date.getDay() === 6;
  }
})();

import { logger } from "../lib/logger.js";
import { storage } from "../lib/storage.js";
import { formatDateJson } from "../utils/dateTimeUtil.js";

// const logOutput = document.querySelector("#log");

// logger.onChange((logs) => {
//   logOutput.innerHTML = logs.map((x) => `<div>${x}</div>`).join("");
// });

const changeColor = document.getElementById("changeColor");
const btnLoadItems = document.getElementById("btnLoadItems");

(async function () {
  const today = formatDateJson(new Date());
  let lastUsed = await storage.get("lastUsed");

  if (!lastUsed) {
    await storage.set("lastUsed", today);
    lastUsed = today;
  }

  if (lastUsed < today) {
    await storage.set("lastUsed", today);
    updateFlatPickrInputDate("dateFrom", "#dateFrom", today);
  }
})();

flatpickr.localize(flatpickr.l10ns.cs);

initDatePicker("#dateFrom", "dateFrom");
initDatePicker("#dateTo", "dateTo");

initTimePicker("#timeFrom", "timeFrom");
initTimePicker("#timeTo", "timeTo");

initSyncSelectBox("beginInterrupt", "#beginInterrupt");
initSyncSelectBox("endInterrupt", "#endInterrupt");

reloadSelectBoxItems();

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", createScript("fill-form.js"));
btnLoadItems.addEventListener("click", createScript("load-interrupts.js"));

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  logger.log("message", message, message !== "INTERRUPT_ITEMS_LOADED");

  if (message !== "INTERRUPT_ITEMS_LOADED") return;

  reloadSelectBoxItems();
});

function createScript(file) {
  return async () => {
    logger.log("execute script", file);

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["/dist/" + file],
    });
  };
}

// // The body of this function will be execuetd as a content script inside the
// // current page
// function setPageBackgroundColor() {
//   chrome.storage.sync.get("color", ({ color }) => {
//     document.body.style.backgroundColor = "#fff";
//   });
// }

function initDatePicker(selector, syncName) {
  return initSyncPicker(syncName, selector, {});
}

function initTimePicker(selector, syncName) {
  return initSyncPicker(syncName, selector, {
    enableTime: true,
    noCalendar: true,
    time_24hr: true,
  });
}

async function initSyncPicker(syncName, selector, options) {
  const value = await storage.get(syncName);

  logger.log("affter get", selector, syncName, value);

  options.defaultDate = value;

  const instance = initFlatpickr(selector, options);

  instance.config.onValueUpdate.push(onChange.bind(syncName));
}

function initFlatpickr(selector, options) {
  const instance = flatpickr(selector, options);

  return instance;
}

async function initSyncSelectBox(syncName, selector) {
  const sb = document.querySelector(selector);

  sb.addEventListener("change", onChnageSelectBox.bind(syncName));
}

async function reloadSelectBoxItems() {
  const sbInterruptBegin = document.getElementById("beginInterrupt");
  const sbInterruptEnd = document.getElementById("endInterrupt");

  const items = await storage.get("interruptItems");

  const options = items
    .map((x) => `<option value="${x}">${x}</option>`)
    .join("");

  sbInterruptBegin.innerHTML = options;
  sbInterruptEnd.innerHTML = options;

  const beginValue = await storage.get("beginInterrupt");
  const endValue = await storage.get("endInterrupt");

  sbInterruptBegin.value = beginValue;
  sbInterruptEnd.value = endValue;
}

async function onChange(selectedDate, dateStr, instance) {
  const syncName = this;

  // zajisteni aby from nebylo vetsi jak to
  switch (syncName) {
    case "dateFrom":
      const to = await storage.get("dateTo");
      if (dateStr > to) {
        await updateFlatPickrInputDate("dateTo", "#dateTo", dateStr);
      }
      break;
    case "dateTo":
      const from = await storage.get("dateFrom");
      if (dateStr < from) {
        await updateFlatPickrInputDate("dateFrom", "#dateFrom", dateStr);
      }
      break;
    default:
      break;
  }

  await storage.set(syncName, dateStr);
}

/**
 * Nastavi inputu s instanci _flatpickr datum s hodnotou dateStr
 * @param {string} syncName 
 * @param {string} selector 
 * @param {string} value 
 */
async function updateFlatPickrInputDate(syncName, selector, value) {
  const input = document.querySelector(selector);

  if (!input)
    throw new Error(`Flapickr input with selector '${selector}' not found.`);

  input._flatpickr.setDate(value, true);
}

async function onChnageSelectBox({ target }) {
  const syncName = this;
  const value = target.value;

  await storage.set(syncName, value);

  logger.log("change select box", syncName, value);
}

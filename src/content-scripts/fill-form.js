import { storage } from "../lib/storage";
import {
  getTime,
  getDate,
  getDateTime,
  isValidDate,
  isEqualDateTime,
  parseDateTimeFromGrid,
  setSelectBox,
  setTextBox,
  setDateTextBox,
  formatTime,
  formatDate,
  wait,
  parseDateTimeFromStorage,
} from "../utils";
import { loadForm } from "../utils/okBaseUtil";

/**
 * @typedef {Object} Record
 * @property {Date} from
 * @property {Date} to
 * @property {string} beginInterrupt
 * @property {string} endInterrupt
 */

(function () {
  fillForm().catch((error) => {
    alert(error);
  });
})();

async function fillForm() {
  const grid = document.querySelector(".dgrid.PlanovaniGrid");

  if (grid == null) throw `Grid was not found.`;

  const from = await parseDateTimeFromStorage("dateFrom", "timeFrom");
  const to = await parseDateTimeFromStorage("dateTo", "timeTo");
  const beginInterrupt = await storage.get("beginInterrupt");
  const endInterrupt = await storage.get("endInterrupt");

  if (
    !isValidDate(from) ||
    !isValidDate(to) ||
    !beginInterrupt ||
    !endInterrupt
  ) {
    throw `You must fill all fields.`;
  }

  const record = {
    from,
    to,
    beginInterrupt,
    endInterrupt,
  };

  //console.log(record);
  await addDays(grid, record);
}

/**
 *
 * @param {Element} grid
 * @param {Record} record
 */
async function addDays(grid, { from, to, beginInterrupt, endInterrupt }) {
  const timeFrom = getTime(from);
  const timeTo = getTime(to);

  let date = getDate(from);

  while (date <= to) {
    if (isBusinessDay(date)) {
      const record = {
        from: getDateTime(date, timeFrom),
        to: getDateTime(date, timeTo),
        beginInterrupt,
        endInterrupt,
      };

      await insertRecord(grid, record);
    }

    date.setDate(date.getDate() + 1); // add day
  }
}

/**
 *
 * @param {Element} grid
 * @param {Record} record
 */
async function insertRecord(grid, { from, to, beginInterrupt, endInterrupt }) {
  const { dialog, form } = await loadForm();

  await Promise.all([
    setSelectBox(form, "preruseniZacatek", beginInterrupt),
    setSelectBox(form, "preruseniKonec", endInterrupt),
    setTextBox(form, "casOd", formatTime(from)),
    setTextBox(form, "casDo", formatTime(to)),
  ]);

  await setDateTextBox(form, "datumOd", formatDate(from));
  await setDateTextBox(form, "datumDo_", formatDate(to));

  // insert
  const btnSubmit = dialog.querySelector(".button-primary .dijitButtonNode");
  btnSubmit.click();

  // check if was inserted
  const maxWait = 3000;
  let waiting = 0;

  while (true) {
    await wait(200);
    waiting += 200;

    if (await hasRecord(grid, { from, to })) {
      return;
    }

    if (waiting > maxWait) {
      throw `Inserting '${from.toLocaleString()} - ${to.toLocaleString()}' item timeout.`;
    }
  }
}

async function hasRecord(grid, { from, to }) {
  const begins = grid.querySelectorAll(".dgrid-content td.field-zacatek");

  for (const begin of begins) {
    const dateFrom = parseDateTimeFromGrid(begin.innerText);

    if (!isValidDate(dateFrom) || !isEqualDateTime(from, dateFrom)) continue;

    const end = begin.parentElement.querySelector("td.field-konec");
    const dateTo = parseDateTimeFromGrid(end.innerText);

    if (!isValidDate(dateTo) || !isEqualDateTime(to, dateTo)) continue;

    return true;
  }

  return false;
}

function isBusinessDay(date) {
  return !isWeekend(date);
}

function isWeekend(date) {
  return (
    date.getDay() === 0 || // sunday
    date.getDay() === 6 // saturday
  );
}

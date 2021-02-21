import { storage } from "../lib/storage";

export function isEqualDateTime(d1, d2) {
  return compareDate(d1, d2) < 1000;
}

export function compareDate(d1, d2) {
  return d1.getTime() - d2.getTime();
}

export function isValidDate(date) {
  return (
    date &&
    date.getTime &&
    typeof date.getTime === "function" &&
    date.getTime() > 0
  );
}

/**
 *
 * @param {Date} date
 * @param {Date} time
 */
export function getDateTime(date, time) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    time.getSeconds()
  );
}

/**
 *
 * @param {Date} date
 */
export function getTime(date) {
  return new Date(
    0,
    0,
    1,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
}

/**
 *
 * @param {Date} date
 */
export function getDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 *
 * @param {string} dateTime
 */
export function parseDateTimeFromGrid(dateTime) {
  const [date, time] = dateTime.trim().split(" ");
  const [day, month, year] = date.split(".");
  const [hours, minutes] = time.split(":");

  return new Date(year, Number(month) - 1, day, hours, minutes);
}

/**
 *
 * @param {string} dateName nazev promenne ve storage
 * @param {string} timeName nazev promenne ve storage
 * @return {Date | null}
 */
export async function parseDateTimeFromStorage(dateName, timeName) {
  const dateStr = await storage.get(dateName);
  const timeStr = await storage.get(timeName);

  const datePattern = /^\s*\d{4}-\d\d-\d\d\s*$/;
  const timePattern = /^\s*\d\d:\d\d\s*$/;

  if (
    !dateStr ||
    !timeStr ||
    !datePattern.test(dateStr) ||
    !timePattern.test(timeStr)
  ) {
    return null;
  }

  const [year, month, day] = dateStr.trim().split("-");
  const [hours, minutes] = timeStr.trim().split(":");

  return new Date(year, month - 1, day, hours, minutes);
}

/**
 *
 * @param {Date} date
 */
export function formatDateJson(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("-");
}

/**
 *
 * @param {Date} date
 */
export function formatDate(date) {
  return [date.getDate(), date.getMonth() + 1, date.getFullYear()].join(".");
}

/**
 *
 * @param {Date} date
 */
export function formatTime(date) {
  return date.getHours() + ":" + addZero(date.getMinutes());
}

/**
 *
 * @param {number} num
 */
function addZero(num) {
  return num < 10 ? "0" + num : num;
}

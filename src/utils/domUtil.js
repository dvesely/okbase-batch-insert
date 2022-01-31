import { wait } from "./commonUtil.js";

export async function setDateTextBox(form, name, date) {
  const widget = findWidgetElement(form, name);

  if (widget === null) throw `Widget DateBox '${name}' not found.`;

  const tb = findFormElement(form, name);

  if (tb == null) throw `Widget DateBox '${name}' has not TextBox.`;

  //const hidden = tb.parentElement.querySelector('input[type="hidden"]');

  //if (hidden == null) throw `DateTextBox '${name}' hidden input not exists.`;

  fireEvent(widget, "focus");

  await wait(200);

  tb.value = date;
  fireEvent(widget, "blur");

  await wait(200);

  fireEvent(widget, "focus");
  fireEvent(widget, "blur");
}

export async function setTextBox(form, name, value) {
  const tb = findFormElement(form, name);

  if (tb === null) throw `TextBox '${name}' not found.`;

  tb.value = value;
}

export async function setSelectBox(form, name, textValue) {
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

  if (!found) throw `SelectBox '${name}' item '${textValue}' not found.`;
}

/**
 *
 * @param {Element} form
 * @param {string} name
 * @return {NodeList}
 */
export async function getSelectBoxItems(form, name) {
  const sb = findWidgetElement(form, name);

  if (sb == null) throw `SelectBox '${name}' was not found.`;

  const btnArrow = sb.querySelector(".dijitArrowButton");

  if (btnArrow == null) throw `SelectBox '${name}' btnArrow not found.`;

  const popupName = `#${form.id}_${name}_popup`;

  await fireEventUntil(btnArrow, "pointerdown", () => findElement(popupName, null, null, 300).then(() => true));

  const items = (
    await findElement(popupName)
  ).querySelectorAll(".dijitMenuItem");

  return items;
}

/**
 * 
 * @param {HTMLElement} el 
 * @param {string} name Event name
 * @param {() => Promise<bool>} interrupt Podminka kdy se volani eventu prerusi 
 */
export async function fireEventUntil(el, name, interrupt) {
	let fires = 0;
	do {
		fireEvent(el, name);
		fires++;
		if (await interrupt().catch(() => false)) {
			break;
		}
	} while (fires <= 3);
}

export function findFormElement(form, name) {
  const ctrl = form.querySelector(`#${form.id}_${name}`);

  return ctrl;
}

export function findWidgetElement(form, name) {
  const ctrl = form.querySelector(`#widget_${form.id}_${name}`);

  return ctrl;
}

export async function findElement(selector, parent, callback, maxTime = 3000) {
  const ms = 200;
  const test = parent == null ? document : parent;

  return new Promise((resolve, reject) => {
    let current = 0;

    setInterval(function () {
      if (current >= maxTime) {
        reject(`Selector '${selector}' not found after ${maxTime / 1000}secs.`);
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

export function fireEvent(el, name) {
  el.dispatchEvent(new Event(name));
}

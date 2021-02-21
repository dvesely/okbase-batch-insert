import { wait } from "./commonUtil";
import { findElement, findFormElement, fireEvent } from "./domUtil";

/**
 * @typedef {Object} FormResult
 * @property {Element} dialog
 * @property {Element} form
 */

/**
 * @return {FormResult}
 */
export async function loadForm() {
  const insertButton = document.querySelector(".ContextMenuButton.is-vlozit");
  insertButton.click();

  const dialog = await findElement(".planovani-dialog");
  const form = await findElement(".PlanovaniDetail", dialog);
  //const formId = form.id;

  const typyPreruseni = findFormElement(form, "typyPreruseni");
  const btnOdDo = typyPreruseni.querySelector(".ButtonSelect");

  btnOdDo.click();

  await wait(100); // wait to init select boxes

  return {
    dialog,
    form,
  };
}

export async function closeDialog(dialog) {
  const btnClose = dialog.querySelector(
    '[data-dojo-attach-point="closeButtonNode"]'
  );

  btnClose.click();
}

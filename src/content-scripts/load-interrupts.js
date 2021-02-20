import { storage } from "../lib/storage";
import { getSelectBoxItems } from "../utils";
import { closeDialog, loadForm } from "../utils/okBaseUtil";

(function () {
  loadSelectBox().catch((error) => {
    alert(error);
  });
})();

async function loadSelectBox() {
  const { dialog, form } = await loadForm();

  const itemElements = Array.from(
    await getSelectBoxItems(form, "preruseniZacatek")
  );
  const items = itemElements.map((x) => x.innerText);

  document.body.click(itemElements && itemElements[0].click()); // close items;

  await storage.set("interruptItems", items);

  closeDialog(dialog);

  chrome.runtime.sendMessage("INTERRUPT_ITEMS_LOADED");
}

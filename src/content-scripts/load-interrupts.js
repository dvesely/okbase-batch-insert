import { storage } from "../lib/storage";
import { getSelectBoxItems } from "../utils";
import { closeDialog, loadForm } from "../utils/okBaseUtil";


(function () {
    //loadSelectBox();
    chrome.runtime.sendMessage("INTERRUPT_ITEMS_LOADED");
})();

async function loadSelectBox() {
    const { dialog, form } = await loadForm();

    const items = Array.from(await getSelectBoxItems(form, 'preruseniZacatek')).map(x => x.innerText);

    await storage.set('interruptItems', items);    

    

    closeDialog(dialog);
}
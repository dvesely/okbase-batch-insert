import hotReload from "./hot-reload";
import fillForm from "./fill-form";

let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});

//hotReload();
//fillForm();

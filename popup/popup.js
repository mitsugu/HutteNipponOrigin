// {{{
const mainURL = chrome.runtime.getURL("popup/main.html");
chrome.windows.create({
  url:    mainURL,
  type:   "popup",
  width:  656,
  height: 384
});
window.close();
// }}}


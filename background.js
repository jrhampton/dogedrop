/**
 * MV3 service worker. No default_popup is set on the action, so clicking
 * the toolbar icon fires onClicked here — we open (or focus) the game in
 * its own full tab rather than a small popup, since a physics game needs
 * real screen space and shouldn't die when the popup loses focus.
 */

async function openOrFocusGame() {
  const url = chrome.runtime.getURL('game.html');
  const existing = await chrome.tabs.query({ url });
  if (existing.length) {
    await chrome.tabs.update(existing[0].id, { active: true });
    await chrome.windows.update(existing[0].windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
}

chrome.action.onClicked.addListener(openOrFocusGame);

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('game.html') });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (sender.tab) {
    return false;
  }

  if (request.action === 'getCookies') {
    sendResponse({ cookie: document.cookie, source: 'document.cookie' });
    return true;
  }

  return false;
});

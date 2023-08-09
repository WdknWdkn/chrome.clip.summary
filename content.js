let selectedText = window.getSelection().toString();
chrome.runtime.sendMessage({text: selectedText});

var selectedText = "";
var promptName = "";

function createContextMenus() {
    // 既存のメニューを削除
    chrome.contextMenus.removeAll();

    // 登録されているプロンプトを取得してメニューを作成
    chrome.storage.sync.get('prompts', function(data) {
        let prompts = data.prompts || {};
        for (const [name,] of Object.entries(prompts)) {
            chrome.contextMenus.create({
                id: name,
                title: name,
                contexts: ["selection"]
              });
        }
    });
}

// 拡張機能起動時にメニューを作成
chrome.runtime.onStartup.addListener(createContextMenus);
chrome.runtime.onInstalled.addListener(createContextMenus);

chrome.contextMenus.onClicked.addListener(function(info, tab) {
    // 登録されているプロンプトを選択した場合の処理
    promptName = info.menuItemId;
    selectedText = info.selectionText;
    chrome.tabs.create({url: "popup.html"});
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "getSelectedText")
        sendResponse({selectedText: selectedText, promptName: promptName});
});

// プロンプトの変更を監視
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.prompts) {
        createContextMenus(); // プロンプト変更時にメニューを更新
    }
});

// 拡張機能アイコンがクリックされたときに新しいタブでpopup.htmlを開く
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: "popup.html" });
  });

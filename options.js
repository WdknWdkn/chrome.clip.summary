// APIキーの保存
document.getElementById('apiKeySaveButton').onclick = function() {
  let apiKey = document.getElementById('apiKey').value;
  chrome.storage.sync.set({ "apiKey": apiKey }, function() {
    console.log('Value is set to ' + apiKey);
    alert('APIキーを登録しました。');
  });
};

// プロンプトの保存
document.getElementById('promptSaveButton').onclick = function() {
  const promptName = document.getElementById('promptName').value;
  const prompt = document.getElementById('prompt').value;

  // 既存のプロンプトを取得して新しいプロンプトを追加
  chrome.storage.sync.get('prompts', function(data) {
    const prompts = data.prompts || {};
    prompts[promptName] = prompt;

    chrome.storage.sync.set({ "prompts": prompts }, function() {
      console.log('Prompt is saved with name ' + promptName);
      alert('プロンプトを登録しました。');
      loadPrompts(); // 更新後のプロンプトリストを表示
    });
  });
};

// プロンプトの削除
function deletePrompt(name) {
  chrome.storage.sync.get('prompts', function(data) {
    const prompts = data.prompts;
    delete prompts[name];

    chrome.storage.sync.set({ "prompts": prompts }, function() {
      console.log('Prompt with name ' + name + ' is deleted.');
      loadPrompts(); // 更新後のプロンプトリストを表示
    });
  });
}

// 登録済みプロンプト一覧の表示
function loadPrompts() {
  chrome.storage.sync.get('prompts', function(data) {
    const prompts = data.prompts || {};
    const table = document.querySelector('table');
    table.innerHTML = `
      <tr>
        <th>プロンプト名</th>
        <th>プロンプト内容</th>
        <th>削除</th>
      </tr>`;

    for (const [name, content] of Object.entries(prompts)) {
      const row = table.insertRow();
      const cell1 = row.insertCell(0);
      const cell2 = row.insertCell(1);
      const cell3 = row.insertCell(2);
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-primary';
      deleteButton.textContent = '削除';
      deleteButton.onclick = function() {
        deletePrompt(name);
      };

      cell1.textContent = name;
      cell2.textContent = content; // プロンプト内容の追加
      cell3.appendChild(deleteButton);
    }
  });
}

// 初期ロード時にプロンプト一覧を表示
loadPrompts();

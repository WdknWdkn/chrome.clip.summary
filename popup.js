class Investigator {
    constructor() {
        // エレメントの初期化
        this.loadingElement = document.getElementById('loading');
        this.promptSelectElement = document.getElementById('prompt_select');
        this.submitButton = document.getElementById('submit_button');
        this.inputElement = document.getElementById('input_error');
        this.questionElement = document.getElementById('question_error');
        this.resultElement = document.getElementById('result');
        this.promptWarningElement = document.getElementById('prompt_warning');

        // プロンプトのロード
        this.loadPrompts();
    }

    async loadPrompts() {
        const promptsResult = await this.getFromStorage('prompts');
        if (!promptsResult.prompts || Object.keys(promptsResult.prompts).length === 0) {
            this.submitButton.disabled = true;
            this.promptWarningElement.innerText = 'プロンプトが未登録です。設定から登録を行ってください'; // 追加：警告メッセージの設定
            return;
        }

        const promptKeys = Object.keys(promptsResult.prompts);

        for (let promptName of promptKeys) {
          const option = document.createElement('option');
          option.value = promptName;
          option.innerText = promptName;
          this.promptSelectElement.appendChild(option);
        }

        this.promptWarningElement.innerText = ''; // 警告メッセージのクリア
    }
  
    // Chromeストレージからキーに対応するデータを取得するメソッド
    async getFromStorage(key) {
        return new Promise(resolve => chrome.storage.sync.get([key], resolve));
    }
  
    // GPTリクエストをするメソッド
    async investigateExecute(selectedText, promptName) {
        // ローディングの表示と選択したテキストのセット
        this.resultElement.innerText = '';
        this.loadingElement.style.display = 'inline-block';
        this.inputElement.value = selectedText;
  
        // プロンプトの取得と表示
        const promptsResult = await this.getFromStorage('prompts');
        const promptContent = promptsResult.prompts[promptName];
        this.questionElement.innerText = promptContent;
  
        // APIキーの取得
        const apiKeyResult = await this.getFromStorage('apiKey');
        const apiKey = apiKeyResult.apiKey;
  
        // プロンプトメッセージの作成
        const promptMessage = {
            role: "user",
            content: promptContent + "「" + selectedText + "」"
        };
  
        try {
            // OpenAIのAPIリクエスト
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                // 'model': 'gpt-4',
                'model': 'gpt-3.5-turbo',
                'max_tokens': 1000,
                'temperature': 1,
                'top_p': 1,
                'n': 1,
                'stream': false,
                'messages': [promptMessage],
              })
            });
  
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
  
            // 応答データの処理
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            } else if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                this.resultElement.innerText = data.choices[0].message.content;
            } else {
                this.resultElement.innerText = "回答が見つかりませんでした。";
            }
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
            alert('エラーが発生しました: ' + error.message);
        } finally {
            // ローディングの非表示
            this.loadingElement.style.display = 'none';
        }
    }
}
  
// Investigatorクラスのインスタンス化
const investigator = new Investigator();
  
// 選択したテキストとプロンプト名を取得して調査を開始
chrome.runtime.sendMessage({method: "getSelectedText"}, function(response) {
    const selectedText = response.selectedText;
    const promptName = response.promptName;
    if (selectedText && promptName) {
        investigator.promptSelectElement.value = promptName; // 追加：プロンプト名の設定
        investigator.investigateExecute(selectedText, promptName);
    }
});
  
// 他の部分からのメッセージを受け取り、調査を開始
chrome.runtime.onMessage.addListener(function(request) {
    console.log(request);
    if (request.method === "getSelectedPrompt") {
        const selectedText = request.selectedText;
        const selectedPrompt = request.promptName;
        if (selectedText && selectedPrompt) {
          investigator.investigateExecute(selectedText, selectedPrompt);
        }
    }
});

  // submitボタンのクリックイベントリスナー
document.getElementById('submit_button').addEventListener('click', function() {
    const selectedText = document.getElementById('input_error').value;
    const selectedPrompt = document.getElementById('prompt_select').value;
    investigator.investigateExecute(selectedText, selectedPrompt);
});
  
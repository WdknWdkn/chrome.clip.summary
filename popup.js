class Investigator {
    constructor() {
        // エレメントの初期化
        this.loadingElement = document.getElementById('loading');
        this.promptSelectElement = document.getElementById('prompt_select');
        this.submitButton = document.getElementById('submit_button');
        this.inputElement = document.getElementById('input'); // IDを修正
        this.questionElement = document.getElementById('question'); // IDを修正
        this.resultElement = document.getElementById('result');
        this.promptWarningElement = document.getElementById('prompt_warning'); // 警告表示用エレメントの追加

        // プロンプトのロード
        this.loadPrompts();
    }

    async loadPrompts() {
        const promptsResult = await this.getFromStorage('prompts');
        if (!promptsResult.prompts || Object.keys(promptsResult.prompts).length === 0) {
            this.promptWarningElement.innerText = 'プロンプトが見つかりません。'; // 警告メッセージを設定
            return;
        }

        const promptKeys = Object.keys(promptsResult.prompts);
        for (let promptName of promptKeys) {
          const option = document.createElement('option');
          option.value = promptName;
          option.innerText = promptName;
          this.promptSelectElement.appendChild(option);
        }

        this.promptWarningElement.innerText = '';
    }

    async getFromStorage(key) {
        return new Promise(resolve => chrome.storage.sync.get([key], resolve));
    }

    async investigateExecute(selectedText, promptName) {
        this.resultElement.innerText = '';
        this.loadingElement.style.display = 'inline-block';
        this.inputElement.value = selectedText;

        const promptsResult = await this.getFromStorage('prompts');
        const promptContent = promptsResult.prompts?.[promptName] || '';
        this.questionElement.innerText = promptContent;

        const apiKeyResult = await this.getFromStorage('apiKey');
        const apiKey = apiKeyResult.apiKey;

        const promptMessage = {
            role: "user",
            content: promptContent ? `${promptContent}「${selectedText}」` : selectedText
        };

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                'model': 'gpt-4',
                'max_tokens': 1000,
                'temperature': 1,
                'top_p': 1,
                'n': 1,
                'stream': false,
                'messages': [promptMessage],
              })
            });

            if (!response.ok) {
                throw new Error('GPTリクエストに失敗しました。APIキーの設定を見直してください。');
            }

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
            this.resultElement.innerText = 'エラー: ' + error.message; // ユーザー向けエラーメッセージ
        } finally {
            this.loadingElement.style.display = 'none';
        }
    }
}

const investigator = new Investigator();

chrome.runtime.sendMessage({method: "getSelectedText"}, function(response) {
    const selectedText = response.selectedText;
    const promptName = response.promptName;
    if (selectedText && promptName) {
        investigator.promptSelectElement.value = promptName;
        investigator.investigateExecute(selectedText, promptName);
    }
});

chrome.runtime.onMessage.addListener(function(request) {
    if (request.method === "getSelectedPrompt") {
        investigator.investigateExecute(request.selectedText, request.promptName);
    }
});

document.getElementById('submit_button').addEventListener('click', function() {
    const selectedText = investigator.inputElement.value;
    const selectedPrompt = investigator.promptSelectElement.value;
    investigator.investigateExecute(selectedText, selectedPrompt);
});

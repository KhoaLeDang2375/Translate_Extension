const apiURL = "http://127.0.0.1:8000"; 

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "translate_and_show") {
    console.log("✅ Command nhận được: translate_and_show");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        console.error("❌ Không tìm thấy tab active");
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: "getSelectedText" }, async (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Không gửi được message tới content script:", chrome.runtime.lastError.message);
          return;
        }

        const selectedText = response?.text;
        if (!selectedText) {
          console.warn("⚠️ Không có văn bản được chọn");
          return;
        }

        try {
          const health = await fetch(`${apiURL}/health`);
          if (!health.ok) throw new Error("API not available");

          const payload = {
            text: selectedText,
            source_language: "en",
            target_language: "vi"
          };

          const res = await fetch(`${apiURL}/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!res.ok) throw new Error(`Lỗi: ${res.status}`);
          const result = await res.json();

          chrome.storage.local.set({
            sourceText: selectedText,
            translatedText: result.answer["text"]
          }, () => {
            console.log("✅ Đã lưu kết quả vào storage");
            chrome.windows.create({
              url: chrome.runtime.getURL("index.html"),
              type: "popup",
              width: 500,
              height: 550
            });
          });

        } catch (err) {
          console.error("❌ Lỗi khi dịch:", err);
        }
      });
    } catch (err) {
      console.error("❌ Lỗi xử lý command:", err);
    }
  }
});

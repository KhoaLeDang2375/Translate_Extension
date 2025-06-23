class TranslatorApp {
  constructor(apiURL) {
    this.apiURL = apiURL;
    this.init();
  }
  currentAudio   = null;       // <– audio đang phát
  currentUrl     = null;       // blob/objectURL của audio
  currentReader  = null;       // reader để hủy stream
  abortCtl       = null;       // AbortController cho fetch

  init() {
    this.setupTabSwitch();
    this.setupLanguageSwap();
    this.setupTranslateControl();
    this.setupListenButton();
    this.setupCopyPaste();
    this.setupTranslationTab();
    this.setupAskAi();
    this.setupSummary();
  }
setupSummary(){
  const summaryBtn   = document.querySelector('#aiSummary');
  const transTextEl  = document.querySelector('#translatedText');
  const sourceTextEl = document.querySelector('#sourceText');
  summaryBtn.addEventListener('click',async ()=>{
    const textForSummary = transTextEl?.value?.trim() || sourceTextEl?.value?.trim();
    if (!textForSummary) return;         // guard ‑ no input

    await this.summaryText(textForSummary);
    // Chuyển tab hiển thị kết quả
    document.querySelector('[data-target="aiSummaryText"]')?.click();
  })
}
async summaryText(text){
   try {
    // kiểm tra health
    const health = await fetch(`${this.apiURL}/health`);
    if (!health.ok) throw new Error('API not available');

    const res = await fetch(`${this.apiURL}/summarize-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({"text":text}),
    });
    if (!res.ok) throw new Error(`Lỗi: ${res.status}`);

    const result = await res.json();
    document.querySelector('#aiSummaryText').value = result.summary || '';
  } catch (err) {
    console.error(err);
    alert('Đã xảy ra lỗi khi tóm tắt văn bản.');
  }
}
setupAskAi() {
  const explainBtn   = document.querySelector('#aiExplainBtn');
  const sendContext  = document.querySelector('#sendToAI');
  const targetLangEl = document.querySelector('#targetLang');
  const transTextEl  = document.querySelector('#translatedText');
  const sourceTextEl = document.querySelector('#sourceText');

  // 1) Mở ô nhập ngữ cảnh (Bootstrap collapse đã cấu hình sẵn)
  //    Nếu bạn chỉ cần mở ô mà không đăng ký thêm JS ở đây, có thể bỏ listener này.

  // 2) Listener duy nhất cho nút "Gửi tới AI"
  sendContext.addEventListener('click', async () => {
    explainBtn?.click()
    const context = document.querySelector('#contextInput')?.value?.trim() || '';
    const targetLang = targetLangEl?.value || 'en';

    // Ưu tiên văn bản đã dịch, fallback sang gốc
    const textForAI = transTextEl?.value?.trim() || sourceTextEl?.value?.trim();
    if (!textForAI) return;         // guard ‑ no input

    await this.explainText(textForAI, targetLang, context);
    // Chuyển tab hiển thị kết quả
    document.querySelector('[data-target="aiExplainText"]')?.click();
  });
}

async explainText(text, targetLang = 'en', context = '') {
  try {
    // kiểm tra health
    const health = await fetch(`${this.apiURL}/health`);
    if (!health.ok) throw new Error('API not available');

    const payload = { text, target_language: targetLang, context };
    const res = await fetch(`${this.apiURL}/ask-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Lỗi: ${res.status}`);

    const result = await res.json();
    document.querySelector('#aiExplainText').value = result.answer || '';
  } catch (err) {
    console.error(err);
    alert('Đã xảy ra lỗi khi giải thích văn bản.');
  }
}
  
  setupTabSwitch() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        contents.forEach(section => {
          section.style.display = (tab.id === 'dictionaryTab') ? 'none' : 'block';
        });
      });
    });
  }

  setupLanguageSwap() {
    const swapBtn = document.querySelector('.swap-btn');
    swapBtn.addEventListener('click', () => {
      const sourceLang = document.querySelector('#sourceLang');
      const targetLang = document.querySelector('#targetLang');
      if (sourceLang.value === 'auto') {
        alert("You cannot swap 'auto' language with another language.");
      } else {
        [sourceLang.value, targetLang.value] = [targetLang.value, sourceLang.value];
      }
    });
  }

  setupTranslateControl() {
    const translateBtn = document.querySelector('#translateBtn');
    translateBtn.addEventListener('click', () => this.handleTranslate());
  }

  async handleTranslate() {
    const sourceText = document.querySelector('#sourceText').value.trim();
    const sourceLang = document.querySelector('#sourceLang').value;
    const targetLang = document.querySelector('#targetLang').value;

    if (!sourceText) {
      alert("Please enter some text to translate.");
      return;
    }

    if (sourceLang === targetLang) {
      alert("Source and target languages cannot be the same.");
      return;
    }

    await this.translate(sourceText, sourceLang, targetLang);
  }

  async translate(text, sourceLang, targetLang, context = "") {
    try {
      const health = await fetch(`${this.apiURL}/health`);
      if (!health.ok) throw new Error("API not available");

      const payload = {
        text,
        source_language: sourceLang,
        target_language: targetLang,
      };

      const res = await fetch(`${this.apiURL}/translate`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Lỗi: ${res.status}`);
      const result = await res.json();
      document.querySelector("#translatedText").value = result.answer["text"];
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi dịch.");
    }
     document.querySelector('[data-target="translatedText"]').click();
  }
  setupListenButton(){
    const listenBtnSource = document.querySelector("#speakSourceBtn");
    const listenBtnTrans = document.querySelector("#speakTransBtn");
    // Get Source text or Translated text
    listenBtnSource.addEventListener("click", async () => {
      if(this.currentAudio){
        this.stopAudio();
        listenBtnSource.textContent = '🔊 Play';
      }
      else{
        const sourceLang = document.querySelector('#sourceLang').value;
        const sourceText = document.querySelector("#sourceText").value;
        listenBtnSource.textContent ='⏹ Stop';
        await this.handleTTS(sourceText,sourceLang);
        this.currentAudio.onended = () => listenBtnSource.textContent = '🔊 Play'
      }
    })
    
    listenBtnTrans.addEventListener("click",async()=>{    
        if(this.currentAudio){
        this.stopAudio();
        listenBtnTrans.textContent = '🔊 Play';
        }  
        else{
        const targetLang = document.querySelector('#targetLang').value;
        const transText = document.querySelector(".provider-panel:not([hidden]").value;
        listenBtnTrans.textContent = '⏹ Stop';
        await this.handleTTS(transText,targetLang);
        this.currentAudio.onended = () => listenBtnTrans.textContent = '🔊 Play'
        }
    })

  }
  /** Hàm STOP chung cho mọi nơi gọi */
  stopAudio(){
    // 1. Hủy fetch streaming
    if (this.abortCtl) {          // ← kiểm tra tồn tại
    this.abortCtl.abort();
    this.abortCtl = null;
  }
    // 2. Dung audio va giai phong
    if(this.currentAudio){
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
    if(this.currentUrl){
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
  }
  async handleTTS(Text, Lang){
    // Huy tat ca cac audio dang phat
    this.stopAudio();
        const payload = {
        text: Text,
        lang: Lang 
      };

      // 1. Chuẩn bị AbortController
      this.abortCtl = new AbortController();
      const {signal} = this.abortCtl;
      //Call API
      const res = await fetch(`${this.apiURL}/tts`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal // Cho phep huy fetch 
      });

      if (!res.ok) throw new Error(`Lỗi: ${res.status}`);
      
      const mediaSource = new MediaSource();
      this.currentUrl = URL.createObjectURL(mediaSource)
      const audio = new Audio(this.currentUrl);
      this.currentAudio=audio
    
      mediaSource.addEventListener('sourceopen',async ()=>{
        const mimeType ='audio/mpeg';
        const sb =mediaSource.addSourceBuffer(mimeType);
        const reader =res.body.getReader();
        let started = false;
        async function pump() {
            const { value, done } = await reader.read();
            if (done || signal.aborted) {
            mediaSource.endOfStream();
            return;
            }
            sb.appendBuffer(value);
            if(!started){
              audio.play();
              started = true;
            }                      // đổ chunk vào buffer
            await new Promise(r => (sb.onupdateend = r));
            pump();
        }
        pump();
      });
  }
  setupCopyPaste(){
    const sourceCopyBtn = document.querySelector('#copySourceBtn');
    const transCopyBtn = document.querySelector('#copyTransBtn');
    const sourcePasteBtn = document.querySelector('#pasteBtn')
    sourceCopyBtn.addEventListener('click',()=>{
      const sourceText = document.querySelector('#sourceText').value;
      if(this.copyTextToClipboard(sourceText)){
        sourceCopyBtn.classList.add("success");
        setTimeout(function(){sourceCopyBtn.classList.remove("success")},1000)
    }
  })
    transCopyBtn.addEventListener('click',()=>{
        const transText = document.querySelector(".provider-panel:not([hidden])").value;
        if(this.copyTextToClipboard(transText)){
          transCopyBtn.classList.add('success');
          setTimeout(function(){transCopyBtn.classList.remove('success')},1000);
        }
    })
    sourcePasteBtn.addEventListener('click',()=>{
      const sourceText = document.querySelector('#sourceText');
      if(this.pasteFromClipboard(sourceText)){
        sourcePasteBtn.classList.add('success');
        setTimeout(function(){
          sourcePasteBtn.classList.remove('success');
        },1000)
      }
    })
  }
  async pasteFromClipboard(target){
    try{
        const text = await navigator.clipboard.readText();
        if(target){
          target.value=text;
          return true;
        }
    }
    catch(err){
      console.error(err);
    }
  }
  async copyTextToClipboard(text) {
    try{
        if(navigator.clipboard && window.isSecureContext){
          await navigator.clipboard.writeText(text);
          return true;
        }
    }
    catch(err){
      console.error('Copy failed: ',err);
      return false;
    }
  }
  setupTranslationTab() {
      document.getElementById('providerTabs').addEventListener('click', e => {
      const clickedTab = e.target.closest('.provider-tab');
      if (!clickedTab) return;

      // 1. Đánh dấu tab đang chọn
      document.querySelectorAll('.provider-tab').forEach(tab =>
        tab.classList.toggle('active', tab === clickedTab)
      );

      // 2. Ẩn/hiện textarea theo data-target
      const targetId = clickedTab.dataset.target;
      document.querySelectorAll('.provider-panel').forEach(textarea =>
        textarea.hidden = textarea.id !== targetId
      );
    });
  }
}

// Khởi tạo ứng dụng khi DOM đã load xong
document.addEventListener('DOMContentLoaded', () => {
  const app = new TranslatorApp("http://127.0.0.1:8000");
});

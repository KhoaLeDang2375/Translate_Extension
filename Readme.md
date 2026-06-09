# Text Translate Popup Extension

**Text Translate Popup** là một tiện ích mở rộng (Extension) dành cho các trình duyệt lõi Chromium (Chrome, Edge, Cốc Cốc, Brave,...) kết hợp với một backend **FastAPI** mạnh mẽ. Dự án cung cấp công cụ dịch thuật toàn diện, không chỉ dừng lại ở việc dịch thông thường mà còn hỗ trợ AI giải thích ngữ cảnh, tóm tắt văn bản và phát âm thanh (TTS).

## ✨ Tính năng nổi bật

*   **Dịch thuật đa ngôn ngữ**: Tích hợp Microsoft Azure Translator API để dịch văn bản nhanh chóng và chính xác.
*   **Giải thích bằng AI (Ask AI)**: Ứng dụng sức mạnh của mô hình Google Gemini 2.0 Flash để giải thích sâu hơn về văn bản và cung cấp thông tin theo ngữ cảnh bạn nhập.
*   **Tóm tắt AI (AI Summary)**: Trích xuất nội dung chính của các đoạn văn bản dài chỉ bằng một cú click.
*   **Text-to-Speech (TTS)**: Phát âm thanh (đọc văn bản) cho cả đoạn văn bản gốc và đoạn văn bản đã được dịch bằng thư viện `gTTS`.
*   **Tiện lợi & Nhanh chóng**: Hỗ trợ phím tắt mặc định `Ctrl+Shift+Y` để gọi nhanh popup. Nút sao chép và dán nhanh giúp trải nghiệm người dùng liền mạch.

## 📂 Cấu trúc dự án

Dự án được chia thành hai phần chính:

*   `myextension/`: Mã nguồn của tiện ích mở rộng (Frontend). Bao gồm file cấu hình `manifest.json` (V3), giao diện `index.html`, `popup.css`, `popup.js` và các script background.
*   `backend/`: Máy chủ API viết bằng Python (FastAPI). Xử lý các yêu cầu gọi từ Extension đến các dịch vụ bên thứ 3 (Google Gemini, Microsoft Azure, gTTS).
*   `render.yaml`: File cấu hình cho phép tự động deploy backend lên nền tảng đám mây [Render](https://render.com/).

## 🚀 Hướng dẫn cài đặt và khởi chạy

### 1. Cài đặt Backend (FastAPI)

Bạn cần có **Python 3.9+** trở lên.

1.  Mở terminal, di chuyển vào thư mục dự án và cài đặt các thư viện cần thiết:
    ```bash
    pip install -r requirements.txt
    ```

2.  Cấu hình biến môi trường:
    Tạo một file `.env` nằm trong thư mục `backend/` với nội dung sau:
    ```env
    # API key của Google Gemini
    GOOGLE_API_KEY=your_google_gemini_api_key

    # Cấu hình Microsoft Azure Translator
    MICROSOFT_API_KEY=your_azure_translator_api_key
    MICROSOFT_ENDPOINT=https://api.cognitive.microsofttranslator.com
    REGION=your_azure_region # Ví dụ: southeastasia
    ```

3.  Khởi chạy server FastAPI:
    ```bash
    uvicorn backend.main:app --host=0.0.0.0 --port=8000 --reload
    ```
    *Lưu ý: Mặc định backend sẽ chạy tại `http://127.0.0.1:8000`.*

### 2. Cài đặt Extension lên trình duyệt

1.  Mở trình duyệt (Chrome/Edge/Brave).
2.  Truy cập vào trang quản lý tiện ích:
    *   Chrome/Brave: `chrome://extensions/`
    *   Edge: `edge://extensions/`
3.  Bật **Developer mode** (Chế độ dành cho nhà phát triển) ở góc phải màn hình.
4.  Nhấp vào nút **Load unpacked** (Tải tiện ích đã giải nén).
5.  Chọn thư mục `myextension/` nằm trong dự án này.
6.  Ghim tiện ích lên thanh công cụ để dễ dàng sử dụng.

> **Lưu ý**: Đảm bảo URL kết nối API trong file `myextension/popup.js` (dòng 388) khớp với địa chỉ backend của bạn (mặc định là `http://127.0.0.1:8000`).

## ☁️ Triển khai (Deployment) lên Render

Dự án đã được tích hợp sẵn file `render.yaml` để bạn dễ dàng triển khai backend lên hệ thống [Render.com](https://render.com/).

1. Kết nối repo GitHub này với Render.
2. Render sẽ tự động nhận diện cấu hình từ `render.yaml` và build dịch vụ dưới dạng Web Service.
3. Đừng quên thêm các biến môi trường (`GOOGLE_API_KEY`, `MICROSOFT_API_KEY`,...) trong phần cấu hình Environment Variables của Render Dashboard.
4. Sau khi deploy thành công, cập nhật URL được Render cấp vào file `myextension/popup.js`:
    ```javascript
    const app = new TranslatorApp("https://your-app-name.onrender.com");
    ```

## 📜 Giấy phép (License)
Dự án được phân phối cho mục đích học tập và phát triển mã nguồn mở.

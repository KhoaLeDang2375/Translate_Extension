import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional,Union, Dict 
import os
from dotenv import load_dotenv
import logging
from datetime import datetime
from TTS import synthesize_tts # Khai bao ham sinh am thanh
import tempfile
from fastapi.responses import StreamingResponse, FileResponse
import uuid
from io import BytesIO
from Text_Translator import translator # Khai bao ham dich van ban
import httpx
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
#initialize FastAPI app
app = FastAPI(title="Generative AI API", description="API for Generative AI using Google Gemini", version="1.0.0")
# Cho phép gọi từ các frontend cụ thể
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         # "*" = cho phép tất cả (có thể thay bằng ['http://localhost:3000'])
    allow_credentials=True,
    allow_methods=["*"],         # GET, POST, PUT, DELETE, ...
    allow_headers=["*"],
)

# Load api key
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable is not set.")
# Initialize the Generative AI client
#Configure the client with the API key
genai.configure(api_key = API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

# Model for request/respone
class TranslationRequest(BaseModel):
    text: str
    source_language: Optional[str] = None            # None ⇒ auto
    target_language: Union[str, list[str]] = "vi"    # 1 chuỗi hoặc list
class TranslationResponse(BaseModel):
    answer: Dict[str, str]
    success: bool = True
    error_message: Optional[str] = None
class AiExplainRequest(BaseModel):
    text: str
    target_language: Optional[str] = None
    context: str = ''

class AIResponse(BaseModel):
    answer: str
    success: bool
    error_message: Optional[str] = None
class HealthResponse(BaseModel):
    status: str
    message: str

# Schema TTS yêu câu

class TTSRequest(BaseModel):
    text: str
    lang: Optional[str]='vi'
    download: Optional[bool] = False

class SummarizeRequest(BaseModel):
    text: str

@app.get("/")
async def roof():
    return "Welcome to API ask Gemini!!"
@app.get("/health")
async def health():
    return HealthResponse(status="healthy", message="Translation AI API is running")
# Send request Translation
@app.post("/translate")
async def translate(request: TranslationRequest):
    """
    Endpoint dành cho việc dịch thuật thông thường. Khi người dùng
    không yêu cầu giải thích bằng AI. Nhằm giảm tải số lượng token và cải thiện
    thời gian mỗi lần gửi request.

    Endpoint cung cấp khả năng dịch sang nhiều ngôn ngữ cùng một lúc.
    """
    try:
        if request.source_language == 'auto':
            request.source_language = " "
        # Goi ham dich thuat
        translated_raw_data=translator(request.text,request.source_language,request.target_language)
        if(not translated_raw_data):
            raise HTTPException(status_code=502, detail="Translator API không trả kết quả.")
        else:
            translateText = translated_raw_data[request.target_language]
            return TranslationResponse(
                answer = {"text":translateText},
                success = True,
            )
    except httpx.HTTPStatusError as exc:          # lỗi phía Azure
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=exc.response.text,
        )
    except Exception as e:
        logger.error("Error about tranlate function")
        return TranslationResponse(
            answer={"vi":"Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu dịch của bạn."},
            context_used="",
            success=False,
            error_message=str(e)
        ) 
#Send request Explain
@app.post("/ask-ai",response_model=AIResponse)
async def ask_ai_about_translation(request: AiExplainRequest):
    """
        Endpoint dành cho việc hỏi AI về văn bản cần dịch. 
        Có thể cung cấp thêm context của văn bản để có bản dịch hoàn thiện.
    """
    try:
        context = f"""
        Đoạn văn bản: {request.text}
    """
        if request.target_language:
            context +=f"Ngôn ngữ đích: {request.target_language}"

        # Make prompt for translate
        prompt = f"""
        Dựa vào đoạn văn bản tôi cung cấp: {context}
        Hãy thực hiện giải thích các khái niệm xoay quanh đoạn văn bản. Kết hợp với ngữ cảnh {request.context}
        Yêu cầu:
        - Chỉ cần trả về nội dung bản giải thích không hiển thị thông tin không liên quan.
        - Trả lời tối đa 200 từ.
        - Ngôn ngữ ngắn gọn và chính xác với ngữ cảnh.
        - Không trả về dưới dạng mark down 
    """
        # Call Gemini AI
        response = model.generate_content(prompt)

        return AIResponse(
            answer= response.text,
            success= True
        )
    except Exception as e:
        logger.error(f"Error in ask_ai_about_translation: {str(e)}")
        return AIResponse(
            answer="Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn.",
            context_used="",
            success=False,
            error_message=str(e)
        )
@app.post("/summarize-text")
async def summarize_text(request: SummarizeRequest):
    """
    Tóm tắt nội dung văn bản
    """
    try:
        prompt = f"""
        Tóm tắt nội dung chính của đoạn văn bản sau:
        
        {request.text}
        
        Yêu cầu:
        - Nêu các ý chính
        - Không quá 150 từ
        - Giữ nguyên thông tin quan trọng
        - Giữ nguyên ngôn ngữ ban đầu của đoạn văn bản đầu vào
        """
        response = model.generate_content(prompt)
        
        return {
            "summary": response.text,
            "original_length": len(request.text),
            "summary_length": len(response.text),
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error in summarize_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------- 3. Endpoint Phat am thanh ----------
@app.post("/tts")
async def TextToSpeech(req: TTSRequest):
     """
    Nhận JSON {'text':..., 'lang':..., 'download': bool}
    Trả về:
      • download=False (mặc định)  → StreamingResponse (audio/mpeg)
      • download=True              → FileResponse (attachment mp3)
    """
     from langdetect import detect
     if req.lang == 'auto':
         req.lang = detect(req.text)
     audio_bytes = synthesize_tts(req.text,req.lang)
     if req.download: # Tra ve duoi dang file
         # ghi tạm ra file để FileResponse
         tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
         tmp.write(audio_bytes)
         tmp.close()
         filename = f"tts_{uuid.uuid4().hex}.mp3"
         return FileResponse(
             tmp.name,
             media_type = "audio/mpeg",
             filename= filename,
             headers={"X-Delete-After": "true"},
         )
     return StreamingResponse(
         BytesIO(audio_bytes),
         media_type="audio/mpeg"
     )
             
# Endpoint để test từ extension
@app.get("/test")
async def test_endpoint():
    """Test endpoint cho extension"""
    return {
        "message": "API đang hoạt động bình thường",
        "timestamp": f"{datetime.now()}",
        "endpoints": [
            "/translate - Dịch văn bản",
            "/ask-ai - Giải thích bằng AI",
            "/summarize-text - Tóm tắt văn bản",
            "/tts - phát audio của văn bản"
        ]
    }       
         



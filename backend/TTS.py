from io import BytesIO
from gtts import gTTS
from langdetect import detect

# ---------- 2. Hàm sinh âm thanh ----------
def synthesize_tts(text: str, lang: str = "vi") -> bytes:
    tts = gTTS(text=text, lang=lang)
    mp3_fp = BytesIO()
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)
    return mp3_fp.read()


import json
import requests
import os
from dotenv import load_dotenv
from typing import Union, Iterable, Dict, Optional
load_dotenv()
# ======= CẤU HÌNH =======
KEY       = os.getenv("MICROSOFT_API_KEY")
ENDPOINT  = os.getenv("MICROSOFT_ENDPOINT")
LOCATION  = os.getenv("REGION")          # vd: southeastasia
def translator(
    text: str,
    source_lang: Optional[str] = " ",          # None hoặc '' -> auto‑detect
    target_langs: Union[str, Iterable[str]] = "vi",
    timeout: int = 10
) -> Optional[Dict[str, str]]:
    """
    Dịch `text` sang một hoặc nhiều ngôn ngữ.
    
    Parameters
    ----------
    text : str
    source_lang : str | None
        Mã ISO 639‑1 của ngôn ngữ gốc. Để None hoặc '' để auto‑detect.
    target_langs : str | Iterable[str]
        Một mã ngôn ngữ, hoặc list/tuple nhiều mã.
    timeout : int
        Thời gian chờ mạng (giây).

    Returns
    -------
    dict | None
        {lang: bản_dịch}, hoặc None nếu có lỗi.
    """
    # Chuẩn hoá target_langs thành list
    if isinstance(target_langs, str):
        target_langs = [target_langs]
    else:
        target_langs = list(target_langs)

    # Xây query‑string
    qs = ["api-version=3.0"]
    if source_lang:                 # nếu không muốn auto‑detect
        qs.append(f"from={source_lang}")
    qs.extend([f"to={lang}" for lang in target_langs])
    route = "/translate?" + "&".join(qs)

    headers = {
        "Ocp-Apim-Subscription-Key": KEY,
        "Ocp-Apim-Subscription-Region": LOCATION,
        "Content-Type": "application/json"
    }
    body = [{"Text": text}]

    try:
        resp = requests.post(
            ENDPOINT + route,
            headers=headers,
            json=body,
            timeout=timeout
        )
        resp.raise_for_status()                       # HTTP != 2xx -> exception
        data = resp.json()                            # list[0]["translations"]

        # Chuyển về dict {lang: text}
        translations = {
            item["to"]: item["text"] 
            for item in data[0]["translations"]
        }
        return translations

    except requests.exceptions.RequestException as err:
        print(f"⚠️  Translator API error: {err}")
        return None

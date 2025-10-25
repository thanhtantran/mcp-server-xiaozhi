# phatnguoi.py
from mcp.server.fastmcp import FastMCP
import requests
from PIL import Image
import io
import pytesseract
from bs4 import BeautifulSoup
import re

mcp = FastMCP("PhatNguoi")

BASE_URL = "https://www.csgt.vn"
CAPTCHA_URL = f"{BASE_URL}/lib/captcha/captcha.class.php"
FORM_URL = f"{BASE_URL}/?mod=contact&task=tracuu_post&ajax"
RESULTS_URL = f"{BASE_URL}/tra-cuu-phuong-tien-vi-pham.html"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Content-Type": "application/x-www-form-urlencoded",
}


def solve_captcha(session):
    r = session.get(CAPTCHA_URL)
    img = Image.open(io.BytesIO(r.content))
    text = pytesseract.image_to_string(img)
    return re.sub(r"[^A-Za-z0-9]", "", text).strip()


def extract_violations(html):
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", {"class": "table_list"})
    results = []
    if not table:
        return []

    rows = table.find_all("tr")[1:]  # skip header
    for row in rows:
        cols = [c.get_text(strip=True) for c in row.find_all("td")]
        if len(cols) >= 5:
            results.append({
                "stt": cols[0],
                "ngay_vi_pham": cols[1],
                "dia_diem": cols[2],
                "hanh_vi": cols[3],
                "don_vi_lap_bb": cols[4],
            })
    return results


@mcp.tool()
def phat_nguoi(bienso: str) -> dict:
    """
    Tra cứu thông tin phạt nguội từ CSGT.vn theo biển số xe.
    """
    with requests.Session() as session:
        session.headers.update(headers)

        for attempt in range(5):
            captcha = solve_captcha(session)
            data = {
                "BienKS": bienso,
                "Xe": "1",
                "captcha": captcha,
                "ipClient": "8.8.8.8",
                "cUrl": "1",
            }
            r = session.post(FORM_URL, data=data)
            if r.text.strip() != "404":
                break

        res = session.get(f"{RESULTS_URL}?LoaiXe=1&BienKiemSoat={bienso}")
        violations = extract_violations(res.text)

        if violations:
            return {"success": True, "plate": bienso, "violations": violations}
        else:
            return {"success": False, "message": "Không tìm thấy dữ liệu hoặc captcha sai."}


if __name__ == "__main__":
    mcp.run(transport="stdio")

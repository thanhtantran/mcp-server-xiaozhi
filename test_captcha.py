import io
import re
import requests
from PIL import Image
import pytesseract
from urllib3.exceptions import InsecureRequestWarning
import ssl
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager

# Disable SSL warnings
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

class SSLAdapter(HTTPAdapter):
    """
    Custom SSL adapter that uses older SSL context (like Node.js)
    """
    def init_poolmanager(self, *args, **kwargs):
        context = ssl.create_default_context()
        context.set_ciphers('DEFAULT@SECLEVEL=1')  # Allow older ciphers
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        kwargs['ssl_context'] = context
        return super().init_poolmanager(*args, **kwargs)

def create_session():
    """
    Create session with SSL adapter (mimics Node.js behavior)
    """
    session = requests.Session()
    session.mount('https://', SSLAdapter())
    session.verify = False
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    })
    return session

def solve_captcha(session, save_debug=False):
    """
    Solve CAPTCHA - matches your Node.js function
    """
    CAPTCHA_URL = "https://www.csgt.vn/lib/captcha/captcha.class.php"
    
    r = session.get(CAPTCHA_URL)
    img = Image.open(io.BytesIO(r.content))
    
    if save_debug:
        img.save('captcha_original.png')
    
    # Preprocessing
    img = img.convert('L')
    width, height = img.size
    img = img.resize((width * 3, height * 3), Image.LANCZOS)
    
    from PIL import ImageEnhance
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.5)
    
    img = img.point(lambda x: 0 if x < 140 else 255, '1')
    
    if save_debug:
        img.save('captcha_processed.png')
    
    text = pytesseract.image_to_string(img, config='--psm 7 --oem 3')
    return re.sub(r"[^A-Za-z0-9]", "", text).strip()

def post_form_data(session, plate, captcha):
    """
    Submit form data
    """
    FORM_ENDPOINT = "https://www.csgt.vn/?mod=contact&task=tracuu_post&ajax"
    
    form_data = {
        'BienKS': plate,
        'Xe': '1',
        'captcha': captcha,
        'ipClient': '9.9.9.91',
        'cUrl': '1',
    }
    
    response = session.post(
        FORM_ENDPOINT,
        data=form_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    
    return response

def get_violation_results(session, plate):
    """
    Fetch violation results
    """
    RESULTS_URL = f"https://www.csgt.vn/tra-cuu-phuong-tien-vi-pham.html?&LoaiXe=1&BienKiemSoat={plate}"
    return session.get(RESULTS_URL)

def call_api(plate, retries=5):
    """
    Main function - matches your Node.js callAPI
    """
    try:
        print(f"Fetching traffic violations for plate: {plate}")
        session = create_session()
        
        captcha = solve_captcha(session, save_debug=True)
        print(f"Using captcha: {captcha}")
        
        response = post_form_data(session, plate, captcha)
        
        # Handle failed captcha
        if response.text == '404' or response.status_code == 404:
            if retries > 0:
                print(f"Captcha verification failed '{captcha}'. Retrying... ({6-retries}/5)")
                return call_api(plate, retries - 1)
            else:
                raise Exception("Maximum retry attempts reached. Could not verify captcha.")
        
        results_response = get_violation_results(session, plate)
        
        # Here you would parse the HTML response
        # from extract_traffic_violations import extract_traffic_violations
        # violations = extract_traffic_violations(results_response.text)
        
        return results_response.text
        
    except Exception as error:
        print(f"Error fetching traffic violations for plate {plate}: {error}")
        return None

# Test it
if __name__ == "__main__":
    result = call_api("30H45467")
    if result:
        print("Success!")
        print(result[:500])  # Print first 500 chars

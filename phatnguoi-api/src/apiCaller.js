import axios from "axios";
import Tesseract from "tesseract.js";
import qs from "qs";
import fs from "fs";
import tough from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import { extractTrafficViolations } from "./extractTrafficViotations.js";

const { CookieJar } = tough;

/**
 * Configuration constants
 */
const CONFIG = {
  BASE_URL: "https://www.csgt.vn",
  CAPTCHA_PATH: "/lib/captcha/captcha.class.php",
  FORM_ENDPOINT: "/?mod=contact&task=tracuu_post&ajax",
  RESULTS_URL: "https://www.csgt.vn/tra-cuu-phuong-tien-vi-pham.html",
  MAX_RETRIES: 5,
  HEADERS: {
    USER_AGENT:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    ACCEPT:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    CONTENT_TYPE: "application/x-www-form-urlencoded",
  },
};

/**
 * Creates and configures an axios instance with cookie support
 * @returns {Object} Configured axios instance
 */
function createAxiosInstance() {
  const jar = new CookieJar();
  const instance = axios.create({
    jar,
    withCredentials: true,
    baseURL: CONFIG.BASE_URL,
    headers: {
      "User-Agent": CONFIG.HEADERS.USER_AGENT,
      Accept: CONFIG.HEADERS.ACCEPT,
    },
  });
  return wrapper(instance);
}

/**
 * Fetches and processes captcha image
 * @param {Object} instance - Axios instance
 * @returns {Promise<string>} Recognized captcha text
 */
async function getCaptcha(instance) {
  try {
    const image = await instance.get(CONFIG.CAPTCHA_PATH, {
      responseType: "arraybuffer",
    });

    // Optional: save captcha for debugging
    // fs.writeFileSync("captcha.jpg", Buffer.from(image.data), "binary");

    const captchaResult = await Tesseract.recognize(image.data);
    return captchaResult.data.text.trim();
  } catch (error) {
    throw new Error(`Failed to get or process captcha: ${error.message}`);
  }
}

/**
 * Submits form data with plate number and captcha
 * @param {Object} instance - Axios instance
 * @param {string} plate - License plate number
 * @param {string} captcha - Recognized captcha text
 * @returns {Promise<Object>} API response
 */
async function postFormData(instance, plate, captcha) {
  const formData = qs.stringify({
    BienKS: plate,
    Xe: "1",
    captcha,
    ipClient: "9.9.9.91",
    cUrl: "1",
  });

  return instance.post(CONFIG.FORM_ENDPOINT, formData, {
    headers: {
      "Content-Type": CONFIG.HEADERS.CONTENT_TYPE,
    },
  });
}

/**
 * Fetches traffic violation results
 * @param {Object} instance - Axios instance
 * @param {string} plate - License plate number
 * @returns {Promise<Object>} Results page response
 */
async function getViolationResults(instance, plate) {
  return instance.get(`${CONFIG.RESULTS_URL}?&LoaiXe=1&BienKiemSoat=${plate}`);
}

/**
 * Main function to call the traffic violation API
 * @param {string} plate - License plate number
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<Object|null>} Extracted traffic violations or null on failure
 */
export async function callAPI(plate, retries = CONFIG.MAX_RETRIES) {
  try {
    console.log("Fetching traffic violations for plate:", plate);
    const instance = createAxiosInstance();
    const captcha = await getCaptcha(instance);
    // console.log(`Using captcha: ${captcha}`);

    const response = await postFormData(instance, plate, captcha);

    // Handle failed captcha case
    if (response.data === 404) {
      if (retries > 0) {
        console.log(
          `Captcha verification failed ${captcha}. Retrying... (${
            CONFIG.MAX_RETRIES - retries + 1
          }/${CONFIG.MAX_RETRIES})`
        );
        return callAPI(plate, retries - 1);
      } else {
        throw new Error(
          "Maximum retry attempts reached. Could not verify captcha."
        );
      }
    }

    const resultsResponse = await getViolationResults(instance, plate);
    const violations = extractTrafficViolations(resultsResponse.data);

    return violations;
  } catch (error) {
    console.error(
      `Error fetching traffic violations for plate ${plate}:`,
      error.message
    );
    return null;
  }
}

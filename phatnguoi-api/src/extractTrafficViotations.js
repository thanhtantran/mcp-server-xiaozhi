import * as cheerio from "cheerio";

/**
 * Extracts traffic violation records from HTML
 * @param {string} html - The HTML content containing traffic violation records
 * @returns {Array} - Array of traffic violation record objects
 */
export function extractTrafficViolations(html) {
  const $ = cheerio.load(html);
  const violations = [];
  let currentViolation = {};
  let resolutionPlaces = [];

  // Find all form-group divs
  $(".form-group").each((index, element) => {
    // Check if this is a horizontal form-group with a label and value
    const label = $(element).find("label span").text().trim();
    const value = $(element).find(".col-md-9").text().trim();

    // If we find an hr tag, it means we're starting a new record
    if ($(element).next().is("hr") || $(element).prev().is("hr")) {
      if (Object.keys(currentViolation).length > 0) {
        // Add resolution places to the current violation before pushing
        currentViolation.resolutionPlaces = resolutionPlaces;
        violations.push(currentViolation);
        currentViolation = {};
        resolutionPlaces = [];
      }
    }

    // Process fields with label-value pairs
    if (label && value) {
      switch (label) {
        case "Biển kiểm soát:":
          currentViolation.licensePlate = value;
          break;
        case "Màu biển:":
          currentViolation.plateColor = value;
          break;
        case "Loại phương tiện:":
          currentViolation.vehicleType = value;
          break;
        case "Thời gian vi phạm:":
          currentViolation.violationTime = value;
          break;
        case "Địa điểm vi phạm:":
          currentViolation.violationLocation = value;
          break;
        case "Hành vi vi phạm:":
          currentViolation.violationBehavior = value;
          break;
        case "Trạng thái:":
          currentViolation.status = value;
          break;
        case "Đơn vị phát hiện vi phạm:":
          currentViolation.detectionUnit = value;
          break;
      }
    }

    // Process resolution places
    const text = $(element).text().trim();
    if (text.startsWith("1.") || text.startsWith("2.")) {
      // This is a resolution place
      resolutionPlaces.push({
        name: text,
      });
    } else if (text.startsWith("Địa chỉ:")) {
      // This is an address for the previous resolution place
      if (resolutionPlaces.length > 0) {
        resolutionPlaces[resolutionPlaces.length - 1].address = text
          .replace("Địa chỉ:", "")
          .trim();
      }
    }
  });

  // Add the last violation if it exists
  if (Object.keys(currentViolation).length > 0) {
    currentViolation.resolutionPlaces = resolutionPlaces;
    violations.push(currentViolation);
  }

  return violations;
}

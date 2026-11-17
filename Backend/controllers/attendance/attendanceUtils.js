// Helper: Normalize date to UTC midnight (00:00:00.000Z) without timezone shift
const getStartOfDay = (date) => {
  if (!date) date = new Date();

  if (typeof date === "string") {
    const datePart = date.split("T")[0];
    const [y, m, d] = datePart.split("-").map((n) => parseInt(n, 10));
    if (y && m && d) {
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    }
  }

  const d = date instanceof Date ? date : new Date(date);

  // If already normalized UTC midnight, use UTC getters
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  }

  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
};

// Helper: Get end of day in UTC (23:59:59.999Z)
const getEndOfDay = (date) => {
  if (!date) date = new Date();

  if (typeof date === "string") {
    const datePart = date.split("T")[0];
    const [y, m, d] = datePart.split("-").map((n) => parseInt(n, 10));
    if (y && m && d) {
      return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    }
  }

  const d = date instanceof Date ? date : new Date(date);

  if (d.getUTCHours() === 23 && d.getUTCMinutes() === 59 && d.getUTCSeconds() === 59) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
  }

  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999));
};

// Converts string times like "09:00 AM" or "06:00 PM" into today's equivalent Date object
const parseShiftTime = (timeStr, referenceDate = new Date()) => {
  if (!timeStr || typeof timeStr !== "string") return null;

  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = (match[3] || "").toUpperCase();

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const result = new Date(referenceDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

// Extracts numeric float from threshold string like "4.5 Hours"
const parseHalfDayThreshold = (thresholdStr) => {
  if (!thresholdStr) return 4.5;
  const parsed = parseFloat(thresholdStr);
  return isNaN(parsed) ? 4.5 : parsed;
};

// Extracts integer minutes from grace string like "15 Minutes"
const parseGraceMinutes = (gracePeriodStr) => {
  if (!gracePeriodStr) return 15;
  const parsed = parseInt(gracePeriodStr, 10);
  return isNaN(parsed) ? 15 : parsed;
};

module.exports = {
  getStartOfDay,
  getEndOfDay,
  parseShiftTime,
  parseHalfDayThreshold,
  parseGraceMinutes,
};

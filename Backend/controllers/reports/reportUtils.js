const formatDateStr = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: Parse date range filter
// Supports "week", "month", "quarter", "year", or custom startDate & endDate
const getDateRange = (range, customStart, customEnd) => {
  if (customStart && customEnd) {
    const start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();

  switch (range) {
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "quarter":
      start.setDate(end.getDate() - 90);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
    case "month":
    default:
      start.setDate(end.getDate() - 30);
      break;
  }
  start.setHours(0, 0, 0, 0);
  return { startDate: start, endDate: end };
};

// Helper: Apply Sandwich Rule
const applySandwichRule = (dailyReport) => {
  for (let i = 0; i < dailyReport.length; i++) {
    const current = dailyReport[i];

    // Sandwich sirf Weekly Off / Holiday par check hoga
    if (
      current.status !== "Weekly Off" &&
      current.status !== "Holiday"
    ) {
      continue;
    }

    let prevWorkingDay = null;

    for (let p = i - 1; p >= 0; p--) {
      const day = dailyReport[p];

      if (day.isWorkingDay && !day.isHoliday) {
        prevWorkingDay = day;
        break;
      }
    }

    let nextWorkingDay = null;

    for (let n = i + 1; n < dailyReport.length; n++) {
      const day = dailyReport[n];

      if (day.isWorkingDay && !day.isHoliday) {
        nextWorkingDay = day;
        break;
      }
    }

    // Dono working days hone chahiye
    if (prevWorkingDay && nextWorkingDay) {
      const isPrevAbsentOrUnpaid =
        prevWorkingDay.status === "Absent" ||
        (prevWorkingDay.status === "On Leave" &&
          prevWorkingDay.payType === "Unpaid");

      const isNextAbsentOrUnpaid =
        nextWorkingDay.status === "Absent" ||
        (nextWorkingDay.status === "On Leave" &&
          nextWorkingDay.payType === "Unpaid");

      if (isPrevAbsentOrUnpaid && isNextAbsentOrUnpaid) {
        current.isSandwiched = true;
        current.isLop = true;
        current.payType = "Unpaid";
        current.remark =
          "Sandwich Rule Applied: Preceded and succeeded by Absent/Unpaid Leave.";
      }
    }
  }
};

module.exports = {
  formatDateStr,
  getDateRange,
  applySandwichRule,
};

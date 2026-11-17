const MONTHS_LIST = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const MONTH_INDEX_MAP = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
};

// Helper: Calculate working days in a month
const getDaysInMonth = (year, monthName) => {
  const monthIdx = MONTH_INDEX_MAP[monthName];
  if (monthIdx === undefined) return 30;
  return new Date(year, monthIdx + 1, 0).getDate();
};

module.exports = {
  MONTHS_LIST,
  MONTH_INDEX_MAP,
  getDaysInMonth,
};

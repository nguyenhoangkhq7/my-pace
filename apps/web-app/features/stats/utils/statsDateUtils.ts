export const getRangeBounds = (refDate: Date, rangeType: "week" | "month" | "year") => {
  const date = new Date(refDate);

  if (rangeType === "week") {
    const day = date.getDay();
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  } else if (rangeType === "month") {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: startOfMonth, end: endOfMonth };
  } else {
    const startOfYear = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start: startOfYear, end: endOfYear };
  }
};

export const formatLabel = (start: Date, end: Date, rangeType: "week" | "month" | "year") => {
  const correctMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  if (rangeType === "week") {
    const startDay = start.getDate();
    const startMonth = correctMonths[start.getMonth()];
    const startYear = start.getFullYear();

    const endDay = end.getDate();
    const endMonth = correctMonths[end.getMonth()];
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      return `${startDay} ${startMonth} - ${endDay} ${endMonth}, ${startYear}`;
    } else {
      return `${startDay} ${startMonth}, ${startYear} - ${endDay} ${endMonth}, ${endYear}`;
    }
  } else if (rangeType === "month") {
    const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${fullMonths[start.getMonth()]}, ${start.getFullYear()}`;
  } else {
    return `${start.getFullYear()}`;
  }
};

export const formatDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const getDateByYearsAgo = (
  years: number,
  dayOffset: number = 0,
): Date => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  date.setDate(date.getDate() + dayOffset);
  return date;
};

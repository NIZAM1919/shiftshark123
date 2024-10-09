/**
 *
 * @param date
 * @returns '2022-03-15'
 */
export const getFormmattedDate = (date: Date, delimiter = '-') => {
  const formattedDate = [
    `${date.getFullYear()}`,
    `0${date.getMonth() + 1}`.substr(-2),
    `0${date.getDate()}`.substr(-2),
  ].join(delimiter);
  return formattedDate;
};

export const getCustomFormattedDate = (date: Date, delimiter = '-' , dateOrder=['D','M','Y']) => {
  const formattedDate = []
  const monthNamesList = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  for(let i =0 ;i<dateOrder.length;i++){
    if(dateOrder[i].toUpperCase() === 'M' || dateOrder[i].toUpperCase() === 'MM'){
      formattedDate.push(`0${date.getMonth() + 1}`.substr(-2))
    }
    if (dateOrder[i].toUpperCase() === 'MMM' || dateOrder[i].toUpperCase() === 'MON'){
      const monthName = monthNamesList[date.getMonth()].substr(0,3)
      formattedDate.push(monthName)
    }
    if (dateOrder[i].toUpperCase() === 'MONTH'){
      const monthName = monthNamesList[date.getMonth()]
      formattedDate.push(monthName)
    }
    if(dateOrder[i].toUpperCase() === 'D' || dateOrder[i].toUpperCase() === 'DD'){
      formattedDate.push(`0${date.getDate()}`.substr(-2))
    }
    if(dateOrder[i].toUpperCase() === 'Y' || dateOrder[i].toUpperCase() === 'YY' || dateOrder[i].toUpperCase() === 'YYYY'){
      formattedDate.push(`${date.getFullYear()}`)
    }
  }
  return formattedDate.join(delimiter)
}

/**
 * 
 * @param date 
 * @returns 
 *  {
      startOfMonth: 2022-07-01T18:30:00.000Z,
      endDateOfMonth: 2022-07-31T18:30:00.000Z
    }
 */
export const firstDayandLastDay = (
  date: Date,
): { startOfMonth: Date; endDateOfMonth: Date } => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDateOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { startOfMonth, endDateOfMonth };
};

/**
 *
 * @param date
 * @returns '15 March 2022'
 */
export const getStringDate = (date: Date) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const result = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  return result;
};

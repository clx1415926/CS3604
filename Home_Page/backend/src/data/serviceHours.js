function getServiceHours() {
  const daily = '购票相关业务每日 5:00 至次日 1:00';
  const tuesday = '（周二为 5:00 至 24:00）';
  return `${daily}${tuesday}`;
}

module.exports = { getServiceHours };